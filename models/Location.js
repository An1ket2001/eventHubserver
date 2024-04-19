const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const locSchema = new Schema({
    location: { type: String },
});

module.exports = mongoose.model('Location', locSchema);