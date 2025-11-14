var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

//shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

//Define the structure of the schema
var locationSchema = new Schema({
    "locationID": {type: String, unique: true},
    "longitude": {type: Number},
    "latitude": {type: Number},
    "address:": [{
        "postalCode": {type: Number},
        "street": {type: String},
        "streetNumber": {type: Number},
        "city": {type: String}
    }]

})

// Create a Mongoose model called "Location" to interact with the "Location" collection in the database
var Location = mongoose.model("Location", locationSchema);