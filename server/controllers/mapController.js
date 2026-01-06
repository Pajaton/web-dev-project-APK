var express = require("express");
var router = express.Router();
var axios = require("axios");

const baseMapURL = "https://overpass-api.de/api/interpreter";
const baseToiletURL = "https://www.refugerestrooms.org/api/v1/restrooms/by_location";
const Systembolag = require("../models/SystembolagSchema.js")

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Gets cached map data or fetches and caches it.
 * @param {string} key - Cache key.
 * @param {Function} fetchFunction - Async function to fetch data if not cached.
 * @returns {Promise<any>} Cached or freshly fetched data.
 */
async function getMapData(key, fetchFunction) {
  const cachedData = cache.get(key);
  
  // return cached data if exists and not expired
  if (cachedData && Date.now() < cachedData.expiry) {
    return cachedData.data;
  }
  
  const data = await fetchFunction();
  
  // save to in-memory cache
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL
  });
  
  return data;
}

/**
 * Generates a cache key based on coordinates (rounded to reduce unique keys).
 * @param {string} prefix - Cache key prefix.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {string} Cache key.
 */
function getCacheKey(prefix, lat, lon) {
  // Round to ~1km precision to increase cache hits
  const roundedLat = Math.round(parseFloat(lat) * 100) / 100;
  const roundedLon = Math.round(parseFloat(lon) * 100) / 100;
  return `${prefix}:${roundedLat}:${roundedLon}`;
}

/**
 * Periodically cleans up expired cache entries.
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now >= value.expiry) {
      cache.delete(key);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

/**
 * Retries a request function with exponential backoff for transient errors.
 * @param {Function} requestFunction - The async function to retry.
 * @param {number} [maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [delayMs=1000] - Initial delay between retries in milliseconds.
 * @returns {Promise<any>} The result of the successful request.
 * @throws {Error} Throws the last error if all retries fail.
 */
async function retryMapDataFetch(requestFunction, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFunction();
    } catch (error) {
      const status = error.response?.status;
      const isRetryable = [502, 503, 504].includes(status) || error.code === 'ECONNRESET';
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // exponential backoff
    }
  }
}

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula.
 * @param {Object} nodeA - First node with lat/lon properties.
 * @param {number} nodeA.lat - Latitude of the first node.
 * @param {number} nodeA.lon - Longitude of the first node.
 * @param {Object} nodeB - Second node with lat/lon properties.
 * @param {number} nodeB.lat - Latitude of the second node.
 * @param {number} nodeB.lon - Longitude of the second node.
 * @returns {number} Distance between the two points in meters.
 */
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

/**
 * Converts degrees to radians.
 * @param {number} degrees - Angle in degrees.
 * @returns {number} Angle in radians.
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Builds a graph representation from OpenStreetMap elements.
 * Creates an adjacency list of walkable paths with distances as weights.
 * @param {Array<Object>} elements - Array of OSM elements (nodes and ways).
 * @returns {Object} Graph object containing nodes lookup and adjacency list.
 * @returns {Object} return.nodes - Lookup object mapping node IDs to their coordinates.
 * @returns {Object} return.adjacencyList - Adjacency list mapping node IDs to connected nodes with weights.
 */
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

/**
 * Formats a display name for a location based on its tags and type.
 * @param {Object} location - Location object from OSM or external API.
 * @param {string} locationType - Type of location (e.g., "Systembolag", "toilets").
 * @returns {string} Formatted location name.
 */
function formatLocationName(location, locationType) {
  let locationName = locationType
  const tags = location.tags || {}

  if (tags.branch !== undefined) locationName += ` ${tags.branch}`
  else if (tags['addr:street']) locationName += ` ${tags['addr:street']}`
  else if (location.street) locationName += ` ${location.street}`
  else if (location.name) locationName = location.name

  return locationName
}

/**
 * Transforms raw location data into a standardized format.
 * @param {Array<Object>} locations - Array of raw location objects.
 * @param {string} locationType - Type of location for naming purposes.
 * @returns {Array<Object>} Array of formatted location objects with standardized properties.
 */
function formatLocationData(locations, locationType) {
  return locations.map(location => {
    const tags = location.tags || {}
    
    return {
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
      directions: location.directions,
      comment: location.comment,
      upvotes: location.upvote,
      downvotes: location.downvote
    }
  })
}

/**
 * Saves or updates location data in the database using bulk upsert.
 * Only inserts new locations; existing ones are not modified.
 * @param {Array<Object>} locations - Array of formatted location objects to save.
 * @returns {Promise<void>}
 */
async function saveLocationsToDb(locations) {
  const operations = locations.map(location => ({
    updateOne: {
      filter: { systembolagID: location.id },
      update: { $setOnInsert: location },
      upsert: true
    }
  }))
  await Systembolag.bulkWrite(operations)
}

/**
 * Fetches map data (walkable paths) for routing between user and target locations.
 * Queries the Overpass API for highway data within the bounding box.
 * @param {number} userLat - User's latitude.
 * @param {number} userLon - User's longitude.
 * @param {Array<Object>} locations - Array of target location objects.
 * @param {string} locationType - Type of locations being queried.
 * @returns {Promise<Object>} Object containing target locations and graph data.
 * @throws {Error} Throws if Overpass API returns invalid data.
 */
async function getLocationMapData(userLat, userLon, locations, locationType) {
  const targetLocationData = formatLocationData(locations, locationType);
  await saveLocationsToDb(locations);
  const {south, north, west, east} = getBoundingBox(userLat, userLon, targetLocationData);

  if (isNaN(south) || isNaN(north) || isNaN(west) || isNaN(east)) {
    throw new Error("Invalid bounding box coordinates");
  }

  const cacheKey = `map:${south.toFixed(3)}:${north.toFixed(3)}:${west.toFixed(3)}:${east.toFixed(3)}`;  
  const graphData = await getMapData(cacheKey, async () => {
    const query = `[out:json][timeout:60];
      (way["highway"](${south},${west},${north},${east}););
      (._;>;);
      out body;`;

    const params = new URLSearchParams();
    params.append('data', query);

    const rawMapData = await retryMapDataFetch(
      () => axios.post(baseMapURL, params, { timeout: 65000 })
    );
    
    const elements = rawMapData.data?.elements;
    if (!elements || !Array.isArray(elements)) {
      throw new Error("Invalid response from Overpass API: missing elements");
    }
    
    return buildGraph(elements);
  });
  
  return {
    'targetLocations': targetLocationData,
    'nodes': graphData.nodes,
    'adjacencyList': graphData.adjacencyList,
  };
}

/**
 * Calculates a bounding box that encompasses the user and all target locations.
 * Limits the maximum span to prevent excessively large queries.
 * @param {number} userLat - User's latitude.
 * @param {number} userLon - User's longitude.
 * @param {Array<Object>} locationCoordinates - Array of location objects with lat/lon.
 * @returns {Object} Bounding box with south, north, west, east coordinates.
 */
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

/**
 * Finds nearby Systembolaget stores using the Overpass API.
 * Searches within a 5km radius of the user's position.
 * @param {number} userLat - User's latitude.
 * @param {number} userLon - User's longitude.
 * @returns {Promise<Array<Object>>} Array of Systembolaget location elements.
 * @throws {Error} Throws if no locations are found nearby.
 */
async function findSystembolag(userLat, userLon) {
  const cacheKey = getCacheKey('systembolag', userLat, userLon);
  
  return getMapData(cacheKey, async () => {
    const query = `[out:json][timeout:25];
      nwr
      ["name"="Systembolaget"]
      (around:5000,${userLat},${userLon});
      out center;`;
    const searchParams = new URLSearchParams({ data: query });

    const response = await retryMapDataFetch(
      () => axios.post(baseMapURL, searchParams, { timeout: 25000 })
    );
    const elements = response.data?.elements;

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return [];
    }

    return elements;
  });
}

/**
 * Finds nearby accessible restrooms using the Refuge Restrooms API.
 * Returns up to 20 restrooms sorted by proximity.
 * @param {number} userLat - User's latitude.
 * @param {number} userLon - User's longitude.
 * @returns {Promise<Array<Object>>} Array of restroom location objects.
 */
async function findToilets(userLat, userLon) {
  const cacheKey = getCacheKey('toilets', userLat, userLon);
  
  return getMapData(cacheKey, async () => {
    const query = `?page=1&per_page=20&offset=0&lat=${userLat}&lng=${userLon}`;
    const response = await axios.get(baseToiletURL + query);

    if (!response.data || response.data.length === 0) {
      return [];
    }
    
    const toiletLocations = response.data.filter(location => {
      return location.latitude !== undefined && location.longitude !== undefined;
    });

    return toiletLocations;
  });
}

/**
 * @route GET /maps/coordinates
 * @description Fetches map data and nearby locations based on user position and type.
 * @query {string} userLat - User's latitude (required).
 * @query {string} userLon - User's longitude (required).
 * @query {string} type - Location type: "systembolag" or "toilets" (required).
 * @returns {Object} 200 - Map data with target locations, nodes, and adjacency list.
 * @returns {Object} 400 - Missing or invalid query parameters.
 * @returns {Object} 404 - No locations found nearby.
 */
router.get("/maps/coordinates", async (req, res, next) => {
  try {
    let locations;
    const { userLat, userLon, type} = req.query;

    if (!userLat || !userLon || !type) {
      return res.status(400).json({ "message": "Missing required query parameters." });
    }

    switch (type.toLowerCase()) {
      case "systembolag":
        locations = await findSystembolag(userLat, userLon);

        if (locations.length === 0) {
          return res.status(404).json({ "message": "No Systembolaget locations found nearby."});
        }

        break;

      case "toilets":
        locations = await findToilets(userLat, userLon);

        if (locations.length === 0) {
          return res.status(404).json({ "message": "No public toilets found nearby."});
        }

        break;

      default:
        return res.status(400).json({ "message": "Invalid type parameter."});
    }

    const mapData = await getLocationMapData(
      parseFloat(userLat),
      parseFloat(userLon),
      locations,
      type
    );
        
    return res.json(mapData);

  } catch(err) {
    switch (err.response?.status) {
      case 400:
        return res.status(400).json({ "message": "Bad request to map service. Please check your parameters." });
      case 429:
        return res.status(429).json({ "message": "Map service rate limit exceeded. Please try again later." });
      case 502:
      case 503:
        return res.status(503).json({ "message": "Map service is currently unavailable. Please try again later." });
      case 504:
        return res.status(504).json({ "message": "Map service timed out. Please try again." });
    }

    return next(err);
  };
});

module.exports = router;
