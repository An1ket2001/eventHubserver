const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const desgSchema = new Schema({
    designation: { type: String }
});

module.exports = mongoose.model('Designation', desgSchema);