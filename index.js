const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const uri =
  "mongodb+srv://karim:karim@cluster0.tfy8kwa.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const jwt = require("jsonwebtoken");
const session = require("express-session");
const routes = require("./router/friends.js");
const MongoClient = require("mongodb").MongoClient;
MongoClient.connect(uri).then((client) => {
  console.log(`Connected to Database`);
  const db = client.db("test");
  db.mongoose = mongoose;
  const tasksCollection = db.collection("users");
});
const User = mongoose.model(
  "users",
  new mongoose.Schema({
    username: String,
    password: String,
  })
);

const app = express();

app.use(
  session({ secret: "fingerpint" }, (resave = true), (saveUninitialized = true))
);

app.use(express.json());

app.use("/friends", function auth(req, res, next) {
  if (req.session.authorization) {
    token = req.session.authorization["accessToken"];
    jwt.verify(token, "access", (err, user) => {
      if (!err) {
        req.user = user;
        next();
      } else {
        return res.status(403).json({ message: "User not authenticated" });
      }
    });
  } else {
    return res.status(403).json({ message: "User not logged in" });
  }
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in" });
  }
  const user2 = await User.exists({
    username: username,
    password: password,
  }).exec();
  console.log(user2);
  if (user2) {
    let accessToken = jwt.sign(
      {
        data: password,
      },
      "access",
      { expiresIn: 60 * 60 }
    );

    req.session.authorization = {
      accessToken,
      username,
    };
    return res
      .status(200)
      .send("User successfully logged in, token: " + accessToken);
  } else {
    return res
      .status(208)
      .json({ message: "Invalid Login. Check username and password" });
  }
});
const Person = mongoose.model("person");
app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const firstname = req.body.firstName;
  const lastname = req.body.lastName;

  const user2 = await User.exists({
    username: username,
  }).exec();
  console.log(user2);
  if (username && password && email && firstname && lastname) {
    if (!user2) {
      const stud = new User({ username: username, password: password });

      const f = new Person({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
      });

      stud.save().then(
        () =>
          f.save().then(
            () => {
              return res
                .status(200)
                .json({ message: "User and person registered!" });
            },
            () => {
              return res
                .status(404)
                .json({ message: "User registered but person not registered" });
            }
          ),
        (err) => {
          return res
            .status(404)
            .json({ message: "Error person not registered!" });
        }
      );
    } else {
      return res.status(404).json({ message: "User already exists!" });
    }
  } else {
    return res.status(404).json({ message: "Unable to register user." });
  }
});

const PORT = 5000;

app.use("/social", routes);

app.listen(PORT, () => console.log("Server is running"));
