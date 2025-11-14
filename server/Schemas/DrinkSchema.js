var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

//shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

//Define the structure of the schema
var drinkSchema = new Schema({
    "productNumber": {type: String, unique: true},
    "name": {type: String},
    "type": {type: String},
    "container": {type: String},
    "volume": {type: Number},
    "percentage": {type: Number},
    "colour": {type: String},
    "price": {type: Number},
    "image": {type: String},
    "APK": {type: Number}
})

// Create a Mongoose model called "Drink" to interact with the "Drink" collection in the database
var Drink = mongoose.model("Drink", drinkSchema);