var express = require("express");
var router = express.Router();

var Drink = require("../models/DrinkSchema");

// GET ROUTES DEFINITION

router.get("/api/v1/drinks", async (req, res) => {
    const drinks = await Drink.find();

    return res.json({ "drinks": drinks });
});

router.get("/api/v1/drinks/:drinkId", async (req, res, next) => {
    const requestedDrink = await Drink
        .findById(req.params.drinkId)
        .catch(err => { next(err) });

    return res.json(requestedDrink)
});

// Get all systembolag where a specific drink is available
router.get("/api/v1/drinks/:drinkId/systembolag", async (req, res, next) => {
    const drinkInStockAt = await Drink
        .findById(req.params.drinkId)
        .populate("availableAt")
        .catch(err => { next(err) });

    return res.json({ "availableAt": drinkInStockAt.availableAt });
});

router.get("/api/v1/drinks/:drinkId/systembolag/:systembolagId", async (req, res, next) => {
    const drinkInStockAt = await Drink
        .findById(req.params.drinkId)
        .populate({"availableAt": {
            match: {
                _id: req.params.systembolagId
            }}
        })
        .catch(err => { next(err) });

    return res.json({ "availableAt": drinkInStockAt.availableAt });
});

// POST ROUTES DEFINITION

router.post("/api/v1/drinks", async (req, res, next) => {
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
    await newDrink.save().catch(err => { next(err) });

    return res.status(201).json(newDrink);
});



// PATCH ROUTES DEFINITION


// Update an existing drink
router.patch("/api/v1/drinks/:drinkId", async (req, res, next) => {
    // Find the drink to update
    const drinkToUpdate = await Drink
        .findById(req.params.drinkId)
        .catch(err => { next(err) });

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
});



// PUT ROUTES DEFINITION



// Replace an existing drink
router.put("/api/v1/drinks/:drinkId", async (req, res, next) => {
    // Find the drink to update
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
        )
        .catch(err => { next(err) });

    return res.json(drinkToUpdate);
});



// DELETE ROUTES DEFINITION



router.delete("/api/v1/drinks/:drinkId", async (req, res, next) => {
    const deletedDrink = await Drink
        .findByIdAndDelete(req.params.drinkId) 
        .catch(err => { next(err) });

    return res.json(deletedDrink);
});

module.exports = router;
