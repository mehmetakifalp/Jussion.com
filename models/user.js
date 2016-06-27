// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    local            : {
        email        : String,
        password     : String,
        username     : String,
        birthyear    : Number,
        gender       : String,
        avatar       : {
            type : String,
            default: ''
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
        gender       : String,
        birthyear    : Number,
        avatar       : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
        gender       : String,
        birthyear    : Number,
        avatar       : String
    },
    roomName: String,
    status: {
        type: String,
        default: 'disconnect'
    },
    keyword: String
});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
