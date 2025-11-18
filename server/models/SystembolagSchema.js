var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

//shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

//Define the structure of the schema
var systembolagSchema = new Schema({
    // Primary key
    "systembolagID": {type: Number, unique: true},

    // Local attributes
    "name": {type: String},

    // The composite address field from the ER diasgram
    "street": {type: String},
    "streetNumber": {type: Number},
    "postalCode": {type: String},
    "city": {type: String},

    // Derived attributes
    "longitude": {type: Number},
    "latitude": {type: Number},

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
