var express=require("express");
var router=express.Router();

var Systembolag=require("../models/SystembolagSchema");

// GET ROUTE DEFINITIONS

// Get a list of Systembolaget stores
router.get("/systembolag", async (req, res) => {
    // Logic to get list of systembolaget stores
    const systembolag=await Systembolag.find();
    res.json({"systembolag":systembolag});
});

// Get a list of products available at Systembolaget
router.get("/systembolag/products", async (req, res) => {
    // Logic to get list of products
});

// Get details of a specific product
router.get("/systembolag/products/:productId", async (req, res) => {
    // Logic to get product details
});

// Get details of a specific Systembolaget store
router.get("/systembolag/:systembolagId", async (req, res) => {
    // Logic to get store details
    const id=req.params.systembolagId;
    const mySystembolag=await Systembolag.findById(id).catch(err=>{res.status(404).json({"message":"No systembolag found"});});
    res.json(mySystembolag)
});

router.get("/systembolag/:systembolagId/products", async (req, res) => {
    // Logic to get list of products available at a specific store
});

// Get product availability at specific stores
router.get("/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to get product availability
});

// Get the location of a specific Systembolaget store
router.get("/systembolag/:systembolagId/location", async (req, res) => {
    // Logic to get a Systembolaget store's loction
});


// POST ROUTE DEFINITIONS

// Add a new Systembolaget store
router.post("/systembolag", async (req, res) => {
    // Logic to add a new Systembolaget store
    var newSystembolag=new Systembolag({
        "SystembolagID": req.body.SystembolagID,
        "name": req.body.name,
        "type": req.body.location.type,
        "ref": req.body.location.ref,
        "unique": req.body.location.unique,
        "required": req.body.location.require
    });
    await newSystembolag.save().catch(err=>{next(err)});

    res.status(201).json(newSystembolag);
});

// Add a new product to Systembolaget
router.post("/systembolag/products", async (req, res) => {
    // Logic to add a new product
});

// Add a new product to a specific Systembolaget store
router.post("/systembolag/:systembolagId/products", async (req, res) => {
    // Logic to add a new product to a specific store
});


// PATCH ROUTE DEFINITIONS


// Update details of a specific Systembolaget store
router.patch("/systembolag/:systembolagId", async (req, res) => {
    // Logic to update store details
    const id=req.params.systembolagId;
    const updatedSystembolag=await Systembolag.findById(id).catch(err=>{next(err)})
    updatedSystembolag.SystembolagID=(req.body.SystembolagID || updatedSystembolag.SystembolagID);
    updatedSystembolag.name=(req.body.name || updatedSystembolag.name);
    updatedSystembolag.type=(req.body.type || updatedSystembolag.type);
    updatedSystembolag.ref=(req.body.ref || updatedSystembolag.ref);
    updatedSystembolag.unique=(req.body.unique || updatedSystembolag.unique);
    updatedSystembolag.required=(req.body.required || updatedSystembolag.required);
    await updatedSystembolag.save().catch(err=>{next(err)});
    res.json(updatedSystembolag);
});

// Update details of a specific product
router.patch("/systembolag/products/:productId", async (req, res) => {
    // Logic to update product details
});

// Update product availability at a specific Systembolaget store
router.patch("/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to update product availability
});



// DELETE ROUTE DEFINITIONS

// Delete a specific Systembolaget store
router.delete("/systembolag/:systembolagId", async (req, res) => {
    // Logic to delete a Systembolaget store
    const id=req.params.systembolagId;
    const deletedSystembolag=await Systembolag.findByIdAndDelete(id).catch(err=>{next(err)});
    res.json(deletedSystembolag)
});

// Delete a specific product from Systembolaget
router.delete("/systembolag/products/:productId", async (req, res) => {
    // Logic to delete a product
});

// Delete a specific product from a specific Systembolaget store
router.delete("/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to delete a product from a specific store
});

module.exports = router;