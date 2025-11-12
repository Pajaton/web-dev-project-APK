import { Router } from 'express';

const router = Router();

// GET ROUTE DEFINITIONS

// Get a list of Systembolaget stores
router.get("/systembolag", async (req, res) => {
    // Logic to get list of systembolaget stores
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
});

// Delete a specific product from Systembolaget
router.delete("/systembolag/products/:productId", async (req, res) => {
    // Logic to delete a product
});

// Delete a specific product from a specific Systembolaget store
router.delete("/systembolag/:systembolagId/products/:productId", async (req, res) => {
    // Logic to delete a product from a specific store
});

export default router;