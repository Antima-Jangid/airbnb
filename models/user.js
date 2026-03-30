const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String
});

// ✅ Correct - passportLocalMongoose exports a function
const passportLocalMongoose = require('passport-local-mongoose');
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);