var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

var Schema = mongoose.Schema;

/**
 * @module User
 * @description Represents a registered user of the application.
 * 
 * @property {string} email - Unique email address (required).
 * @property {Object} settings - User preferences (darkMode, notifications, language).
 * @property {Array} alcoholConsumed - History of alcohol consumption entries.
 * 
 * @relationship User (N) - Users this user follows.
 * @relationship Systembolag (1) - User's favorite store.
 * @relationship Drink (N) - Drinks the user has tried (with favorite flag).
 * @relationship Review (N) - Reviews written by this user.
 */
var userSchema = new Schema({
    // Local attributes
    "email": {type: String, unique: true, required: true},
    "profilePicture": {type: String},
    "userName": {type: String},
    "password": {type: String},
    "settings": {
        "darkMode": {type: Boolean, default: false},
        "notifications": {type: Boolean, default: true},
        "language": {type: String, default: "en"}
    },
    "alcoholConsumed": [{
        "volume": {type: Number},
        "percent": {type: Number},
        "timestamp": {type: Date, default: Date.now}
    }],

    // The composite address field from the ER diagram
    "street": {type: String},
    "streetNumber": {type: Number},
    "postalCode": {type: Number},
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
