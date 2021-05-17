const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ÉTAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      owner: req.user,
    });

    if (req.files.picture) {
      let pictureToUpload = req.files.picture.path;
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: "/vinted/offers/" + newOffer._id,
      });
      newOffer.product_image = result;
    }

    await newOffer.save();

    res.status(200).json(newOffer);
  } catch (err) {
    res.status(400).json(err.message);
  }
});

router.get("/offers", isAuthenticated, async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const filters = {};
    const sorting = {};
    const resultsPerPage = 3;
    let skip = 0;

    if (title) {
      filters.product_description = new RegExp(title, "i");
    }

    if (priceMin && priceMax) {
      filters.product_price = { $gte: priceMin, $lte: priceMax };
    } else if (priceMin && !priceMax) {
      filters.product_price = { $gte: priceMin };
    } else if (!priceMin && priceMax) {
      filters.product_price = { $lte: priceMax };
    }

    if (sort) {
      sorting.product_name = sort;
    }

    if (page > 0) {
      skip = resultsPerPage * page - resultsPerPage;
    }

    const offers = await Offer.find(filters)
      .sort(sorting)
      .limit(resultsPerPage)
      .skip(skip);
    //.select("product_name product_description product_price");

    const count = await Offer.countDocuments(filters, (err, count) => {
      console.log(count);
    });

    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (offer) {
      res.status(200).json(offer);
    } else {
      res.status(401).json({ message: "No result" });
    }
    //res.json(req.params.id);
  } catch (err) {
    res.json(err.message);
  }
});
module.exports = router;
