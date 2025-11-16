var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

// Shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

// Define the structure of the schema
var drinkSchema = new Schema({
    // Primary key
    "productNumber": {type: String, unique: true},
    
    // Local attributes
    "name": {type: String},
    "type": {type: String},
    "container": {type: String},
    "volume": {type: Number},
    "percentage": {type: Number},
    "colour": {type: String},
    "price": {type: Number},
    "image": {type: String},
    
    // Derived attributes
    "apk": {type: Number},

    // Relationships
    "hasReviews": [{
        "type": Schema.Types.ObjectId,
        "ref": "Review",
    }],
    "availableAt": [{
        "type": Schema.Types.ObjectId,
        "ref": "Systembolag",
    }],
    "triedBy": [{
        "type": Schema.Types.ObjectId,
        "ref": "User",
    }],
})

// Create a Mongoose model called "Drink" to interact with the "Drink" collection in the database
module.exports = mongoose.model("Drink", drinkSchema);