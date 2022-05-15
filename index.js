const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
dotenv.config();

/**
 * Route
 * */

// default
app.get("/", (req, res) => {
  res.send("Doctors portal is running");
});

// Port
app.listen(port, () => console.log("app is listening port: " + port));
