var mongoose = require('mongoose');

// define the schema for our room model

var roomSchema = mongoose.Schema({
    creator : {
        type: String,
        default: ''
    },
    name    : {
        type: String,
        trim: true,
        lowercase: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

// create the model for room and expose it to our app
module.exports = mongoose.model('Room', roomSchema);


