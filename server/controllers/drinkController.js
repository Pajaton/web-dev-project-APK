var express = require("express");
var router = express.Router();

var Drink = require("../models/DrinkSchema");

// GET ROUTES DEFINITION

router.get("/drinks", async (req, res) => {
    const drinks = await Drink.find();

    return res.json({ "drinks": drinks });
});

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

// Get all systembolag where a specific drink is available
router.get("/drinks/:drinkId/systembolag", async (req, res, next) => {
    try {
        const drinkInStockAt = await Drink
            .findById(req.params.drinkId)
            .populate("availableAt");
        if (!drinkInStockAt) {
            return res.status(404).json({"message": "No Systembolag with drink in stock"});
        }
        return res.json({"availableAt": drinkInStockAt.availableAt})
    } catch(err) {next(err)};
});

router.get("/drinks/:drinkId/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const drinkInStockAt = await Drink
            .findById(req.params.drinkId)
            .populate({"availableAt": {
                match: {
                    _id: req.params.systembolagId
                }}
            });
            if (!drinkInStockAt) {
                return res.status(404).json({"message": "The drink is not in stock at this Systembolag"});
            }
            return res.json({ "availableAt": drinkInStockAt.availableAt });
        } catch(err) { next(err) };
});

// POST ROUTES DEFINITION

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



// PATCH ROUTES DEFINITION


// Update an existing drink
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



// PUT ROUTES DEFINITION



// Replace an existing drink
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
            } return res.json(drinkToUpdate);
        } catch(err) { next(err) };
});



// DELETE ROUTES DEFINITION



router.delete("/drinks/:drinkId", async (req, res, next) => {
    try {
        const deletedDrink = await Drink
            .findByIdAndDelete(req.params.drinkId);
        if (!deletedDrink) {
            return res.status(404).json({"message": "Drink was not found"})
        } return res.json(deletedDrink);
    } catch(err) { next(err) };
});

module.exports = router;
