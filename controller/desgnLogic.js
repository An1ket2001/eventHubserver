const Designation = require("../models/Designation")

const getdesgList=async(req,res)=>{
    try{
        const desgList = await Designation.find({});
        return res.status(200).json(desgList);
    }catch(err){
        return res.status(500).send("Please Try Again!!!");
    }
}

module.exports={
    getdesgList
}