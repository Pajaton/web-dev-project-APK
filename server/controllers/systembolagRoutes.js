var express=require("express");
var router=express.Router();
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

router.get("/systembolag/:systembolagId/products", async (req, res) => {
    // Logic to get list of products available at a specific store
});

// Get product availability at specific stores
router.get("/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to get product availability
});

// Get the location of a specific Systembolaget store
router.get("/systembolag/:systembolagId/address", async (req, res) => {
    // Logic to get a Systembolaget store's address
});

// Get details of a specific Systembolaget store
router.get("/systembolag/:systembolagId", async (req, res) => {
    // Logic to get details of a specific Systembolaget store
    const id=req.params.systembolagId;
    const mySystembolag=await Systembolag.findById(id).catch(err=>{res.status(404).json({"message":"No systembolag found"});});
    res.json(mySystembolag)
});


// POST ROUTE DEFINITIONS

// Add a new Systembolaget store
router.post("/systembolag", async (req, res) => {
    // Logic to add a new Systembolaget store
    var newSystembolag=new Systembolag({
        "SystembolagID": req.body.SystembolagID,
        "name": req.body.name,
        "street": req.body.street,
        "streetNumber": req.body.streetNumber,
        "postalCode": req.body.postalCode,
        "city": req.body.city,
        "longitude": req.body.longitude,
        "latitude": req.body.latitude,
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
    updatedSystembolag.street=(req.body.street || updatedSystembolag.street);
    updatedSystembolag.streetNumber=(req.body.streetNumber || updatedSystembolag.streetNumber);
    updatedSystembolag.postalCode=(req.body.postalCode || updatedSystembolag.postalCode);
    updatedSystembolag.city=(req.body.city || updatedSystembolag.city);
    updatedSystembolag.longitude=(req.body.longitude || updatedSystembolag.longitude);
    updatedSystembolag.latitude=(req.body.latitude || updatedSystembolag.latitude);
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

// PUT ROUTE DEFINITIONS

// Replace details of a specific product
router.put("/systembolag/products/:productId", async (req, res) => {
    // Logic to replace product details
    // Enforce supply of all required fields
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