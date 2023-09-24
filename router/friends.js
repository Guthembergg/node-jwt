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

const Person = mongoose.model(
  "person",
  new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    email: String,
    posts: [{ username: String, text: String, likes: [String], date: Date }],
    friends: [String],
    likes: [{ username: String, text: String, date: Date }],
  })
);
// GET request: Retrieve all friends
router.get("/", async (req, res) => {
  // Update the code here
  res.send(JSON.stringify(await Person.find().exec()));
});

// GET by specific ID request: Retrieve a single friend with email ID
router.get("/:firstName", async (req, res) => {
  const name = req.params.firstName;
  res.send(await Person.find({ firstName: name }).exec());
});
router.get("/:username", async (req, res) => {
  const name = req.params.username;
  res.send(await Person.find({ username: name }).exec());
});
// POST request: Add a new friend
router.post("/", async (req, res) => {
  if (req.body.email) {
    const f = new Person({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
    });
    const friendExist = await Person.exists({
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

//POST request to add friends
router.post("/friend/:username", async (req, res) => {
  if (req.body.friends) {
    const friendExist = await Person.exists({
      username: req.params.username,
    }).exec();
    const thisPerson = await Person.find({
      username: req.params.username,
    }).exec();
    console.log(thisPerson);
    if (!thisPerson[0].friends.includes(req.body.friends)) {
      if (friendExist) {
        await Person.updateOne(
          Person.find({ username: req.params.username }),

          { $push: { friends: req.body.friends } }
        );

        return res.status(200).json({
          message: "Friend successfully added ",
        });
      } else {
        return res.status(400).json({
          message: "Person with that email not registred",
        });
      }
    } else {
      return res.status(400).json({
        message: "Friend already added",
      });
    }
  } else {
    return res.status(400).json({
      message: "Missing friend in the body",
    });
  }
});
//POST request to add posts
router.post("/posts/:username", async (req, res) => {
  if (req.body.post) {
    const friendExist = await Person.exists({
      username: req.params.username,
    }).exec();
    const thisPerson = await Person.find({
      username: req.params.username,
    }).exec();
    console.log(thisPerson);

    if (friendExist) {
      await Person.updateOne(
        Person.find({ username: req.params.username }),

        { $push: { posts: req.body.post } }
      );

      return res.status(200).json({
        message: "Post successfully added ",
      });
    } else {
      return res.status(400).json({
        message: "Person with that username not registred",
      });
    }
  } else {
    return res.status(400).json({
      message: "Missing post in the body",
    });
  }
});

//POST request to add likes
router.post("/likes/:username", async (req, res) => {
  const friendExist = await Person.exists({
    username: req.params.username,
  }).exec();
  const thisPerson = await Person.find({
    username: req.params.username,
  }).exec();

  const post = thisPerson[0].likes.filter((f) => f._id.equals(req.body.id));

  if (post.length <= 0) {
    if (friendExist) {
      const thePost = await Person.find(
        {
          posts: { $elemMatch: { _id: req.body.id } },
        },
        { posts: 1 }
      ).exec();
      console.log(thePost);

      await Person.updateOne(
        { username: req.params.username },

        {
          $push: {
            likes: thePost[0].posts,
          },
        }
      );

      return res.status(200).json({
        message: "Like successfully added ",
      });
    } else {
      return res.status(400).json({
        message: "Person with that username not registred",
      });
    }
  } else {
    return res.status(400).json({
      message: "Post already liked or id not existing",
    });
  }
});

//remove likes
router.post("/likes/:username/:id", async (req, res) => {
  const thisPerson = await Person.find({
    username: req.params.username,
  }).exec();
  if (thisPerson[0].likes.filter((f) => f._id === req.params.id)) {
    if (thisPerson) {
      await Person.updateOne(
        {},

        { $pull: { likes: { _id: req.params.id } } }
      );

      return res.status(200).json({
        message: "Like successfully removed ",
      });
    } else {
      return res.status(400).json({
        message: "Person with that username not registred",
      });
    }
  } else {
    return res.status(400).json({
      message: "post was not liked",
    });
  }
});
// PUT request: Update the details of a person with email id
router.put("/:email", async (req, res) => {
  const email = req.params.email;
  let searchedP = await Person.find({ email: email }).exec();
  if (searchedP) {
    //Check if friend exists
    let firstName = req.body.firstName;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let posts = req.body.posts;
    let friends = req.body.friends;

    await Person.updateOne(Person.find({ email: email }), {
      email: email,
      firstName: firstName,
      lastName: lastname,
      posts: posts,
      friends: friends,
    });
    res.status(200).send(`Friend with the name  ${firstName} updated.`);
  } else {
    res.status(404).send("Unable to find friend!");
  }
});

router.put("/post/:username/:_id", async (req, res) => {
  const username = req.params.username;
  let searchedP = await Person.find({ username: username }).exec();
  if (searchedP) {
    await Person.updateOne(
      {
        posts: { _id: req.params.id },
      },
      {
        $set: {
          posts: {
            text: req.body.text,
          },
        },
      }
    );
    res.status(200).send(`Post with the id ${req.params.id} updated.`);
  } else {
    res.status(404).send("Unable to find username!");
  }
});

// DELETE request: Delete a friend by email id
router.delete("/:email", async (req, res) => {
  const email = req.params.email;
  rightFriend = await Person.exists({ email: email }).exec();
  if (email && rightFriend) {
    await Person.deleteOne({ email: email }).exec();
    return res.status(200).send(`Friend with the email  ${email} deleted.`);
  } else
    res.status(404).send(`You don't have a friend with the email  ${email}.`);
});

module.exports = router;
