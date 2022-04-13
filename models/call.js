const mongoose = require('mongoose');
const schema = require('./schema/call.js');

const Call = mongoose.model('Call', schema);

module.exports = Call;