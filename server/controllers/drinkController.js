var express = require("express");
var router = express.Router();

var Drink = require("../models/DrinkSchema");

/**
 * @route GET /drinks
 * @description Retrieves a list of drinks with optional sorting and filtering.
 * @query {string} [sort=apk] - Field to sort by (productNumber, name, type, container, volume, percentage, colour, price, apk).
 * @query {string|string[]} [type] - Filter by drink type(s).
 * @query {number} [percentageMin] - Minimum alcohol percentage.
 * @query {number} [percentageMax] - Maximum alcohol percentage.
 * @query {number} [priceMin] - Minimum price.
 * @query {number} [priceMax] - Maximum price.
 * @query {number} [apkMin] - Minimum APK value.
 * @query {number} [apkMax] - Maximum APK value.
 * @returns {Object} 200 - Object containing array of drinks.
 * @returns {Object} 400 - Invalid sort parameter.
 */
router.get("/drinks", async (req, res, next) => {
    try {
        let {sort: sortQuery, ...filterQuery} = req.query;
        const existingAttributes = ["productNumber", "name", "type", "container", "volume", "percentage", "colour", "price", "apk"];
        const allowedFilters = ["type", "percentage", "price", "apk"];
        const filters = {};

        if (req.query.type) {
            if (Array.isArray(req.query.type)) {
                filters.type = { $in: req.query.type };
            } else {
                filters.type = req.query.type;
            }
        }

        ["percentage", "price", "apk"].forEach(filter => {
            const min = req.query[`${filter}Min`];
            const max = req.query[`${filter}Max`];

            if (min || max) {
                filters[filter] = {};
                if (min) filters[filter].$gte = Number(min);
                if (max) filters[filter].$lte = Number(max);
            }
        });

        if (!sortQuery) {
            sortQuery = "apk";
        } else if (!existingAttributes.includes(sortQuery)) {
            return res.status(400).json({"message": `You can't sort drinks by ${sortQuery}`})
        }

        const drinks = await Drink
            .find(filters)
            .sort({[sortQuery]: 1}); // -1 descending, 1 ascending

        return res.json({ "drinks": drinks });
    } catch(err) {next(err)};
});

/**
 * @route GET /drinks/:drinkId
 * @description Retrieves a specific drink by its ID.
 * @param {string} drinkId - The ID of the drink to retrieve.
 * @returns {Object} 200 - The requested drink object.
 * @returns {Object} 404 - Drink not found.
 */
router.get("/drinks/:drinkId", async (req, res, next) => {
    try {
        const requestedDrink = await Drink
            .findById(req.params.drinkId);

        if (!requestedDrink) {
            return res.status(404).json({"message": "Drink not found"});
        }

        return res.json(requestedDrink)
    } catch(err) {next(err)};
});

/**
 * @route GET /drinks/:drinkId/systembolag
 * @description Retrieves all Systembolag stores where a specific drink is available.
 * @param {string} drinkId - The ID of the drink.
 * @returns {Object} 200 - Object containing array of Systembolag locations.
 * @returns {Object} 404 - Drink not found or no Systembolag with drink in stock.
 */
router.get("/drinks/:drinkId/systembolag", async (req, res, next) => {
    try {
        const drinkInStockAt = await Drink
            .findById(req.params.drinkId)
            .populate("availableAt");

        if (!drinkInStockAt) {
            return res.status(404).json({"message": "Drink not found"});
        } else if (drinkInStockAt.availableAt.length === 0) {
            return res.status(404).json({"message": "No Systembolag with drink in stock"});
        }

        return res.json({"availableAt": drinkInStockAt.availableAt})
    } catch(err) {next(err)};
});

/**
 * @route GET /drinks/:drinkId/systembolag/:systembolagId
 * @description Checks if a specific drink is available at a specific Systembolag.
 * @param {string} drinkId - The ID of the drink.
 * @param {string} systembolagId - The ID of the Systembolag.
 * @returns {Object} 200 - The Systembolag where the drink is available.
 * @returns {Object} 404 - Drink not found or drink not in stock at this Systembolag.
 */
router.get("/drinks/:drinkId/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const drinkInStockAt = await Drink
            .findById(req.params.drinkId)
            .populate("availableAt")
         
        if (!drinkInStockAt) {
            return res.status(404).json({"message": "Drink not found"});
        }

        const isAvailableAt = drinkInStockAt.availableAt.find(systembolag => 
            systembolag._id.toString() === req.params.systembolagId
        );
        
        if (!isAvailableAt) {
            return res.status(404).json({"message": "The drink is not in stock at this Systembolag"});
        }

        return res.json({ "availableAt": isAvailableAt });
    } catch(err) { next(err) };
});

/**
 * @route POST /drinks
 * @description Creates a new drink.
 * @body {number} productNumber - Product number.
 * @body {string} name - Name of the drink.
 * @body {string} type - Type of drink (e.g., Beer, Wine).
 * @body {string} container - Container type (e.g., Bottle, Can).
 * @body {number} volume - Volume in ml.
 * @body {number} percentage - Alcohol percentage.
 * @body {string} colour - Colour of the drink.
 * @body {number} price - Price in SEK.
 * @body {string} [image] - Image URL.
 * @body {number} apk - Alcohol per krona value.
 * @returns {Object} 201 - The created drink object.
 */
router.post("/drinks", async (req, res, next) => {
    try{
        const newDrink = new Drink({
            "productNumber": req.body.productNumber,
            "name": req.body.name,
            "type": req.body.type,
            "container": req.body.container,
            "volume": req.body.volume,
            "percentage": req.body.percentage,
            "colour": req.body.colour,
            "price": req.body.price,
            "image": req.body.image,
            "apk": req.body.apk
        });
        await newDrink.save();

        return res.status(201).json(newDrink);
    } catch(err) {next(err) };
});

/**
 * @route PATCH /drinks/:drinkId
 * @description Partially updates an existing drink.
 * @param {string} drinkId - The ID of the drink to update.
 * @body {number} [productNumber] - Product number.
 * @body {string} [name] - Name of the drink.
 * @body {string} [type] - Type of drink.
 * @body {string} [container] - Container type.
 * @body {number} [volume] - Volume in ml.
 * @body {number} [percentage] - Alcohol percentage.
 * @body {string} [colour] - Colour of the drink.
 * @body {number} [price] - Price in SEK.
 * @body {string} [image] - Image URL.
 * @body {number} [apk] - Alcohol per krona value.
 * @returns {Object} 200 - The updated drink object.
 * @returns {Object} 404 - Drink not found.
 */
router.patch("/drinks/:drinkId", async (req, res, next) => {
    // Find the drink to update
    try {
        const drinkToUpdate = await Drink
            .findById(req.params.drinkId);

        if (!drinkToUpdate) {
            return res.status(404).json({"message": "Drink was not found"});
        }
        
        // Update the drink's fields if new values are provided
        drinkToUpdate.productNumber = (req.body.productNumber || drinkToUpdate.productNumber);
        drinkToUpdate.name = (req.body.name || drinkToUpdate.name);
        drinkToUpdate.type = (req.body.type || drinkToUpdate.type);
        drinkToUpdate.container = (req.body.container || drinkToUpdate.container);
        drinkToUpdate.volume = (req.body.volume || drinkToUpdate.volume);
        drinkToUpdate.percentage = (req.body.percentage || drinkToUpdate.percentage);
        drinkToUpdate.colour = (req.body.colour || drinkToUpdate.colour);
        drinkToUpdate.price = (req.body.price || drinkToUpdate.price);
        drinkToUpdate.image = (req.body.image || drinkToUpdate.image);
        drinkToUpdate.apk = (req.body.apk || drinkToUpdate.apk);
        
        // Save the updated drink to the database
        await drinkToUpdate.save().catch(err => { next(err) });
        
        return res.json(drinkToUpdate);
    } catch (err) { next(err) };
});

/**
 * @route PATCH /drinks/:drinkId/systembolag/:systembolagId
 * @description Adds a Systembolag to the list of stores where a drink is available.
 * @param {string} drinkId - The ID of the drink.
 * @param {string} systembolagId - The ID of the Systembolag to add.
 * @returns {Object} 200 - The updated drink object.
 * @returns {Object} 404 - Drink not found.
 */
router.patch("/drinks/:drinkId/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const updatedDrink = await Drink
            .findById(req.params.drinkId);

        if (!updatedDrink) {
            return res.status(404).json({"message": "Drink was not found"});
        }    

        // Add the Systembolag to the availableAt array if not already present
        if (!updatedDrink.availableAt.includes(req.params.systembolagId)) {
            updatedDrink.availableAt.push(req.params.systembolagId);
        }

        // Save the updated Drink to the database
        await updatedDrink.save().catch(err => { next(err) });

        return res.json(updatedDrink);
    } catch(err) { next(err) };
});

/**
 * @route PUT /drinks/:drinkId
 * @description Replaces an existing drink entirely.
 * @param {string} drinkId - The ID of the drink to replace.
 * @body {number} productNumber - Product number.
 * @body {string} name - Name of the drink.
 * @body {string} type - Type of drink.
 * @body {string} container - Container type.
 * @body {number} volume - Volume in ml.
 * @body {number} percentage - Alcohol percentage.
 * @body {string} colour - Colour of the drink.
 * @body {number} price - Price in SEK.
 * @body {string} [image] - Image URL.
 * @body {number} apk - Alcohol per krona value.
 * @returns {Object} 200 - The replaced drink object.
 * @returns {Object} 404 - Drink not found.
 */
router.put("/drinks/:drinkId", async (req, res, next) => {
    // Find the drink to update
    try {
        const drinkToUpdate = await Drink
            .findByIdAndUpdate(
                req.params.drinkId,
                { "productNumber": req.body.productNumber,
                  "name": req.body.name,
                  "type": req.body.type,
                  "container": req.body.container,
                  "volume": req.body.volume,
                  "percentage": req.body.percentage,
                  "colour": req.body.colour,
                  "price": req.body.price,
                  "image": req.body.image,
                  "apk": req.body.apk },
                { new: true }  // return the updated document
            );

        if (!drinkToUpdate) {
            return res.status(404).json({"message": "Drink was not found"});
        }

        return res.json(drinkToUpdate);
    } catch(err) { next(err) };
});

/**
 * @route DELETE /drinks/:drinkId
 * @description Deletes a drink by its ID.
 * @param {string} drinkId - The ID of the drink to delete.
 * @returns {Object} 200 - The deleted drink object.
 * @returns {Object} 404 - Drink not found.
 */
router.delete("/drinks/:drinkId", async (req, res, next) => {
    try {
        const deletedDrink = await Drink
            .findByIdAndDelete(req.params.drinkId);

        if (!deletedDrink) {
            return res.status(404).json({"message": "Drink was not found"})
        }
        
        return res.json(deletedDrink);
    } catch(err) { next(err) };
});

module.exports = router;
