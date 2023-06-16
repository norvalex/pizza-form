const express = require("express");
const { Location, locationValidation } = require("../models/location");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/", async (req, res) => {
  const locations = await Location.find().sort("name");

  res.send(locations);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) return res.status(404).send("Location not found");

  res.send(location);
});

router.post(
  "/",
  [auth, validate(locationValidation, "post")],
  async (req, res) => {
    const location = new Location({
      label: req.body.label,
      classes: req.body.classes,
    });
    await location.save();

    res.send(location);
  }
);

router.put(
  "/:id",
  [auth, validateObjectId, validate(locationValidation, "put")],
  async (req, res) => {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      {
        label: req.body.label,
        classes: req.body.classes,
      },
      { new: true }
    );

    if (!location) return res.status(404).send("Location not found");

    res.send(location);
  }
);

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const location = await Location.findByIdAndDelete(req.params.id);

  if (!location) return res.status(404).send("Location not found");

  res.send(location);
});

module.exports = router;
