var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

var Schema = mongoose.Schema;

/**
 * @module Review
 * @description Represents a user's review of a drink.
 * 
 * @property {ObjectId} userID - Reference to the User who wrote the review.
 * @property {ObjectId} productID - Reference to the Drink being reviewed.
 * @property {number} rating - Rating from 1-5.
 * @property {string} comment - Optional review text.
 * 
 * @relationship User (1) - The author of this review.
 * @relationship Drink (1) - The drink being reviewed.
 */
var reviewSchema = new Schema({
    // Composite primary key
    "userID": {type: Schema.Types.ObjectId, ref: "User"},
    "productID": {type: Schema.Types.ObjectId, ref: "Drink"},

    // Local attributes
    "rating": {type: Number, min: [1, "Rating must be atleast 1"], max: [5, "Rating can not be more than 5"]},
    "comment": {type: String},
})

// Create a Mongoose model called "Review" to interact with the "Review" collection in the database
module.exports = mongoose.model("Review", reviewSchema);