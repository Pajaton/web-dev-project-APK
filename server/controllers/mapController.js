var express = require("express");
var router = express.Router();
var axios = require("axios");

// const baseMapURL = "https://overpass-api.de/api/interpreter";
const baseMapURL = "https://overpass.private.coffee/api/interpreter";
const baseToiletURL = "https://www.refugerestrooms.org/api/v1/restrooms/by_location";
const Systembolag = require("../models/SystembolagSchema.js")

// Retry helper for Overpass API
async function retryMapDataFetch(requestFunction, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFunction();
    } catch (error) {
      const status = error.response?.status;
      const isRetryable = status === 504 || status === 502 || status === 503 || error.code === 'ECONNRESET';
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Overpass API attempt ${attempt}/${maxRetries} failed (${status || error.code}), retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // exponential backoff
    }
  }
}

// Haversine formula to calculate distance between two lat/lon points
// possibly a bit overkill
function getDistance(nodeA, nodeB) {
  const R = 6371e3; // radius of earth in meters
  const latA = toRadians(nodeA.lat);
  const latB = toRadians(nodeB.lat);
  const deltaLat = toRadians(nodeB.lat - nodeA.lat);
  const deltaLon = toRadians(nodeB.lon - nodeA.lon);
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(latA) * Math.cos(latB) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function buildGraph(elements) {
  const nodeLookup = {};
  const adjacencyList = {};

  // Create node lookup
  elements.forEach(element => {
    if (element.type === 'node') {
      nodeLookup[element.id] = {
        id: element.id,
        lat: element.lat,
        lon: element.lon
        };
    }
  });

  elements.forEach(element => {
    if (element.type === 'way' && element.nodes) {
      const pathNodes = element.nodes;

      for (let i = 0; i < pathNodes.length - 1; i++) {
        const fromId = pathNodes[i];
        const toId = pathNodes[i + 1];

        // ensure node exists in lookup
        if (nodeLookup[fromId] && nodeLookup[toId]) {
          const distance = getDistance(nodeLookup[fromId], nodeLookup[toId]);

          // init arrays if not yet existing
          if (!adjacencyList[fromId]) adjacencyList[fromId] = [];
          if (!adjacencyList[toId]) adjacencyList[toId] = [];

          adjacencyList[fromId].push({ 'node': toId, 'weight': distance });

          // if not one-way, add reverse direction
          if (!element.tags || element.tags.oneway !== 'yes')  {
            adjacencyList[toId].push({ 'node': fromId, 'weight': distance });
          }
        }
      }
    }
  });

  return {
    'nodes': nodeLookup,
    'adjacencyList': adjacencyList
  };
}

function formatLocationName(location, locationType) {
  let locationName = locationType
  const tags = location.tags || {}

  if (tags.branch !== undefined) locationName += ` ${tags.branch}`
  else if (tags['addr:street']) locationName += ` ${tags['addr:street']}`
  else if (location.street) locationName += ` ${location.street}`
  else if (location.name) locationName = location.name

  return locationName
}

async function formatLocationData(locations, locationType) {
  const targetLocationData = await Promise.all(locations.map(async location => {
    const tags = location.tags || {};
    
    const locationData = {
      id: location.id,
      name: formatLocationName(location, locationType),
      street: tags['addr:street'] || location.street,
      streetNumber: tags['addr:housenumber'],
      postalCode: tags['addr:postcode'],
      city: tags['addr:city'] || location.city,
      lat: location.lat || location.center?.lat || location.latitude,
      lon: location.lon || location.center?.lon || location.longitude,
      openHours: tags.opening_hours,
      accessible: tags.wheelchair || location.accessible,
      changingTable: location.changing_table,
      unisex: location.unisex,
      upvotes: location.upvote,
      downvotes: location.downvote
    };

    await Systembolag.updateOne(
      { systembolagID: location.id },
      { $setOnInsert: locationData },
      { upsert: true }
    );

    return locationData;
  }));

  return targetLocationData;
}

// fetch the map data (ways/edges) based on the user position and the locations
async function getLocationMapData(userLat, userLon, locations, locationType) {
  const targetLocationData = await formatLocationData(locations, locationType);
  const {south, north, west, east} = getBoundingBox(userLat, userLon, targetLocationData);

  if (isNaN(south) || isNaN(north) || isNaN(west) || isNaN(east)) {
    throw new Error("Invalid bounding box coordinates");
  }

  const query = `[out:json][timeout:60];
    (way["highway"](${south},${west},${north},${east}););
    (._;>;);
    out body;`;

  try {
    const params = new URLSearchParams();
    params.append('data', query);

    const rawMapData = await retryMapDataFetch(
      () => axios.post(baseMapURL, params, { timeout: 65000 })
    );
    const graphData = buildGraph(rawMapData.data.elements);
    
    return {
      'targetLocations': targetLocationData,
      'nodes': graphData.nodes,
      'adjacencyList': graphData.adjacencyList,
    };
  } catch (error) {
    console.error("Error fetching map data:", error);
    console.error(error.response.data);
    throw error;
  }
}

// based on a user's position and initially fetched locations, we
// get the bounding box to fetch only the map data we need
function getBoundingBox(userLat, userLon, locationCoordinates) {
  let south = userLat;
  let north = userLat;
  let west = userLon;
  let east = userLon;

  const padding = 0.001; // roughly 100m

  locationCoordinates.forEach(location => {
    const lat = location.lat || (location.center && location.center.lat);
    const lon = location.lon || (location.center && location.center.lon);

    if (lat !== undefined && lon !== undefined) {
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      west = Math.min(west, lon);
      east = Math.max(east, lon);
    }
  });

  // limit max bounding box size to prevent massive queries
  const maxSpan = 0.20; // roughly 20km
  const latSpan = north - south;
  const lonSpan = east - west;
  
  if (latSpan > maxSpan || lonSpan > maxSpan) {
    
    console.warn(`Bounding box too large (${latSpan.toFixed(4)} x ${lonSpan.toFixed(4)}), clamping to ${maxSpan}`);
    
    // recenter
    const centerLat = (north + south) / 2;
    const centerLon = (east + west) / 2;

    // set new bounds
    south = centerLat - maxSpan / 2;
    north = centerLat + maxSpan / 2;
    west = centerLon - maxSpan / 2;
    east = centerLon + maxSpan / 2;
  }

  return { 
    south: south - padding, 
    north: north + padding, 
    west: west - padding, 
    east: east + padding 
  };
}

// Gets the coordinates and general info of nearby Systembolaget locations using Overpass API
async function findSystembolag(userLat, userLon) {
  const query = `[out:json][timeout:60];
    nwr
    ["name"="Systembolaget"]
    (around:5000,${userLat},${userLon});
    out center;`;
  const searchParams = new URLSearchParams({ data: query} );

  const response = await retryMapDataFetch(
    () => axios.post(baseMapURL, searchParams, { timeout: 65000 })
  );
  const elements = response.data.elements;

  if (elements.length === 0) {
    throw new Error("No Systembolaget locations found nearby");
  }

  return response.data.elements;
}

// based on a user's lat and lon values, gets the nearest few toilets
async function findToilets(userLat, userLon) {
  const query = `?page=1&per_page=20&offset=0&lat=${userLat}&lng=${userLon}`

  const response = await axios.get(baseToiletURL + query)
  
  // ensure we only include toilets which have lat and lon values
  const toiletLocations = response.data.filter(location => {
    return location.latitude !== undefined && location.longitude !== undefined
  })

  return toiletLocations
}

// GET ROUTES DEFINITION

router.get("/maps/coordinates", async (req, res, next) => {
  try {
    let locations;
    const { userLat, userLon, type} = req.query;

    if (!userLat || !userLon || !type) {
      return status(400).json({ "message": "Missing required query parameters." });
    }

    switch (type.toLowerCase()) {
      case "systembolag":
        locations = await findSystembolag(userLat, userLon);
        break;

      case "toilets":
        locations = await findToilets(userLat, userLon);
        break;

      default:
        return res.status(400).json({ "message": "Invalid type parameter."});
        break;
    }

    const mapData = await getLocationMapData(
      parseFloat(userLat),
      parseFloat(userLon),
      locations,
      type
    );
        
    return res.json(mapData);

  } catch(err) {next(err)};
});

module.exports = router;
