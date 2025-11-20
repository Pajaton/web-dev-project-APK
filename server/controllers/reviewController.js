var express = require("express");
var router = express.Router();

var Review = require("../models/ReviewSchema");

// GET ROUTE DEFINITIONS

// Get all reviews
router.get("/api/v1/reviews", async (req, res, next) => {
    const review = await Review
        .find()
        .catch(err => { next(err) });

    return res.json({ "review": review });
});

// Get a specific review by ID
router.get("/api/v1/reviews/:reviewId", async (req, res, next) => {
    const review = await Review
        .findById(req.params.reviewId)
        .catch(err => { next(err) });

    return res.json(review)
});

// Get all reviews for a specific drink
router.get("/api/v1/drinks/:drinkId/reviews", async (req, res, next) => {
    const reviewForDrink = await Review
        .find({"productID": req.params.drinkId})
        .populate("userID", "userName")
        .populate("productID", "name")
        .select("-__v")
        .catch(err => { next(err) });

    return res.json({reviewForDrink})
});

// Get all reviews made by a specific user
router.get("/api/v1/users/:userId/reviews", async (req, res, next) => {
    const reviewedByUser = await Review
        .find({"userID": req.params.userId})
        .catch(err => { next(err) });

    return res.json({"reviewedBy": reviewedByUser})
});

// Get a specific user's review for a specific drink
router.get("/api/v1/users/:userId/drinks/:drinkId/reviews", async (req, res, next) => {
    const drinkReviewedByUser = await Review
        .find({
            "userID": req.params.userId,
            "productID": req.params.drinkId
        })
        .populate("userID")
        .populate("productID")
        .catch(err => { next(err) });

    return res.json({"reviews": drinkReviewedByUser})
});

// POST ROUTE DEFINITIONS

// Create a new review for a drink
router.post("/api/v1/reviews", async (req, res, next) => {
    var newReview = new Review({
        "userID": req.body.userID,
        "productID": req.body.productID,
        "rating": req.body.rating,
        "comment": req.body.comment,
    });
    await newReview.save().catch(err => { next(err) });

    return res.status(201).json(newReview);
});

// PATCH ROUTE DEFINITIONS

// Update a specific review
router.patch("/api/v1/reviews/:reviewId", async (req, res, next) => {
    // Find the review to update
    const updatedReview = await Review
        .findById(req.params.reviewId)
        .catch(err => { next(err) });

    // Update the review's fields if new values are provided
    updatedReview.userID = (req.body.userID || updatedReview.userID);
    updatedReview.productID = (req.body.productID || updatedReview.productID);
    updatedReview.rating = (req.body.rating || updatedReview.rating);
    updatedReview.comment = (req.body.comment || updatedReview.comment);

    // Save the updated review to the database
    await updatedReview.save().catch(err => { next(err) });

    return res.json(updatedReview);
});

// PUT ROUTE DEFINITIONS

// Replace a specific review
router.put("/api/v1/reviews/:reviewId", async (req, res, next) => {
    // Find the review to update
    const updatedReview = await Review
        .findByIdAndUpdate(
            req.params.reviewId,
            {
                userID: req.body.userID,
                productID: req.body.productID,
                rating: req.body.rating,
                comment: req.body.comment,
            },
            { new: true }
        )
        .catch(err => { next(err) });


    return res.json(updatedReview);
});

// DELETE ROUTE DEFINITIONS

// Delete a specific review
router.delete("/api/v1/reviews/:reviewId", async (req, res, next) => {
    const reviewToDelete = await Review
        .findByIdAndDelete(req.params.reviewId)
        .catch(err => { next(err) });

    return res.json(reviewToDelete);
});

// Delete all reviews (use with caution)
router.delete("/api/v1/reviews", async (req, res, next) => {
    const reviewsToDelete = await Review
        .deleteMany()
        .catch(err=> {next(err) });

    return res.json(reviewsToDelete);
});

module.exports = router;
