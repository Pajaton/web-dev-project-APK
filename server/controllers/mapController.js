var express = require("express");
var router = express.Router();
var axios = require("axios");

const baseURL = "https://overpass-api.de/api/interpreter";
const Systembolag = require("../models/SystembolagSchema.js")

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

// var MapLocation = require("../models/MapSchema");
async function getLocationMapData(userLat, userLng, locations) {
  const targetLocationData = await Promise.all(locations.map(async location => {

    const count = await Systembolag.countDocuments({ systembolagID: location.id })
    let systembolagsName = 'Systembolaget'

    if (location.tags.branch) {
      systembolagsName += ` ${location.tags.branch}`
    } else if (location.tags['addr:street']) {
      systembolagsName += ` ${location.tags['addr:street']} ${location.tags['addr:housenumber']}`
    }

    // unify the data format to increase readability
    if (count == 0) {
      const newSystembolag = new Systembolag({
        systembolagID: location.id,
        name: systembolagsName,
        street: location.tags['addr:street'],
        streetNumber: location.tags['addr:housenumber'],
        postalCode: location.tags['addr:postcode'],
        city: location.tags['addr:city'],
        latitude: location.lat || (location.center && location.center.lat),
        longitude: location.lon || (location.center && location.center.lon)
      })
      const addedSuccessfully = await newSystembolag.save() // can remove variable assignment if unused?
    }
    return {
      id: location.id,
      name: location.tags.name,
      branch: location.tags.branch,
      openHours: location.tags.opening_hours,
      wheelchair: location.tags.wheelchair,
      address: {
        city: location.tags['addr:city'],
        street: location.tags['addr:street'],
        streetNumber: location.tags['addr:housenumber'],
        postalCode: location.tags['addr:postcode']
      },
      lat: location.lat || (location.center && location.center.lat),
      lon: location.lon || (location.center && location.center.lon)
    };
  }))

  const {south, north, west, east} = getBoundingBox(userLat, userLng, targetLocationData);

  if (isNaN(south) || isNaN(north) || isNaN(west) || isNaN(east)) {
    throw new Error("Invalid bounding box coordinates");
  }

  const query = `[out:json][timeout:25];
    (way["highway"](${south},${west},${north},${east}););
    (._;>;);
    out body;`;

  try {
    const params = new URLSearchParams();
    params.append('data', query);

    const rawMapData = await axios.post(baseURL, params);
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

function getBoundingBox(userLat, userLng, locationCoordinates) {
  let south = userLat;
  let north = userLat;
  let west = userLng;
  let east = userLng;

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

  return { south, north, west, east };
}

async function findSystembolag(userLat, userLng) {
  const query = `[out:json];
    nwr
    ["name"="Systembolaget"]
    (around:5000,${userLat},${userLng});
    out center;`;

  const response = await axios.post(baseURL, new URLSearchParams({ data: query }));
  const elements = response.data.elements;

  if (elements.length === 0) {
    throw new Error("No Systembolaget locations found nearby");
  }

  return response.data.elements;
}

// GET ROUTES DEFINITION

// Gets the coordinates of nearby Systembolaget locations using Overpass API
router.get("/maps/coordinates", async (req, res, next) => {
  try {
    const { userLat, userLng, type} = req.query;

    if (!userLat || !userLng) {
      return res.status(400).json({ "message": "Missing required query parameters 'userLat' and 'userLng'" });
    }

    const locations = type === "Systembolag" ? await findSystembolag(userLat, userLng) : await findToiletCoords(userLat, userLng);
    const mapData = await getLocationMapData(parseFloat(userLat), parseFloat(userLng), locations);
        
    return res.json(mapData);

  } catch(err) {next(err)};
});

module.exports = router;
