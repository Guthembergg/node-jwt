const express = require("express");
const { Db } = require("mongodb");

const mongoose = require("mongoose");
require("dotenv").config();
const uri =
  "mongodb+srv://karim:karim@cluster0.tfy8kwa.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const router = express.Router();
const Friends = mongoose.model(
  "friends",
  new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    DOB: String,
  })
);

let friends2 = {
  "johnsmith@gamil.com": {
    firstName: "John",
    lastName: "Doe",
    DOB: "22-12-1990",
  },
  "annasmith@gamil.com": {
    firstName: "Anna",
    lastName: "smith",
    DOB: "02-07-1983",
  },
  "peterjones@gamil.com": {
    firstName: "Peter",
    lastName: "Jones",
    DOB: "21-03-1989",
  },
};
// GET request: Retrieve all friends
router.get("/", async (req, res) => {
  // Update the code here
  res.send(JSON.stringify(await Friends.find().exec()));
});

// GET by specific ID request: Retrieve a single friend with email ID
router.get("/:firstName", async (req, res) => {
  const name = req.params.firstName;
  res.send(await Friends.find({ firstName: name }).exec());
});

// POST request: Add a new friend
router.post("/", async (req, res) => {
  if (req.body.email) {
    const f = new Friends({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      DOB: req.body.DOB,
    });
    const friendExist = await Friends.exists({
      email: req.body.email,
    }).exec();
    if (!friendExist) {
      f.save().then(
        () => console.log("One friend entry added"),
        (err) => console.log(err)
      );

      return res.status(200).json({
        message: "Friend successfully registred",
      });
    } else {
      return res.status(400).json({
        message: "Friend already registred",
      });
    }
  } else {
    return res.status(400).json({
      message: "Missing friend email",
    });
  }
});

// PUT request: Update the details of a friend with email id
router.put("/:firstName", async (req, res) => {
  const name = req.params.firstName;
  let friend2 = await Friends.find({ fistName: name }).exec();
  if (friend2) {
    //Check is friend exists
    let DOB = req.body.DOB;
    let firstName = req.body.firstName;
    let lastname = req.body.lastname;
    let email = req.body.email;
    await Friends.updateOne({
      email: email,
      firstName: firstName,
      lastName: lastname,
      DOB: DOB,
    });
    res.status(200).send(`Friend with the name  ${firstName} updated.`);
  } else {
    res.status(404).send("Unable to find friend!");
  }
});

// DELETE request: Delete a friend by email id
router.delete("/:email", async (req, res) => {
  const email = req.params.email;
  rightFriend = await Friends.exists({ email: email }).exec();
  if (email && rightFriend) {
    await Friends.deleteOne({ email: email }).exec();
    return res.status(200).send(`Friend with the email  ${email} deleted.`);
  } else
    res.status(404).send(`You don't have a friend with the email  ${email}.`);
});

module.exports = router;
