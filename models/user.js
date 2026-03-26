const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");
const passportPlugin = passportLocalMongoose.default || passportLocalMongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
});

// userSchema.plugin(passportLocalMongoose);
userSchema.plugin(passportPlugin);
module.exports = mongoose.model('User', userSchema);