var express=require("express");
var router=express.Router();

// GET ROUTE DEFINITIONS

// Get all reviews
router.get("/reviews", async (req, res) => {
    // Logic to get all reviews
});

// Get a specific review by ID
router.get("/reviews/:reviewId", async (req, res) => {
    // Logic to get a specific review
});

// Get all reviews for a specific drink
router.get("/drinks/:drinkId/reviews", async (req, res) => {
    // Logic to get all reviews for a specific drink
});

// Get all reviews made by a specific user
router.get("/users/:userId/reviews", async (req, res) => {
    // Logic to get all reviews made by a specific user
});

// Get a specific user's review for a specific drink
router.get("/users/:userId/drinks/:drinkId/reviews", async (req, res) => {
    // Logic to get a specific user's review for a specific drink
});

// POST ROUTE DEFINITIONS

// Create a new review for a drink
router.post("/reviews", async (req, res) => {
    // Logic to create a new review for a drink
});

// PATCH ROUTE DEFINITIONS

// Update a specific review
router.patch("/reviews/:reviewId", async (req, res) => {
    // Logic to update a specific review
});

// PUT ROUTE DEFINITIONS

// Replace a specific review
router.put("/reviews/:reviewId", async (req, res) => {
    // Logic to replace a specific review
    // Enforce supply of all required fields
});

// DELETE ROUTE DEFINITIONS

// Delete a specific review
router.delete("/reviews/:reviewId", async (req, res) => {
    // Logic to delete a specific review
});

// Delete all reviews (use with caution)
router.delete("/reviews", async (req, res) => {
    // Logic to delete all reviews (use with caution)
});

module.exports = router;