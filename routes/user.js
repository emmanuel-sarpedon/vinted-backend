const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    if (
      !(await User.findOne({ email: req.fields.email })) &&
      req.fields.username &&
      req.fields.password &&
      req.fields.email &&
      req.fields.phone
    ) {
      const password = req.fields.password;
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      const newUser = new User({
        email: req.fields.email,
        account: {
          username: req.fields.username,
          phone: req.fields.phone,
          avatar: null,
        },
        token: token,
        hash: hash,
        salt: salt,
      });

      if (req.files.avatar) {
        let pictureToUpload = req.files.avatar.path;
        const result = await cloudinary.uploader.upload(pictureToUpload, {
          folder: "/vinted/users/" + newUser._id,
        });

        newUser.account.avatar = result;
      }

      await newUser.save();

      res.status(200).json({
        id: newUser._id,
        email: newUser.email,
        account: newUser.account,
        token: newUser.token,
      });
    } else if (await User.findOne({ email: req.fields.email })) {
      res.status(461).json({ error: "This email is already used" });
    } else if (!req.fields.username) {
      res.status(462).json({ error: "Username is required" });
    } else if (!req.fields.password) {
      res.status(463).json({ error: "Password is required" });
    } else if (!req.fields.email) {
      res.status(464).json({ error: "Email is required" });
    } else if (!req.fields.phone) {
      res.status(465).json({ error: "Phone is required" });
    }
  } catch (err) {
    res.status(404).json(err.message);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const logInEmail = req.fields.email;
    const logInPassword = req.fields.password;
    const user = await User.findOne({ email: logInEmail });

    if (user) {
      const logInHash = SHA256(logInPassword + user.salt).toString(encBase64);
      if (logInHash === user.hash) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(400).json({ error: "Wrong ID" });
      }
      //res.json(logInHash);
      //res.status(200).json({ message: "Mail OK" });
    } else {
      res.status(400).json({ error: "Unknown email" });
    }
  } catch (err) {
    res.status(404).json(err.message);
  }
});

module.exports = router;
