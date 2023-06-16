const express = require("express");
const { Person, personValidation } = require("../models/person");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/", async (req, res) => {
  const persons = await Person.find().sort("name");

  res.send(persons);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const person = await Person.findById(req.params.id);
  if (!person) return res.status(404).send("Person not found");

  res.send(person);
});

router.post(
  "/",
  [auth, validate(personValidation, "post")],
  async (req, res) => {

    const person = new Person({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      location: req.body.location,
      class: req.body.location,
      numberOfSlices: req.body.numberOfSlices,
    });

    await person.save();

    res.send(person);
  }
);

router.put(
  "/:id",
  [auth, validateObjectId, validate(personValidation, "put")],
  async (req, res) => {

    const person = await Person.findByIdAndUpdate(
      req.params.id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location,
        class: req.body.location,
        numberOfSlices: req.body.numberOfSlices,
      },
      { new: true }
    );

    if (!person) return res.status(404).send("Person not found");

    res.send(person);
  }
);

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const person = await Person.findByIdAndDelete(req.params.id);

  if (!person) return res.status(404).send("Person not found");

  res.send(person);
});

module.exports = router;
