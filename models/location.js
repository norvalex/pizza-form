const Joi = require("joi");
const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 255,
  },
  classes: {
    type: [String],
    required: true
  },
});

const Location = mongoose.model("Location", locationSchema);

function locationValidation(location, requestType) {
  const schema = Joi.object({
    label: Joi.string().min(5).max(255).required(),
    classes: Joi.array().items(Joi.string().max(255)).required(),
  });

  return schema.validate(location);
}
module.exports.Location = Location;
module.exports.locationValidation = locationValidation;
module.exports.locationSchema = locationSchema;
