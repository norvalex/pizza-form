const express = require("express");
const orders = require("../routes/orders");
const persons = require("../routes/persons");
const terms = require("../routes/terms");
const locations = require("../routes/locations");
const users = require("../routes/users");
const auth = require("../routes/auth");
const home = require("../routes/home");
const morgan = require("morgan");
const winston = require("winston");

module.exports = function (app) {
  // Templating engine
  app.set("view engine", "pug");

  // Express middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));

  // Morgan
  if (app.get("env") === "development") {
    app.use(morgan("tiny"));
    winston.info("Morgan started...");
  }

  // Routing
  app.use("/api/orders", orders);
  app.use("/api/persons", persons);
  app.use("/api/terms", terms);
  app.use("/api/locations", locations);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/", home);
};
