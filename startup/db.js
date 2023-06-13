const mongoose = require("mongoose");
const config = require("config");
const winston = require("winston");

module.exports = function () {
  const db = config.get("dbConnectionString");
  mongoose.connect(db).then(() => winston.info(`Connected to ${db}`));
};
