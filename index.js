const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middlewares

app.use(cors());
app.use(express.json());

// DB URI

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o2yungw.mongodb.net/handyMate?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// connect collection
const serviceCollection = client.db("handyMate").collection("services");
const bookingCollection = client.db("handyMate").collection("bookings");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    await bookingCollection.createIndex(
      { userEmail: 1, service_id: 1 },
      { unique: true }
    );

    app.get("/api/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/api/services/:serviceId", async (req, res) => {
      const id = req.params.serviceId;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      // console.log(service);
      res.send(service);
    });
    app.post("/api/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/api/services/provider/:email", async (req, res) => {
      const providerEmail = req.params.email;
      const query = { providerEmail: providerEmail };
      const userServices = await serviceCollection.find(query).toArray();
      res.send(userServices);
    });

    app.post("/api/bookings", async (req, res) => {
      const booking = req.body;
      try {
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
      } catch (error) {
        if (error.message.includes("E11000")) {
          res
            .status(400)
            .json({ error: "You have already booked this service." });
        } else {
          console.error("An error occurred:", error);
          res.status(500).json({
            error: "An error occurred while processing your request.",
          });
        }
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Handymate is running");
});

app.listen(port, () => {
  console.log(`Handymate app listening on port ${port}`);
});
