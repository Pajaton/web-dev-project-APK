var express = require("express");
var router = express.Router();

var Systembolag = require("../models/SystembolagSchema");
const { json } = require("body-parser");

/**
 * @route GET /systembolag
 * @description Retrieves a list of all Systembolaget stores.
 * @returns {Object} 200 - Object containing array of all Systembolag stores.
 */
router.get("/systembolag", async (req, res, next) => {
    const systembolag = await Systembolag
        .find()
        .catch(err => { next(err) });

    return res.json({ "systembolag": systembolag });
});

/**
 * @route GET /systembolag/products
 * @description Retrieves a list of all products available across all Systembolaget stores.
 * @returns {Object} 200 - Object containing array of products.
 * @returns {Object} 404 - No products found.
 */
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

/**
 * @route GET /systembolag/:systembolagId/products
 * @description Retrieves a list of products available at a specific Systembolaget store.
 * @param {string} systembolagId - The ID of the Systembolag store.
 * @returns {Object} 200 - Object containing array of products in stock.
 * @returns {Object} 404 - No products found at this store.
 */
router.get("/systembolag/:systembolagId/products", async (req, res, next) => {
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

/**
 * @route GET /systembolag/:systembolagId/products/:productId
 * @description Checks if a specific product is available at a specific Systembolaget store.
 * @param {string} systembolagId - The ID of the Systembolag store.
 * @param {string} productId - The ID of the product.
 * @returns {Object} 200 - The product if available at the store.
 * @returns {Object} 404 - Product not available at this Systembolag.
 */
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

/**
 * @route GET /systembolag/:systembolagId/address
 * @description Retrieves the address and location of a specific Systembolaget store.
 * @param {string} systembolagId - The ID of the Systembolag store.
 * @returns {Object} 200 - Object containing address details (street, streetNumber, postalCode, city, lon, lat).
 * @returns {Object} 404 - No address found for this Systembolag.
 */
router.get("/systembolag/:systembolagId/address", async (req, res, next) => {
    try {
        const systembolagAddress = await Systembolag
            .findById(req.params.systembolagId)
            .select("street streetNumber postalCode city lon lat");
        if(!systembolagAddress) {
            return res.status(404).json({"message": "No adress found for this systembolag"});
        }
        return res.json({ "address": systembolagAddress });        
     } catch(err) { next(err) };

});

/**
 * @route GET /systembolag/:systembolagId
 * @description Retrieves details of a specific Systembolaget store.
 * @param {string} systembolagId - The ID of the Systembolag store.
 * @returns {Object} 200 - The Systembolag store object.
 * @returns {Object} 404 - Systembolag not found.
 */
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

/**
 * @route POST /systembolag
 * @description Creates a new Systembolaget store.
 * @body {string} id - The Systembolag ID.
 * @body {string} name - Name of the store.
 * @body {string} street - Street name.
 * @body {string} streetNumber - Street number.
 * @body {string} postalCode - Postal code.
 * @body {string} city - City name.
 * @body {number} lon - Longitude coordinate.
 * @body {number} lat - Latitude coordinate.
 * @returns {Object} 201 - The created Systembolag store object.
 */
router.post("/systembolag", async (req, res, next) => {
    try {
        var newSystembolag = new Systembolag({
            "systembolagID": req.body.id,
            "name": req.body.name,
            "street": req.body.street,
            "streetNumber": req.body.streetNumber,
            "postalCode": req.body.postalCode,
            "city": req.body.city,
            "lon": req.body.lon,
            "lat": req.body.lat
        });
        await newSystembolag.save();
        return res.status(201).json(newSystembolag);
    } catch(err) { next(err) };
});

/**
 * @route POST /systembolag/:systembolagId/products
 * @description Adds a product to a specific Systembolaget store's inventory.
 * @param {string} systembolagId - The ID of the Systembolag store.
 * @body {string} productId - The ID of the product to add.
 * @returns {Object} 201 - The updated Systembolag store object.
 * @returns {Object} 404 - Systembolag not found.
 */
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

/**
 * @route PATCH /systembolag/:systembolagId
 * @description Partially updates details of a specific Systembolaget store.
 * @param {string} systembolagId - The ID of the Systembolag store to update.
 * @body {string} [id] - The Systembolag ID.
 * @body {string} [name] - Name of the store.
 * @body {string} [street] - Street name.
 * @body {string} [streetNumber] - Street number.
 * @body {string} [postalCode] - Postal code.
 * @body {string} [city] - City name.
 * @body {number} [lon] - Longitude coordinate.
 * @body {number} [lat] - Latitude coordinate.
 * @returns {Object} 200 - The updated Systembolag store object.
 * @returns {Object} 404 - Systembolag not found.
 */
router.patch("/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const updatedSystembolag = await Systembolag
            .findById(req.params.systembolagId);
        if (!updatedSystembolag) {
            return res.status(404).json({"message": "Systembolag was not found"});
        }    

        // Update only the fields provided in the request body
        updatedSystembolag.systembolagID = (req.body.id || updatedSystembolag.systembolagID);
        updatedSystembolag.name = (req.body.name || updatedSystembolag.name);
        updatedSystembolag.street = (req.body.street || updatedSystembolag.street);
        updatedSystembolag.streetNumber = (req.body.streetNumber || updatedSystembolag.streetNumber);
        updatedSystembolag.postalCode = (req.body.postalCode || updatedSystembolag.postalCode);
        updatedSystembolag.city = (req.body.city || updatedSystembolag.city);
        updatedSystembolag.lon = (req.body.lon || updatedSystembolag.lon);
        updatedSystembolag.lat = (req.body.lat || updatedSystembolag.lat);

        // Save the updated Systembolaget store to the database
        await updatedSystembolag.save().catch(err => { next(err) });

        return res.json(updatedSystembolag);
    } catch(err) { next(err) };
});

/**
 * @route DELETE /systembolag/:systembolagId
 * @description Deletes a specific Systembolaget store.
 * @param {string} systembolagId - The ID of the Systembolag store to delete.
 * @returns {Object} 200 - The deleted Systembolag store object.
 * @returns {Object} 404 - Systembolag not found.
 */
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
