var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

//shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

//Define the structure of the schema
var userSchema = new Schema({
    "userID": {type: Number, unique: true},
    "email": {type: String},
    "profilePicture": {type: String},
    "userName": {type: String}
})

// Create a Mongoose model called "User" to interact with the "User" collection in the database
//var User = mongoose.model("User", userSchema);
module.exports=mongoose.model("users", userSchema);