const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const empSchema = new Schema({
    name: { type: String },
    email:{type:String},
    password:{type:String},
    designation: { 
        type: Schema.Types.ObjectId,
        ref: "Designation", },
});

module.exports = mongoose.model('User', empSchema);