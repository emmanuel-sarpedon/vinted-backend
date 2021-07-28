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

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page, limit } = req.query;

    const filters = {};
    const sorting = {};
    const resultsPerPage = limit ? parseInt(limit) : 10;

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
      sorting.product_price = sort.split("-")[1];
    }

    if (page) {
      skip = resultsPerPage * parseInt(page) - resultsPerPage;
    }

    const offers = await Offer.find(filters)
      .populate("owner")
      .sort(sorting)
      .limit(resultsPerPage)
      .skip(skip);

    const count = await Offer.countDocuments(filters);

    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate("owner");

    if (offer) {
      res.status(200).json(offer);
    } else {
      res.status(401).json({ message: "No result" });
    }
  } catch (err) {
    res.json(err.message);
  }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    const offerToUpdate = await Offer.findOne({
      owner: req.user.id,
      _id: req.fields.id,
    });

    if (offerToUpdate) {
      const brand = req.fields.brand;
      const size = req.fields.size;
      const condition = req.fields.condition;
      const color = req.fields.color;
      const city = req.fields.city;
      const name = req.fields.name;
      const description = req.fields.description;
      const price = req.fields.price;
      const picture = req.files.picture;

      if (brand) {
        offerToUpdate.product_details[0] = { MARQUE: brand };
      }

      if (size) {
        offerToUpdate.product_details[1] = { TAILLE: size };
      }

      if (condition) {
        offerToUpdate.product_details[2] = { ETAT: condition };
      }

      if (color) {
        offerToUpdate.product_details[3] = { COULEUR: color };
      }

      if (city) {
        offerToUpdate.product_details[4] = { EMPLACEMENT: city };
      }

      if (name) {
        offerToUpdate.product_name = name;
      }

      if (description) {
        offerToUpdate.product_description = description;
      }

      if (price) {
        offerToUpdate.product_price = price;
      }

      if (picture) {
        let pictureToUpload = req.files.picture.path;
        const result = await cloudinary.uploader.upload(pictureToUpload, {
          folder: "/vinted/offers/" + offerToUpdate._id,
        });
        offerToUpdate.product_image = result;
      }

      offerToUpdate.markModified("product_details");

      await offerToUpdate.save();

      res.status(200).json({ message: "Update OK", offer: offerToUpdate });
    } else {
      res.status(400).json({ message: "Offer not found" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const offerToDelete = await Offer.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (offerToDelete) {
      res
        .status(200)
        .json({ message: "Offer deleted", offerDeleted: offerToDelete });
    } else {
      res.status(400).json({ message: "Offer not found" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
