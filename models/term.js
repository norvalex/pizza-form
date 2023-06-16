const Joi = require("joi");
const mongoose = require("mongoose");
const { locationSchema } = require("./location");

const schemaOptions = {
  toJson: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
};

const termSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      minLength: 5,
      maxLength: 255,
    },
    pricePerSlice: {
      type: Number,
      min: 0,
      required: true,
    },
    dates: {
      type: [Date],
      required: true,
    },
    locations: {
      type: [locationSchema],
      required: true
    },
  },
  schemaOptions
);

termSchema.virtual("numberOfDays").get(function () {
  return this.dates.length;
});

const Term = mongoose.model("Term", termSchema);

function termValidation(term, requestType) {
  const schema = Joi.object({
    label: Joi.string().min(5).max(255).required(),
    pricePerSlice: Joi.number().min(0).required(),
    dates: Joi.array().items(
      Joi.date().iso().messages({ "date.format": `Date format is YYYY-MM-DD` })
    ).required(),
    locations: Joi.array().items(Joi.objectId()).required(),
  });

  return schema.validate(term);
}
module.exports.Term = Term;
module.exports.termValidation = termValidation;
