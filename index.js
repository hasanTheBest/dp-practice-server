const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// database
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
dotenv.config();
app.use(cors());
app.use(express.json());

// database connection
const uri = `mongodb+srv://${process.env.user}:${process.env.password}@cluster0.rwgtj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;
  console.log("token", token);

  jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access." });
    }

    req.decoded = decoded.email;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    // treatments
    const treatmentCollection = client
      .db("doctorsPortal")
      .collection("treatments");
    // bookings
    const bookingCollection = client.db("doctorsPortal").collection("bookings");
    const userCollection = client.db("doctorsPortal").collection("users");

    /**
     * Treatment Route - Get all treatments
     *  */
    app.get("/treatments", verifyJWT, async (req, res) => {
      const query = {};
      // const { appointmentDate } = req.query;

      /**
       * Lookup booking collection
       * */
      const appointmentDate = "May 18, 2022";
      const lookupCursor = treatmentCollection.aggregate([
        {
          $lookup: {
            from: "bookings",
            localField: "title",
            foreignField: "title",
            pipeline: [
              { $match: { appointmentDate } },
              { $project: { appointmentTime: 1, _id: 0 } },
            ],
            as: "treatment_booking",
          },
        },
        {
          $project: {
            title: 1,
            treatment_booking: 1,
            time: {
              $filter: {
                input: "$time",
                as: "slot",
                cond: {
                  $ne: ["$$slot", "4.30 PM - 5.00 PM"],
                },
              },
              // $cond: [ { $gte: [ "$qty", 250 ] }, 30, 20 ]
              // $ne: ["$time", "$treatment_booking.appointmentTime"],
              // $filter: {
              //   input: "$time",
              //   as: "item",
              //   cond: {
              //     $ne: ["$$item", "$treatment_booking.appointmentTime"],
              //   },
              // },
            },
          },
        },
      ]);

      const result = await lookupCursor.toArray();

      // const cursor = treatmentCollection.find(query);
      // const treatments = await cursor.toArray();

      // send the data
      res.send(result);
      // res.send(treatments);
    });

    /**
     * Booking Route - Create booking
     * */
    app.post("/booking", async (req, res) => {
      let result;
      const { title, email, appointmentDate, appointmentTime } = req.body;

      // filter out result
      const alreadyHave = await bookingCollection.findOne({
        title,
        email,
        appointmentDate,
        appointmentTime,
      });

      if (alreadyHave) {
        result = {
          insertedCount: 0,
          message: "Already have an appointment with the same information.",
        };
      } else {
        result = await bookingCollection.insertOne(req.body);
      }

      res.send(result);
    });

    /**
     * Treatment Route - Get all my services
     *  */
    app.get("/myServices", verifyJWT, async (req, res) => {
      const { user } = req.query;
      let bookings = [];

      if (user) {
        const query = { email: user };

        const cursor = bookingCollection.find(query);
        bookings = await cursor.toArray();
      }
      res.send(bookings);
    });

    /**
     * User Route - update user when sign up
     * */
    app.put("/user", async (req, res) => {
      const { name, email } = req.body;

      const filter = { email };
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          name,
          email,
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc, options);

      const token = jwt.sign({ email }, process.env.TOKEN_SECRET, {
        expiresIn: "5h",
      });

      res.send({ result, token });
    });

    app.get("/users", verifyJWT, async (req, res) => {
      const users = await userCollection.find({}).toArray();
      res.send(users);
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
