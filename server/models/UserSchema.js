var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

//shortcut for Mongoose schema constructor
var Schema = mongoose.Schema;

//Define the structure of the schema
var userSchema = new Schema({
    // Primary key
    "userID": {type: Number, unique: true},

    // Local attributes
    "email": {type: String, unique: true, required: true},
    "profilePicture": {type: String},
    "userName": {type: String},
    "settings": {
        "darkMode": {type: Boolean, default: false},
        "notifications": {type: Boolean, default: true},
        "language": {type: String, default: "en"}
    },

    // The composite address field from the ER diagram
    "street": {type: String},
    "streetNumber": {type: Number},
    "postalCode": {type: String},
    "city": {type: String},

    // Derived attributes
    "longitude": {type: Number},
    "latitude": {type: Number},

    // Relationships
    "follows": [{
        "type": Schema.Types.ObjectId,
        "ref": "User"
    }],
    "favoriteSystembolag": {
        "type": Schema.Types.ObjectId,
        "ref": "Systembolag"
    },
    "triedDrinks": [{
        "drink": {
            "type": Schema.Types.ObjectId,
            "ref": "Drink"
        },
        "favorite": {type: Boolean, default: false}
    }],
    "reviewsWritten": [{
        "type": Schema.Types.ObjectId,
        "ref": "Review"
    }]
})

// Create a Mongoose model called "User" to interact with the "User" collection in the database
module.exports = mongoose.model("User", userSchema);
