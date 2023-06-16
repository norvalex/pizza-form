const express = require("express");
const router = express.Router();

router.use("/", (req, res) => {
  res.render("index", {
    title: "IPS Hilversum",
    message: "Welcome to the Pizza Form!!",
  });
});

module.exports = router;
