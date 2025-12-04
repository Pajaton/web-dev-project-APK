var express = require("express");
var router = express.Router();

// var MapLocation = require("../models/MapSchema");

// GET ROUTES DEFINITION

// Gets the coordinates of nearby Systembolaget locations using Overpass API
router.get("/maps/coordinates", async (req, res, next) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ "message": "Missing required query parameters 'lat' and 'lng'" });
        }

        const nearestUrl = "https://overpass-api.de/api/interpreter";
        const query = `[out:json];
            nwr
            ["name"="Systembolaget"]
            (around:5000,${lat},${lng});
            out center;`;

        fetch(nearestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: "data=" + encodeURIComponent(query) // converts to URL encoded format ('[' to %5B etc.)
            })
            .then(response => response.json())
            .then(data => {
                if (!data.elements || data.elements.length === 0) {
                    return res.status(404).json({"message": "No locations found"});
                }
                return res.json({"locations": data.elements});
            })
            .catch(err => { next(err) });
    } catch(err) {next(err)};
});

module.exports = router;