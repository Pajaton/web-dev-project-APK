var express=require("express");
var router=express.Router();

var Review=require("../models/ReviewSchema");

// GET ROUTE DEFINITIONS

// Get all reviews
router.get("/api/v1/reviews", async (req, res) => {
    // Logic to get all reviews
    const review=await Review.find();
    res.json({"review":review});
});

// Get a specific review by ID
router.get("/api/v1/reviews/:reviewId", async (req, res) => {
    // Logic to get a specific review
    const id=req.params.reviewId;
    const myreview=await User.findById(id).catch(err=>{res.status(404).json({"message":"No review found"});});
    res.json(myreview)
});

// Get all reviews for a specific drink
router.get("/api/v1/drinks/:drinkId/reviews", async (req, res) => {
    // Logic to get all reviews for a specific drink
});

// Get all reviews made by a specific user
router.get("/api/v1/users/:userId/reviews", async (req, res) => {
    // Logic to get all reviews made by a specific user
});

// Get a specific user's review for a specific drink
router.get("/api/v1/users/:userId/drinks/:drinkId/reviews", async (req, res) => {
    // Logic to get a specific user's review for a specific drink
});

// POST ROUTE DEFINITIONS

// Create a new review for a drink
router.post("/api/v1/reviews", async (req, res, next) => {
    // Logic to create a new review for a drink
    var newReview= new Review({
        "userID":req.body.userID,
        "productID": req.body.productID,
        "rating": req.body.rating,
        "comment": req.body.comment
    });
    await newReview.save().catch(err=>{next(err)});

    res.status(201).json(newReview);
});

// PATCH ROUTE DEFINITIONS

// Update a specific review
router.patch("/api/v1/reviews/:reviewId", async (req, res, next) => {
    // Logic to update a specific review
    const id=req.params.reviewId;
    const updatedReview=await Review.findById(id).catch(err=>{next(err)});
    updatedReview.userID=(req.body.userID || updatedReview.userID);
    updatedReview.productID=(req.body.productID || updatedReview.productID);
    updatedReview.rating=(req.body.rating || updatedReview.rating);
    updatedReview.comment=(req.body.comment || updatedReview.comment);
    await updatedReview.save().catch(err=>{next(err)});
    res.json(updatedReview);
});

// PUT ROUTE DEFINITIONS

// Replace a specific review
router.put("/api/v1/reviews/:reviewId", async (req, res) => {
    // Logic to replace a specific review
    // Enforce supply of all required fields
});

// DELETE ROUTE DEFINITIONS

// Delete a specific review
router.delete("/api/v1/reviews/:reviewId", async (req, res) => {
    // Logic to delete a specific review
    const id=req.params.reviewId;
    const deletedReview=await Review.findByIdAndDelete(id).catch(err=>{next(err)});
    res.json(deletedReview);
});

// Delete all reviews (use with caution)
router.delete("/api/v1/reviews", async (req, res) => {
    // Logic to delete all reviews (use with caution)
});

module.exports = router;