var express = require("express");
var router = express.Router();

var Systembolag = require("../models/SystembolagSchema");
const { json } = require("body-parser");

// GET ROUTE DEFINITIONS

// Get a list of Systembolaget stores
router.get("/systembolag", async (req, res, next) => {
    const systembolag = await Systembolag
        .find()
        .catch(err => { next(err) });

    return res.json({ "systembolag": systembolag });
});

// Get a list of products available at Systembolaget
router.get("/systembolag/products", async (req, res, next) => {
    try{
        const products = await Systembolag
            .find()
            .select("hasStockOf");
        if (!products) {
            return res.status(404).json({"message": "No products found"});
        }
        return res.json({ "products": products });
    } catch(err){ next(err) };
});

// Get list of products available at a specific systembolag
router.get("/systembolag/:systembolagId/products", async (req, res, next) => {
    // Logic to get list of products available at a specific store
    try {
        const drinksAtASystembolag = await Systembolag
            .findById(req.params.systembolagId)
            .populate("hasInStock"); // Removes dangling references by default
        if (!drinksAtASystembolag) {
            return res.status(404).json({"message": "No products found at this store"});
        } 
        return res.status(200).json({ "hasInStock": drinksAtASystembolag.hasInStock });        
    }catch(err) { next(err) };
});

// Get product availability at a specific systembolag
router.get("/systembolag/:systembolagId/products/:productId", async (req, res, next) => {
    try {
        const drinksInStockAtASystembolag = await Systembolag
            .findById(req.params.systembolagId)
            .populate({
                "hasInStock": {
                    match: {
                        _id: req.params.productId
                    }
                }
            });
        if (!drinksInStockAtASystembolag) {
            return res.status(404).json({"message": "The product is not available at this systembolag"});
        }
        return res.json({ "hasInStock": drinksInStockAtASystembolag.hasInStock[0] });
    } catch(err) { next(err) };
});

// Get the location of a specific Systembolaget store
router.get("/systembolag/:systembolagId/address", async (req, res, next) => {
    // Logic to get a Systembolaget store's address
    try {
        const systembolagAddress = await Systembolag
            .findById(req.params.systembolagId)
            .select("street streetNumber postalCode city longitude latitude");
        if(!systembolagAddress) {
            return res.status(404).json({"message": "No adress found for this systembolag"});
        }
        return res.json({ "address": systembolagAddress });        
     } catch(err) { next(err) };

});

// Get details of a specific Systembolaget store
router.get("/systembolag/:systembolagId", async (req, res, next) => {
    try{
        const mySystembolag = await Systembolag
            .findById(req.params.systembolagId);
        if (!mySystembolag) {
            return res.status(404).json({"message": "The systembolag was not found"});
        }
            return res.json(mySystembolag);
    } catch(err) { next(err) };
});


// POST ROUTE DEFINITIONS

// Add a new Systembolaget store
router.post("/systembolag", async (req, res, next) => {
    try {
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
        await newSystembolag.save();
        return res.status(201).json(newSystembolag);
    } catch(err) { next(err) };
});

// Add a new product to a specific Systembolaget store
router.post("/systembolag/:systembolagId/products", async (req, res, next) => {
    try {
        const systembolag = await Systembolag.findByIdAndUpdate(
            req.params.systembolagId,
            {
                $addToSet: {
                    hasInStock: req.body.productId
                }
            }, // add the productId to hasInStock array
            { new: true } // return the updated document
        );
        if (!systembolag) {
            return res.status(404).json({"message": "Systembolag was not found"});
        }
        return res.status(201).json(systembolag);
    } catch(err) { next(err) };
});


// PATCH ROUTE DEFINITIONS


// Update details of a specific Systembolaget store
router.patch("/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const updatedSystembolag = await Systembolag
            .findById(req.params.systembolagId);
        if (!updatedSystembolag) {
            return res.status(404).json({"message": "Systembolag was not found"});
        }    

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
    } catch(err) { next(err) };
});

// DELETE ROUTE DEFINITIONS

// Delete a specific Systembolaget store
router.delete("/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const deletedSystembolag = await Systembolag
            .findByIdAndDelete(req.params.systembolagId);
        if (!deletedSystembolag) {
            return res.status(404).json({"message": "Systembolag was not found"});
        }  return res.json(deletedSystembolag);
    } catch(err) { next(err) };
});

module.exports = router;
