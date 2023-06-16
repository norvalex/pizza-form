const Joi = require("joi");
const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 255,
  },
  lastName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 255,
  },
  location: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 255,
  },
  class: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  numberOfSlices: {
    type: Number,
    min: 0,
    required: true,
  },
});

const Person = mongoose.model("Person", personSchema);

function personValidation(person, requestType) {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(255).required(),
    lastName: Joi.string().min(2).max(255).required(),
    location: Joi.string().min(5).max(255).required(),
    class: Joi.string().min(1).max(255).required(),
    numberOfSlices: Joi.number().min(0).required(),
  });

  return schema.validate(person);
}
module.exports.Person = Person;
module.exports.personValidation = personValidation;
module.exports.personSchema = personSchema;
