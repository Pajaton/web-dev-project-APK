import { Router } from 'express';

const router = Router();

// GET ROUTE DEFINITIONS

// Get a list of Systembolaget stores
router.get('/systembolag', async (req, res) => {
    // Logic to get list of systembolaget stores
});

// Get details of a specific Systembolaget store
router.get('/store-details', async (req, res) => {
    // Logic to get store details
});

// Get a list of products available at Systembolaget
router.get('/products', async (req, res) => {
    // Logic to get list of products
});

// Get details of a specific product
router.get('/product-details', async (req, res) => {
    // Logic to get product details
});

// POST ROUTE DEFINITIONS

// Search for products in Systembolaget
router.post('/search-products', async (req, res) => {
    // Logic to search for products
});

// Get product availability at specific stores
router.post('/product-availability', async (req, res) => {
    // Logic to get product availability
});

export default router;