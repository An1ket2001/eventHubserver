const Event = require("../models/Event");
const Location = require("../models/Location");
const { BlockBlobClient } = require("@azure/storage-blob");
const { uuid } = require("uuidv4");
const User = require("../models/User");
const mongoose = require("mongoose");

const sendMail = async (eventId, cc, subject, body) => {
  let tomails = "";
  const event = await Event.aggregate([
    {
      $match: { _id: eventId },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribers",
        foreignField: "_id",
        as: "subs",
      },
    },
  ]);
  event[0].subs.map((user) => (tomails += user.email + ","));

  const emailData = {
    to: tomails,
    cc: cc,
    subject: subject,
    body: event[0].title + " " + body,
  };
  const mailres = await fetch(process.env.LOGIC_APP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(emailData),
  });
};

const createEvent = async (req, res) => {
  try {
    const { title, description, locationId, date } = req.body;
    authorId = req.user.id;
    console.log(authorId);
    const filename = req.file.originalname + uuid(); //This things to ask for
    const blobService = new BlockBlobClient(
      process.env.BLOB_URL,
      "images",
      filename
    );
    blobService
      .uploadData(req.file.buffer)
      .then(() => {
        Event.create({
          title,
          description,
          author: authorId,
          location: locationId,
          date,
          subscribers: [],
          titleImage: filename,
        });
        return res.status(200).send("File uploaded to Azure Blob storage.");
      })
      .catch((err) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Please try again later fromm blob.");
        }
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Please try again later.");
  }
};

const getEventImage = async (req, res) => {
  const filename = req.params["imagename"];
  const blobService = new BlockBlobClient(
    process.env.BLOB_URL,
    "images",
    filename
  );
  try {
    const downloadResponse = await blobService.download();
    const contentType = downloadResponse.contentType;
    res.set("Content-Type", contentType);
    downloadResponse.readableStreamBody.pipe(res);
  } catch (err) {
    console.log(err);
  }
};

const getEvent = async (req, res) => {
  try {
    // console.log(req.body);
    const { filters } = req.body;
    let events = await Event.aggregate([
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locatio",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authors",
        },
      },
      {
        $project: {
          password: 0,
        },
      },
    ]);
    events = events.filter((event) => {
      if (filters.location !== "") {
        return event.locatio[0].location === filters.location;
      } else {
        return event;
      }
    });
    events = events.filter((event) => {
      if (filters.IsEventOver === "upcoming") {
        return new Date(event.date) >= new Date();
      } else {
        return new Date(event.date) < new Date();
      }
    });
    events = events.filter((event) => {
      if (filters.date !== "") {
        return event.date.split("T")[0] === filters.date;
      } else {
        return event;
      }
    });
    return res.status(200).json(events);
  } catch (err) {
    console.log(err);
    res.status(500).send("Please try again.");
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    sendMail(
      eventId,
      "",
      `Event Has been Cancelled`,
      "Event Has been Cancelled"
    );
    await Event.findByIdAndDelete(eventId);
    return res.status(200).send("Successfully deleted");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Please try again.");
  }
};

const updateEvent = async (req, res) => {
  try {
    const { title, description, locationId, date, eventId, imagechanged } =
      req.body;
    if (imagechanged === "true") {
      console.log(req.file);
      const filename = req.file.originalname + uuid();
      const blobService = new BlockBlobClient(
        process.env.BLOB_URL,
        "images",
        filename
      );
      blobService
        .uploadData(req.file.buffer)
        .then(async () => {
          const events = await Event.findById(eventId);
          if (!events) {
            res
              .status(500)
              .send("Internal server error.Please try again later.");
          }

          (events.title = title),
            (events.description = description),
            (events.location = locationId),
            (events.date = date),
            (events.titleImage = filename);
          await events.save();
          //logic app
          sendMail(
            eventId,
            "",
            `Update Related to ${title}`,
            "event has been Updated. Please visit our site to know about it."
          );
          return res.status(200).send("Updated Succesfully");
        })
        .catch((err) => {
          if (err) {
            console.log(err);
            res.status(500).send("Please try again later from blob.");
            return;
          }
        });
    } else {
      const events = await Event.findById(eventId);
      if (!events) {
        res.status(500).send("Internal server error.Please try again later.");
      }

      (events.title = title),
        (events.description = description),
        (events.location = locationId),
        (events.date = date),
        await events.save();
      sendMail(eventId, "", `Update Related to ${title}`, "Updated");
      return res.status(200).send("Updated Succesfully");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Please try again later.");
  }
};

const subscribeEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send("Invalid User");
    }
    let events = await Event.findById(eventId);
    if (events.subscribers.some((sub) => sub.toString() === userId)) {
      events.subscribers = events.subscribers.filter(
        (sub) => sub.toString() !== userId
      );
    } else {
      events.subscribers.push(userId);
    }
    await events.save();
    return res.status(200).send("Subscribed successfully");
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send("Internal server Error.Please try again later.");
  }
};

const getSubscribedEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    let events = await Event.aggregate([
      {
        $match: {
          subscribers: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locatio",
        },
      },
    ]);

    return res.status(200).json(events);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Please Try again.There was some error.");
  }
};

const getMyEvents = async (req, res) => {
  try {
    const authorId = req.user.id;
    const events = await Event.aggregate([
      {
        $match: { author: new mongoose.Types.ObjectId(authorId) },
      },
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locatio",
        },
      },
    ]);
    return res.status(200).json(events);
  } catch (err) {
    console.log(err);
    return res.status(500).send("There is Some Error.Please Try Again.");
  }
};

const getSpecificEvents = async (req, res) => {
  try {
    const eventId = req.params["id"];
    const userId = req.user.id;
    const event = await Event.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(eventId) },
      },
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locatio",
        },
      },
    ]);
    event[0].isSubscribed = false;
    if (event[0].subscribers.some((subs) => subs.toString() == userId)) {
      isSubscribed = true;
      event[0].isSubscribed = isSubscribed;
    }
    return res.status(200).json(event);
  } catch (err) {
    console.log(err);
    return res.status(200).send("There is Some Error.Please Try Again.");
  }
};

module.exports = {
  createEvent,
  getEventImage,
  getEvent,
  deleteEvent,
  updateEvent,
  subscribeEvent,
  getSubscribedEvents,
  getMyEvents,
  getSpecificEvents,
};
