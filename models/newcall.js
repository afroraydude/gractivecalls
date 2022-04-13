const mongoose = require('mongoose');
const schema = require('./schema/newcall.js');

const Call = mongoose.model('NewCall', schema);

module.exports = Call;