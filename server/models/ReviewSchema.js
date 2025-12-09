var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

//shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

//Define the structure of the schema
var reviewSchema = new Schema({
    // Composite primary key
    "email": {type: Schema.Types.String, ref: "User"},
    "productID": {type: Schema.Types.ObjectId, ref: "Drink"},

    // Local attributes
    "rating": {type: Number, min: [1, "Rating must be atleast 1"], max: [5, "Rating can not be more than 5"]},
    "comment": {type: String},
})

// Create a Mongoose model called "Review" to interact with the "Review" collection in the database
module.exports = mongoose.model("Review", reviewSchema);