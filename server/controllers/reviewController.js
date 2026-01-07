var express = require("express");
var router = express.Router();

var Review = require("../models/ReviewSchema");
var User = require("../models/UserSchema");
var Drink = require ("../models/DrinkSchema")

/**
 * @route GET /reviews
 * @description Retrieves all reviews.
 * @returns {Object} 200 - Object containing array of all reviews.
 */
router.get("/reviews", async (req, res, next) => {
  try {
    const review = await Review.find();

    return res.json({ "review": review });
  } catch(err) { next(err) };
});

/**
 * @route GET /reviews/:reviewId
 * @description Retrieves a specific review by its ID.
 * @param {string} reviewId - The ID of the review to retrieve.
 * @returns {Object} 200 - The requested review object.
 * @returns {Object} 404 - Review not found.
 */
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

/**
 * @route GET /drinks/:drinkId/reviews
 * @description Retrieves all reviews for a specific drink.
 * @param {string} drinkId - The ID of the drink.
 * @returns {Object} 200 - Object containing array of reviews for the drink.
 * @returns {Object} 404 - Review not found.
 */
router.get("/drinks/:drinkId/reviews", async (req, res, next) => {
  try {
    const reviewForDrink = await Review
      .find({"productID": req.params.drinkId})
      .populate("userID", "userName")
      .populate("productID", "name")
      .select("-__v");

    if (!reviewForDrink) {
      return res.status(404).json({"message": "Review not found"});
    }

    return res.json({reviewForDrink})
  } catch(err) { next(err) };
});

/**
 * @route GET /users/:userId/reviews
 * @description Retrieves all reviews made by a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Object} 200 - Object containing array of reviews by the user.
 * @returns {Object} 404 - User has not made any reviews.
 */
router.get("/users/:userId/reviews", async (req, res, next) => {
  try {
    const reviewedByUser = await Review
      .find({"userID": req.params.userId});

    if (!reviewedByUser) {
      return res.status(404).json({"message": "User has not made any reviews"});
    }

    return res.json({"reviewedBy": reviewedByUser})
  } catch(err) { next(err) };
});

/**
 * @route GET /users/:userId/drinks/:drinkId/reviews
 * @description Retrieves a specific user's review for a specific drink.
 * @param {string} userId - The ID of the user.
 * @param {string} drinkId - The ID of the drink.
 * @returns {Object} 200 - Object containing the user's reviews for the drink.
 * @returns {Object} 404 - User has not reviewed this drink.
 */
router.get("/users/:userId/drinks/:drinkId/reviews", async (req, res, next) => {
  try {
    const drinkReviewedByUser = await Review
      .find({
        "userID": req.params.userId,
        "productID": req.params.drinkId
      })
      .populate("userID")
      .populate("productID");

    if (!drinkReviewedByUser) {
      return res.status(404).json({"message": "User has not reviewed this drink"});
    }

    return res.json({"reviews": drinkReviewedByUser})
  } catch(err) { next(err) };
});

/**
 * @route POST /reviews
 * @description Creates a new review for a drink and updates user/drink references.
 * @body {string} userID - The ID of the user creating the review.
 * @body {string} productID - The ID of the drink being reviewed.
 * @body {number} rating - Rating value for the drink.
 * @body {string} [comment] - Optional comment for the review.
 * @returns {Object} 201 - The created review object.
 */
router.post("/reviews", async (req, res, next) => {
  try {
    var newReview = new Review({
      "userID": req.body.userID,
      "productID": req.body.productID,
      "rating": req.body.rating,
      "comment": req.body.comment,
    });

    await newReview.save();
    await User.findByIdAndUpdate(
      req.body.userID,
      {$addToSet: {reviewsWritten: newReview._id} 
    });
    await Drink.findByIdAndUpdate(
      req.body.productID,
      {$addToSet: {hasReviews: newReview._id} 
    });

    return res.status(201).json(newReview);
  } catch(err) { next(err) };
});

/**
 * @route PATCH /reviews/:reviewId
 * @description Partially updates a specific review.
 * @param {string} reviewId - The ID of the review to update.
 * @body {string} [userID] - The ID of the user.
 * @body {string} [productID] - The ID of the drink.
 * @body {number} [rating] - Updated rating value.
 * @body {string} [comment] - Updated comment.
 * @returns {Object} 200 - The updated review object.
 * @returns {Object} 404 - Review not found.
 */
router.patch("/reviews/:reviewId", async (req, res, next) => {
  // Find the review to update
  try {
    const updatedReview = await Review
      .findById(req.params.reviewId);

    if (!updatedReview) {
      return res.status(404).json({"message": "Review not found"});
    } 

    // Update the review's fields if new values are provided
    updatedReview.userID = (req.body.userID || updatedReview.userID);
    updatedReview.productID = (req.body.productID || updatedReview.productID);
    updatedReview.rating = (req.body.rating || updatedReview.rating);
    updatedReview.comment = (req.body.comment || updatedReview.comment);

    // Save the updated review to the database
    await updatedReview.save().catch(err => { next(err) });

    return res.json(updatedReview);
  } catch(err) { next(err) };
});

/**
 * @route PUT /reviews/:reviewId
 * @description Replaces a specific review entirely.
 * @param {string} reviewId - The ID of the review to replace.
 * @body {string} userID - The ID of the user.
 * @body {string} productID - The ID of the drink.
 * @body {number} rating - Rating value for the drink.
 * @body {string} comment - Comment for the review.
 * @returns {Object} 200 - The replaced review object.
 * @returns {Object} 404 - Review not found.
 */
router.put("/reviews/:reviewId", async (req, res, next) => {
  // Find the review to update
  try {
    const updatedReview = await Review
      .findById(req.params.reviewId);

    if (!updatedReview) {
      return res.status(404).json({"message": "Review not found"});
    }

    // Update the review's fields if new values are provided
    updatedReview.userID = req.body.userID;
    updatedReview.productID = req.body.productID;
    updatedReview.rating = req.body.rating;
    updatedReview.comment = req.body.comment;
    
    await updatedReview.save().catch(err => { next(err) });
    
    return res.json(updatedReview);
  } catch(err) { next(err) };
});

/**
 * @route DELETE /reviews/:reviewId
 * @description Deletes a specific review and removes references from user and drink.
 * @param {string} reviewId - The ID of the review to delete.
 * @returns {Object} 200 - The deleted review object.
 * @returns {Object} 404 - Review not found.
 */
router.delete("/reviews/:reviewId", async (req, res, next) => {
  try {
    const reviewToDelete = await Review
      .findByIdAndDelete(req.params.reviewId)

    if (!reviewToDelete) {
      return res.status(404).json({"message": "Review not found"})
    }

    await User.findByIdAndUpdate(
      reviewToDelete.userID, { 
        $pull: {
        reviewsWritten: reviewToDelete._id
    }});
    await Drink.findByIdAndUpdate(
      reviewToDelete.productID, {
        $pull: {
        hasReviews: reviewToDelete._id
    }});

    return res.json(reviewToDelete);
  } catch(err) { next(err) };
});

/**
 * @route DELETE /reviews
 * @description Deletes all reviews and clears references from all users and drinks. Use with caution.
 * @returns {Object} 200 - Object containing deletion count.
 * @returns {Object} 404 - No reviews found.
 */
router.delete("/reviews", async (req, res, next) => {
  try {
    const reviewsToDelete = await Review
      .deleteMany()

    await User.updateMany({}, {
      $set: {
        reviewsWritten: []
    }});
    await Drink.updateMany({}, {
      $set: {
        hasReviews: []
    }});

    if (reviewsToDelete.deletedCount == 0) {
      return res.status(404).json({"message": "No reviews found"})
    }
            
    return res.json(reviewsToDelete);
  } catch(err) {next(err) };
});

module.exports = router;
