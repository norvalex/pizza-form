const Joi = require("joi");
const mongoose = require("mongoose");
const { personSchema } = require("./person");
const ShortUniqueId = require("short-unique-id");

const schemaOptions = {
  toJson: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
};
const orderSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      minLength: 5,
      maxLength: 255,
    },
    persons: {
      type: [personSchema],
    },
    term: {
      type: new mongoose.Schema({
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
        numberOfDays: {
          type: Number,
          min: 0,
          required: true,
        },
      }),
    },
  },
  schemaOptions
);

orderSchema.virtual("totalNumberOfSlices").get(function () {
  return this.persons.reduce((a, b) => +a + +b.numberOfSlices, 0);
});

orderSchema.virtual("amountPayable").get(function () {
  return this.numberOfSlices * this.term.numberOfDays * this.term.pricePerSlice;
});

orderSchema.virtual("paymentReference").get(function () {
  const shortUID = new ShortUniqueId({ length: 8 })().toUpperCase();
  console.log(shortUID);
  return `PIZZA-${shortUID.substring(0, 4)}-${shortUID.substring(4)}`;
});

const Order = mongoose.model("Order", orderSchema);

function orderValidation(order, requestType) {
  const schema = Joi.object({
    email: Joi.string().required().email(),
    persons: Joi.array().items(Joi.objectId()),
    // paymentReference: Joi.string().min(5).max(255).required(),
    termId: Joi.objectId().required(),
  });

  return schema.validate(order);
}
module.exports.Order = Order;
module.exports.orderValidation = orderValidation;
