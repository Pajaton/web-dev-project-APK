var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

//shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

//Define the structure of the schema
var systembolagSchema = new Schema({
    "systembolagID": {type: Number, unique: true},
    "name": {type: String}
})

// Create a Mongoose model called "Systembolag" to interact with the "Systembolag" collection in the database
var Systembolag = mongoose.model("Systembolag", systembolagSchema);