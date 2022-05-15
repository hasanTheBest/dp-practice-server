const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// database
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
dotenv.config();
express.json();

// database connection
const uri = `mongodb+srv://${process.env.user}:${process.env.password}@cluster0.rwgtj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    // treatments
    const treatmentCollection = client
      .db("doctorsPortal")
      .collection("treatments");
    // bookings
    const bookingCollection = client.db("doctorsPortal").collection("bookings");

    /**
     * Treatment Route
     * Get all treatments
     *  */
    app.get("/treatments", async (req, res) => {
      const query = {};

      const cursor = treatmentCollection.find(query);
      const treatments = await cursor.toArray();

      // send the data
      res.send(treatments);
    });

    /**
     * Booking Route
     * Create booking
     * */
    app.post("/booking", async (req, res) => {
      console.log(req.body);
      const result = await bookingCollection.insertOne(req.body);

      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

/**
 * Route
 * */

// default
app.get("/", (req, res) => {
  res.send("Doctors portal is running");
});

// Port
app.listen(port, () => console.log("app is listening port: " + port));
