import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());

const client = new MongoClient(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rfok0li.mongodb.net/`,
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectedClient = await connectToMongoDB();
const database = connectedClient.db("hireloopdb");
const usersCollection = database.collection("user");
const jobsCollection = database.collection("jobs");

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/users", async (req, res) => {
  const cursor = usersCollection.find({});
  const result = await cursor.toArray();
  res.send(result);
});

//Jobs related APIs
app.get(["/jobs", "/browse-jobs"], async (req, res) => {
  const query = {};
  console.log("query", req.query);
  if (req.query["job-type"]) {
    query.jobType = req.query["job-type"];
  }
  if (req.query.isRemote !== undefined) {
    query.remoteAllowed = req.query.isRemote === "true";
  }
  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.search) {
    const regex = { $regex: req.query.search, $options: "i" };

    query.$or = [
      { title: regex },
      { company: regex },
      { responsibilities: regex },
      { requirements: regex },
    ];
  }
  const cursor = jobsCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});
app.post("/jobs", async (req, res) => {
  const job = req.body;
  const result = await jobsCollection.insertOne(job);
  res.send(result);
});

app.delete("/jobs/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await jobsCollection.deleteOne(query);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
