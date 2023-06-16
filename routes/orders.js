const express = require("express");
const { Order, orderValidation } = require("../models/order");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");
const { Term } = require("../models/term");
const { Person } = require("../models/person");
const _ = require("lodash");

const router = express.Router();

router.get("/", async (req, res) => {
  const orders = await Order.find().sort("name");

  res.send(orders);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).send("Order not found");

  res.send(order);
});

router.post(
  "/",
  [auth, validate(orderValidation, "post")],
  async (req, res) => {
    const term = await Term.findById(req.body.termId);
    if (!term) return res.status(400).send("Term not found");

    const persons = [];
    for (let i in req.body.persons) {
      const personId = req.body.persons[i];
      const person = await Person.findById(personId);
      if (!person) return res.status(400).send("Person not found");
      persons.push(person);
    }

    const order = new Order({
      email: req.body.email,
      persons: persons,
      term: _.pick(term, ["_id", "label", "pricePerSlice", "numberOfDays"]),
    });

    await order.save();

    res.send(
      _.pick(order, [
        "_id",
        "email",
        "persons",
        "term",
        "totalNumberOfSlices",
        "amountPayable",
        "paymentReference",
      ])
    );
  }
);

router.put(
  "/:id",
  [auth, validateObjectId, validate(orderValidation, "put")],
  async (req, res) => {
    const term = await Term.findById(req.body.termId);
    if (!term) return res.status(400).send("Term not found");

    const persons = [];
    for (let i in req.body.persons) {
      const personId = req.body.persons[i];
      const person = await Person.findById(personId);
      if (!person) return res.status(400).send("Person not found");
      persons.push(person);
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        email: req.body.email,
        persons: persons,
        term: _.pick(term, ["_id", "label", "pricePerSlice", "numberOfDays"]),
      },
      { new: true }
    );

    if (!order) return res.status(404).send("Order not found");

    res.send(
      _.pick(order, [
        "_id",
        "email",
        "persons",
        "term",
        "totalNumberOfSlices",
        "amountPayable",
        "paymentReference",
      ])
    );
  }
);

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) return res.status(404).send("Order not found");

  res.send(
    _.pick(order, [
      "_id",
      "email",
      "persons",
      "term",
      "totalNumberOfSlices",
      "amountPayable",
      "paymentReference",
    ])
  );
});

module.exports = router;
