const express = require("express");
const EventController = require("../controller/eventLogic")
const router = express.Router();
const multer = require('multer');  
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); 
const auth =require("../middleware/auth");

router.post("/createEvent",auth,upload.single('imageDetails'),EventController.createEvent);
router.get("/getEventImage/:imagename",EventController.getEventImage);
router.post("/getEvents",EventController.getEvent);
router.patch("/updateEvents",auth,upload.single('imageDetails'),EventController.updateEvent);
router.delete("/deleteEvents",auth,EventController.deleteEvent);
router.post("/subscribeEvent",auth,EventController.subscribeEvent);
router.get("/getSubscribedEvents",auth,EventController.getSubscribedEvents);
router.get("/myCreatedEvents",auth,EventController.getMyEvents);
router.get("/getspecificevent/:id",auth,EventController.getSpecificEvents);



module.exports=router;