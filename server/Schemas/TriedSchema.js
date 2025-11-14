var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

var Schema = mongoose.Schema;

var triedSchema = new Schema({
    "drink": {
        //Type stores mongodb objectID, which is what mongoose uses to store relationships between documents.
        "type": Schema.Types.ObjectId,

        //This connects the objectID to the Drink collection
        "ref": "Drink",

        //This forces the field to not be empty when creating a new document.
        "required": true
    },
    "user": {
        "type": Schema.Types.ObjectId,
        "ref": "User",
        "required": true
    },
    //local attributes
    "rating": {type: Number, min: 1, max: 5},
    "review": {type: String},
    "favorite": {type: Boolean, default: false}
})

var Tried = mongoose.model("Tried", triedSchema);