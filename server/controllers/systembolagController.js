var express = require("express");
var router = express.Router();

var Systembolag = require("../models/SystembolagSchema");

// GET ROUTE DEFINITIONS

// Get a list of Systembolaget stores
router.get("/api/v1/systembolag", async (req, res, next) => {
    const systembolag = await Systembolag
        .find()
        .catch(err => { next(err) });

    return res.json({ "systembolag": systembolag });
});

// Get a list of products available at Systembolaget
router.get("/api/v1/systembolag/products", async (req, res, next) => {
    const products = await Systembolag
        .find()
        .select("hasStockOf")
        .catch(err => { next(err) });

    return res.json({ "products": products });
});

// Get list of products available at a specific systembolag
router.get("/api/v1/systembolag/:systembolagId/products", async (req, res, next) => {
    // Logic to get list of products available at a specific store
    const drinksAtASystembolag = await Systembolag
        .findById(req.params.systembolagId)
        .populate("hasInStock") // Removes dangling references by default
        .catch(err => { next(err) });

    return res.status(200).json({ "hasInStock": drinksAtASystembolag.hasInStock });
});

// Get product availability at a specific systembolag
router.get("/api/v1/systembolag/:systembolagId/products/:productId", async (req, res, next) => {
    const drinksInStockAtASystembolag = await Systembolag
        .findById(req.params.systembolagId)
        .populate({
            "hasInStock": {
                match: {
                    _id: req.params.productId
                }
            }
        })
        .catch(err => { next(err) });

    return res.json({ "hasInStock": drinksInStockAtASystembolag.hasInStock[0] });
});

// Get the location of a specific Systembolaget store
router.get("/api/v1/systembolag/:systembolagId/address", async (req, res, next) => {
    // Logic to get a Systembolaget store's address
    const systembolagAddress = await Systembolag
        .findById(req.params.systembolagId)
        .select("street streetNumber postalCode city longitude latitude")
        .catch(err => { next(err) });

    return res.json({ "address": systembolagAddress });
});

// Get details of a specific Systembolaget store
router.get("/api/v1/systembolag/:systembolagId", async (req, res, next) => {
    const mySystembolag = await Systembolag
        .findById(req.params.systembolagId)
        .catch(err => { next(err) });

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
        "latitude": req.body.latitude
    });
    await newSystembolag.save().catch(err => { next(err) });

    return res.status(201).json(newSystembolag);
});

// Add a new product to a specific Systembolaget store
router.post("/api/v1/systembolag/:systembolagId/products", async (req, res, next) => {
    const systembolag = await Systembolag.findByIdAndUpdate(
        req.params.systembolagId,
        {
            $addToSet: {
                hasInStock: req.body.productId
            }
        }, // add the productId to hasInStock array
        { new: true } // return the updated document
    ).catch(err => { next(err) });

    return res.status(201).json(systembolag);
});


// PATCH ROUTE DEFINITIONS


// Update details of a specific Systembolaget store
router.patch("/api/v1/systembolag/:systembolagId", async (req, res, next) => {
    const updatedSystembolag = await Systembolag
        .findById(req.params.systembolagId)
        .catch(err => { next(err) })

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

// DELETE ROUTE DEFINITIONS

// Delete a specific Systembolaget store
router.delete("/api/v1/systembolag/:systembolagId", async (req, res, next) => {
    const deletedSystembolag = await Systembolag
        .findByIdAndDelete(req.params.systembolagId)
        .catch(err => { next(err) });

    return res.json(deletedSystembolag)
});

module.exports = router;
