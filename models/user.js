const mongoose = require('mongoose');

const userSchema = {
  first_name: String,
  last_name: String,
  profile_pic: String,
  locale: String,
  timezone: Number,
  gender: String,
  senderId: String,
  accessToken: String,
  plainTextCount: Number,
  articleCount: Number,
};

module.exports = mongoose.model('User', userSchema);
