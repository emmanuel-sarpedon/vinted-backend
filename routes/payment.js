const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/payment", isAuthenticated, async (req, res) => {
  const { stripeToken, totalPrice, description } = req.fields;
  // Créer la transaction

  const response = await stripe.charges.create({
    amount: totalPrice * 100,
    currency: "eur",
    description: description,
    source: stripeToken,
  });

  res.json(response);
});

module.exports = router;
