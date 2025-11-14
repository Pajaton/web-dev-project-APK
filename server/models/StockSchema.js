var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animalDevelopmentDB';

var Schema = mongoose.Schema;

var stockSchema = new Schema({
    "drink": {
        //Type stores mongodb objectID, which is what mongoose uses to store relationships between documents.
        "type": Schema.Types.ObjectId,

        //This connects the objectID to the Drink collection
        "ref": "Drink",

        //This forces the field to not be empty when creating a new document.
        "required": true
    },
    "systembolag": {
        "type": Schema.Types.ObjectId,
        "ref": "Systembolag",
        "required": true
    }
})

var Stock = mongoose.model("Stock", stockSchema);