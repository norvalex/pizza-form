const express = require("express");
const { Term, termValidation } = require("../models/term");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");
const { Location } = require("../models/location");
const _ = require("lodash");

const router = express.Router();

router.get("/", async (req, res) => {
  const terms = await Term.find().sort("name");

  res.send(terms);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const term = await Term.findById(req.params.id);
  if (!term) return res.status(404).send("Term not found");

  res.send(term);
});

router.post("/", [auth, validate(termValidation, "post")], async (req, res) => {
  const locations = [];
  for (let i in req.body.locations) {
    const locationId = req.body.locations[i];

    const location = await Location.findById(locationId);
    if (!location) return res.status(400).send("Location not found");

    locations.push(_.pick(location, ["label", "classes"]));
  }

  const term = new Term({
    label: req.body.label,
    pricePerSlice: req.body.pricePerSlice,
    dates: req.body.dates,
    locations: locations,
  });

  await term.save();

  res.send(
    _.pick(term, [
      "_id",
      "label",
      "pricePerSlice",
      "dates",
      "locations",
      "numberOfDays",
    ])
  );
});

router.put(
  "/:id",
  [auth, validateObjectId, validate(termValidation, "put")],
  async (req, res) => {
    const locations = [];
    for (let i in req.body.locations) {
      const locationId = req.body.locations[i];

      const location = await Location.findById(locationId);
      if (!location) return res.status(400).send("Location not found");

      locations.push(_.pick(location, ["label", "classes"]));
    }

    const term = await Term.findByIdAndUpdate(
      req.params.id,
      {
        label: req.body.label,
        pricePerSlice: req.body.pricePerSlice,
        dates: req.body.dates,
        locations: locations,
      },
      { new: true }
    );

    if (!term) return res.status(404).send("Term not found");

    res.send(
      _.pick(term, [
        "_id",
        "label",
        "pricePerSlice",
        "dates",
        "locations",
        "numberOfDays",
      ])
    );
  }
);

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const term = await Term.findByIdAndDelete(req.params.id);

  if (!term) return res.status(404).send("Term not found");

  res.send(
    _.pick(term, [
      "_id",
      "label",
      "pricePerSlice",
      "dates",
      "locations",
      "numberOfDays",
    ])
  );
});

module.exports = router;
