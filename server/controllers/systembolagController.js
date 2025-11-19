var express = require("express");
var router = express.Router();
var express = require("express");
var router = express.Router();

var Systembolag = require("../models/SystembolagSchema");

// GET ROUTE DEFINITIONS

// Get a list of Systembolaget stores
router.get("/api/v1/systembolag", async (req, res) => {
    const systembolag = await Systembolag.find();

    return res.json({ "systembolag": systembolag });
});

// Get a list of products available at Systembolaget
router.get("/api/v1/systembolag/products", async (req, res) => {
    // Logic to get list of products
});

// Get details of a specific product
router.get("/api/v1/systembolag/products/:productId", async (req, res) => {
    // Logic to get product details
});

router.get("/api/v1/systembolag/:systembolagId/products", async (req, res) => {
    // Logic to get list of products available at a specific store
});

// Get product availability at specific stores
router.get("/api/v1/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to get product availability
});

// Get the location of a specific Systembolaget store
router.get("/api/v1/systembolag/:systembolagId/address", async (req, res) => {
    // Logic to get a Systembolaget store's address
});

// Get details of a specific Systembolaget store
router.get("/api/v1/systembolag/:systembolagId", async (req, res) => {
    const id = req.params.systembolagId;
    const mySystembolag = await Systembolag.findById(id).catch(err => {
        res.status(404).json({
            "message": "No systembolag found"
        });
    });

    return res.json(mySystembolag)
});


// POST ROUTE DEFINITIONS

// Add a new Systembolaget store
router.post("/api/v1/systembolag", async (req, res, next) => {
    var newSystembolag = new Systembolag({
        "systembolagID": req.body.systembolagID,
        "name": req.body.name,
        "street": req.body.street,
        "streetNumber": req.body.streetNumber,
        "postalCode": req.body.postalCode,
        "city": req.body.city,
        "longitude": req.body.longitude,
        "latitude": req.body.latitude,
    });
    await newSystembolag.save().catch(err => { next(err) });

    return res.status(201).json(newSystembolag);
});

// Add a new product to Systembolaget
router.post("/api/v1/systembolag/products", async (req, res) => {
    // Logic to add a new product
});

// Add a new product to a specific Systembolaget store
router.post("/api/v1/systembolag/:systembolagId/products", async (req, res) => {
    // Logic to add a new product to a specific store
});


// PATCH ROUTE DEFINITIONS


// Update details of a specific Systembolaget store
router.patch("/api/v1/systembolag/:systembolagId", async (req, res, next) => {
    // Find the Systembolaget store to update
    const id = req.params.systembolagId;
    const updatedSystembolag = await Systembolag.findById(id).catch(err => { next(err) })

    // Update only the fields provided in the request body
    updatedSystembolag.systembolagID = (req.body.systembolagID || updatedSystembolag.systembolagID);
    updatedSystembolag.name = (req.body.name || updatedSystembolag.name);
    updatedSystembolag.street = (req.body.street || updatedSystembolag.street);
    updatedSystembolag.streetNumber = (req.body.streetNumber || updatedSystembolag.streetNumber);
    updatedSystembolag.postalCode = (req.body.postalCode || updatedSystembolag.postalCode);
    updatedSystembolag.city = (req.body.city || updatedSystembolag.city);
    updatedSystembolag.longitude = (req.body.longitude || updatedSystembolag.longitude);
    updatedSystembolag.latitude = (req.body.latitude || updatedSystembolag.latitude);

    // Save the updated Systembolaget store to the database
    await updatedSystembolag.save().catch(err => { next(err) });

    return res.json(updatedSystembolag);
});

// Update details of a specific product
router.patch("/api/v1/systembolag/products/:productId", async (req, res) => {
    // Logic to update product details
});

// Update product availability at a specific Systembolaget store
router.patch("/api/v1/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to update product availability
});

// PUT ROUTE DEFINITIONS

// Replace details of a specific product
router.put("/api/v1/systembolag/products/:productId", async (req, res) => {
    // Logic to replace product details
    // Enforce supply of all required fields
});

// DELETE ROUTE DEFINITIONS

// Delete a specific Systembolaget store
router.delete("/api/v1/systembolag/:systembolagId", async (req, res) => {
    const id = req.params.systembolagId;
    const deletedSystembolag = await Systembolag.findByIdAndDelete(id).catch(err => { next(err) });

    return res.json(deletedSystembolag)
});

// Delete a specific product from Systembolaget
router.delete("/api/v1/systembolag/products/:productId", async (req, res) => {
    // Logic to delete a product
});

// Delete a specific product from a specific Systembolaget store
router.delete("/api/v1/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to delete a product from a specific store
});

module.exports = router;