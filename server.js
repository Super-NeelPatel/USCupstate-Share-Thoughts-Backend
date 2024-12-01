const express = require("express");
const bodyParser = require("body-parser");
const User = require("./models/userModel");
const mongoose = require("mongoose");

const app = express();

const cors = require("cors");
app.use(cors()); // Allow requests from any domain or localhost

app.use(bodyParser.json());

const userRoutes = require("./routes/user-routes"); // Your user routes
const postRoutes = require("./routes/post-routes");
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

mongoose
  .connect(
    "mongodb+srv://@cluster0.mqujt.mongodb.net/upstate-share-thoughts?retryWrites=true&w=majority&appName=Cluster0",
    {
      // Add these options if necessary
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(8000, () => {
      console.log("Server is running on 8000");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });
