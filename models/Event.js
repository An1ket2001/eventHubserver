const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const eventSchema = new Schema({
    title: { type: String },
    description: { type: String },
    date:{type:String},
    location:{
        type: Schema.Types.ObjectId,
        ref: "Location"},
    titleImage:{type:String},
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    subscribers:[{
        type: Schema.Types.ObjectId,
        ref: "User",
      }]
});

module.exports = mongoose.model('event', eventSchema);