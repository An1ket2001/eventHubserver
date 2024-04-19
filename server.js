const express = require("express");
const mongoose = require("mongoose")
const empRoutes = require("./routes/EmployeeRoute")
const eventRoutes = require("./routes/EventRoute")
const locationRoutes = require("./routes/LocationRoute")
const authRoutes = require("./routes/Auth");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cors({origin:'http://localhost:3000'}));
app.use("/api/emp",empRoutes)
app.use("/api/events",eventRoutes);
app.use("/api/location",locationRoutes);
app.use("/api/auth",authRoutes);



mongoose.connect(`${process.env.P_MONGO_URI }`).then(() => {
    app.listen(5000, (err) => {
        if (!err) {
            console.log("server running at port 5000");
        } else {
            console.log(err);
        }
    });
})
