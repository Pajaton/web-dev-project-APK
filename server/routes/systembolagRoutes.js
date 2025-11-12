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

// POST ROUTE DEFINITIONS

export default router;