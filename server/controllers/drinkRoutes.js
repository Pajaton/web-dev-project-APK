var express=require("express");
var router=express.Router();

var Drink=require("../models/DrinkSchema");

// GET ROUTES DEFINITION

router.get("/api/v1/drinks", async (req, res) => {
    // Get all drinks logic
    const drinks=await Drink.find();
    res.json({"drinks":drinks});
});

router.get("/api/v1/drinks/:drinkId", async (req, res) => {
    // Get specific drink logic
    const id=req.params.drinkId;
    const myDrink=await Drink.findById(id).catch(err=>{res.status(404).json({"message":"No drink found"});});
    res.json(myDrink)
});

router.get("/api/v1/drinks/:drinkId/systembolag", async (req, res) => {
    // Logic to check where a drink is in stock
});

router.get("/api/v1/drinks/:drinkId/systembolag/:systembolagId", async (req, res) => {
    // Logic to check if a drink is in stock at a specific systembolag
});



// POST ROUTES DEFINITION



router.post("/api/v1/drinks", async (req, res) => {
    // Logic to add new drinks
    const newDrink= new Drink({
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
    await newDrink.save().catch(err=>{next(err)});

    res.status(201).json(newDrink);
});



// PATCH ROUTES DEFINITION



router.patch("/api/v1/drinks/:drinkId", async (req, res) => {
    // Logic to update a drink
    const id=req.params.drinkId;
    const updatedDrink=await Drink.findById(id).catch(err=>{next(err)});
    updatedDrink.productNumber=(req.body.productNumber || updatedDrink.productNumber);
    updatedDrink.name=(req.body.name || updatedDrink.name);
    updatedDrink.type=(req.body.type || updatedDrink.type);
    updatedDrink.container=(req.body.container || updatedDrink.container);
    updatedDrink.volume=(req.body.volume || updatedDrink.volume);
    updatedDrink.percentage=(req.body.percentage || updatedDrink.percentage);
    updatedDrink.colour=(req.body.colour || updatedDrink.colour);
    updatedDrink.price=(req.body.price || updatedDrink.price);
    updatedDrink.image=(req.body.image || updatedDrink.image);
    updatedDrink.apk=(req.body.apk || updatedDrink.apk);
    await updatedDrink.save().catch(err=>{next(err)});
    res.json(updatedDrink);
});



// DELETE ROUTES DEFINITION



router.delete("/api/v1/drinks/:drinkId", async (req, res) => {
    // Logic to delete a drink
    const id=req.params.drinkId;
    const deletedDrink=await User.findByIdAndDelete(id).catch(err=>{next(err)});
    res.json(deletedDrink);
});

module.exports = router;