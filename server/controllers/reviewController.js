var express = require("express");
var router = express.Router();

var Review = require("../models/ReviewSchema");
var User = require("../models/UserSchema");
var Drink = require ("../models/DrinkSchema")

// GET ROUTE DEFINITIONS

// Get all reviews
router.get("/reviews", async (req, res, next) => {
    const review = await Review
        .find()
        .catch(err => { next(err) });

    return res.json({ "review": review });
});

// Get a specific review by ID
router.get("/reviews/:reviewId", async (req, res, next) => {
    try {
        const review = await Review
            .findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({"message": "Review not found"});
        }
        return res.json(review)
    } catch(err) { next(err) };
});

// Get all reviews for a specific drink
router.get("/drinks/:drinkId/reviews", async (req, res, next) => {
    try {
        const reviewForDrink = await Review
            .find({"productID": req.params.drinkId})
            .populate("email", "userName")
            .populate("productID", "name")
            .select("-__v");
        if (!reviewForDrink) {
            return res.status(404).json({"message": "Review not found"});
        }
        return res.json({reviewForDrink})
    } catch(err) { next(err) };
});

// Get all reviews made by a specific user
router.get("/users/:userId/reviews", async (req, res, next) => {
    try {
        const reviewedByUser = await Review
            .find({"email": req.params.email});
        if(!reviewedByUser) {
            return res.status(404).json({"message": "User has not made any reviews"});
        }
        return res.json({"reviewedBy": reviewedByUser})
    } catch(err) { next(err) };
});

// Get a specific user's review for a specific drink
router.get("/users/:userId/drinks/:drinkId/reviews", async (req, res, next) => {
    try {
        const drinkReviewedByUser = await Review
            .find({
                "email": req.params.email,
                "productID": req.params.drinkId
            })
            .populate("email")
            .populate("productID");
        if (!drinkReviewedByUser) {
            return res.status(404).json({"message": "User has not reviewed this drink"});
        }
        return res.json({"reviews": drinkReviewedByUser})
    } catch(err) { next(err) };
});

// POST ROUTE DEFINITIONS

// Create a new review for a drink
router.post("/reviews", async (req, res, next) => {
    try {
        var newReview = new Review({
            "email": req.body.email,
            "productID": req.body.productID,
            "rating": req.body.rating,
            "comment": req.body.comment,
        });
        await newReview.save();

        await User.findByIdAndUpdate(
            req.body.email,
            {$addToSet: {reviewsWritten: newReview._id} 
        });
        await Drink.findByIdAndUpdate(
            req.body.productID,
            {$addToSet: {hasReviews: newReview._id} 
        });

        return res.status(201).json(newReview);
    } catch(err) { next(err) };
});

// PATCH ROUTE DEFINITIONS

// Update a specific review
router.patch("/reviews/:reviewId", async (req, res, next) => {
    // Find the review to update
    try {
        const updatedReview = await Review
            .findById(req.params.reviewId);
        if (!updatedReview) {
            return res.status(404).json({"message": "Review not found"});
        } 
    

        // Update the review's fields if new values are provided
        updatedReview.email = (req.body.email || updatedReview.email);
        updatedReview.productID = (req.body.productID || updatedReview.productID);
        updatedReview.rating = (req.body.rating || updatedReview.rating);
        updatedReview.comment = (req.body.comment || updatedReview.comment);

        // Save the updated review to the database
        await updatedReview.save().catch(err => { next(err) });

        return res.json(updatedReview);
    } catch(err) { next(err) };
});

// PUT ROUTE DEFINITIONS

// Replace a specific review
router.put("/reviews/:reviewId", async (req, res, next) => {
    // Find the review to update
    try {
        const updatedReview = await Review
            .findById(req.params.reviewId);
        if (!updatedReview) {
            return res.status(404).json({"message": "Review not found"});
        }

        // Update the review's fields if new values are provided
        updatedReview.email = req.body.email;
        updatedReview.productID = req.body.productID;
        updatedReview.rating = req.body.rating;
        updatedReview.comment = req.body.comment;
        
        await updatedReview.save().catch(err => { next(err) });
        
        return res.json(updatedReview);
    } catch(err) { next(err) };
});

// DELETE ROUTE DEFINITIONS

// Delete a specific review
router.delete("/reviews/:reviewId", async (req, res, next) => {
    try {
        const reviewToDelete = await Review
            .findByIdAndDelete(req.params.reviewId)

            if (!reviewToDelete) {
                return res.status(404).json({"message": "Review not found"})
            }
            await User.findByIdAndUpdate(
                reviewToDelete.email,
                {$pull: {reviewsWritten: reviewToDelete._id} 
            });
            await Drink.findByIdAndUpdate(
                reviewToDelete.productID,
                {$pull: {hasReviews: reviewToDelete._id} 
            });
        return res.json(reviewToDelete);
    } catch(err) { next(err) };
});

// Delete all reviews (use with caution)
router.delete("/reviews", async (req, res, next) => {
    try {
        const reviewsToDelete = await Review
            .deleteMany()

            await User.updateMany({},
                {$set: {reviewsWritten: []}
            });
            
            await Drink.updateMany({},
                {$set: {hasReviews: []}
            });
            if (reviewsToDelete.deletedCount == 0) {
                return res.status(404).json({"message": "No reviews found"})
            } return res.json(reviewsToDelete);
    } catch(err) {next(err) };
});

module.exports = router;
