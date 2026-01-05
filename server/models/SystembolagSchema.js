var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

var Schema = mongoose.Schema;

/**
 * @module Systembolag
 * @description Represents a Systembolaget store location.
 * 
 * @property {number} systembolagID - Unique store identifier from OSM/Overpass.
 * @property {number} lon - Longitude coordinate.
 * @property {number} lat - Latitude coordinate.
 * 
 * @relationship Drink (N) - Drinks available at this store.
 * @relationship User (N) - Users who have favorited this store.
 */
var systembolagSchema = new Schema({
    // Primary key
    "systembolagID": {type: Number, unique: true},

    // Local attributes
    "name": {type: String},

    // The composite address field from the ER diasgram
    "street": {type: String},
    "streetNumber": {type: String},
    "postalCode": {type: String},
    "city": {type: String},

    // Derived attributes
    "lon": {type: Number},
    "lat": {type: Number},

    // Relationships
    "hasInStock": [{
        "type": Schema.Types.ObjectId,
        "ref": "Drink"
    }],
    "isFavoriteOf": [{
        "type": Schema.Types.ObjectId,
        "ref": "User"
    }],
})

// Create a Mongoose model called "Systembolag" to interact with the "Systembolag" collection in the database
module.exports = mongoose.model("Systembolag", systembolagSchema);
