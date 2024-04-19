const express = require("express");
const LocationController = require("../controller/locationLogic")
const router = express.Router();
const auth = require("../middleware/auth");

router.get("/getlocation",auth,LocationController.getLocation);

module.exports=router;
