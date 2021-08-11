require("dotenv").config();

const fs = require("fs");
const marked = require("marked");
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
const paymentRoutes = require("./routes/payment");
app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);

app.get("/", (req, res) => {
  const md = fs.readFileSync("./README.md", "utf8");
  const html = marked(md);
  res.send(`
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <style>
      * {
        margin: 0;

        font-family: "Open Sans";
      }

      body {
        max-width: 1100px;
        margin: 0 auto;
        padding: 50px;
      }

      li {
        list-style-type: "✧ ";
      }
      code {
        font-family: monospace;
        margin: 15px 10px 15px 0;
        background-color: black;
        color: white;
        line-height: 30px;
      }

      pre {
        border-left: 10px solid lightgrey;
        margin: 15px 0;
        padding-left: 10px;
        background-color: black;
        color: white;
        width: auto;
      }

      h1,
      h2,
      h3,
      h4 {
        margin: 30px 0;
      }

      h2 {
        border-left: 5px solid #24b1ba;
        font-weight: bold;
        padding: 10px 20px;
      }

      p {
        line-height: 40px;
        text-align: justify;
      }

      a {
        text-decoration: none;
      }

      a:visited {
        color: inherit;
      }

      a:before {
        content: "🌎 → ";
      }
    </style>
    <link
      href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap"
      rel="stylesheet"
    />
    <title>API Vinted by Emmanuel S.</title>
  </head>
  <body>
    <div>
    ${html}
    </div>
  </body>
</html>
  
  `);
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started on port " + process.env.PORT);
});
