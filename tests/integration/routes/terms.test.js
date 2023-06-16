const request = require("supertest");
const { Term } = require("../../../models/term");
const { User } = require("../../../models/user");
const { mongoose } = require("mongoose");
const moment = require("moment");
const { Location } = require("../../../models/location");

let server;
const endpoint = "/api/terms";

describe(endpoint, () => {
  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Term.collection.deleteMany({});
    await Location.collection.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all terms", async () => {
      await Term.insertMany([
        {
          label: "term1",
          pricePerSlice: 1,
          dates: ["2020-01-01", "2020-01-15"],
          locations: [
            { label: "loca1", classes: ["class1", "class2"] },
            { label: "loca2", classes: ["class3", "class4"] },
          ],
        },
        {
          label: "term2",
          pricePerSlice: 2,
          dates: ["2020-02-01", "2020-02-15"],
          locations: [
            { label: "loca1", classes: ["class1", "class2"] },
            { label: "loca2", classes: ["class3", "class4"] },
          ],
        },
      ]);

      const res = await request(server).get(endpoint);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.label === "term1")).toBeTruthy();
      expect(res.body.some((g) => g.label === "term2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    let term;

    beforeEach(async () => {
      term = new Term({
        label: "term1",
        pricePerSlice: 1,
        dates: ["2020-01-01", "2020-01-15"],
        locations: [
          { label: "loca1", classes: ["class1", "class2"] },
          { label: "loca2", classes: ["class3", "class4"] },
        ],
      });
      await term.save();
    });

    it("should return a 404 if id is invalid", async () => {
      const res = await request(server).get(`${endpoint}/1`);

      expect(res.status).toBe(404);
    });

    it("should return a 404 if id is valid but not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(server).get(`${endpoint}/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it("should return the term if id is valid", async () => {
      const res = await request(server).get(`${endpoint}/${term._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("label", term.label);
      expect(res.body).toHaveProperty("pricePerSlice", term.pricePerSlice);
      expect(res.body).toHaveProperty("dates");
      expect(res.body).toHaveProperty("locations");
    });
  });

  describe("POST /", () => {
    let token;
    let payload;

    function exec(print = false) {
      if (print) console.log(payload);
      return request(server)
        .post(endpoint)
        .set("x-auth-token", token)
        .send(payload);
    }

    beforeEach(async () => {
      token = User().generateAuthToken();
      const location1 = new Location({
        label: "loca1",
        classes: ["class1", "class2"],
      });
      await location1.save();
      const location2 = new Location({
        label: "loca2",
        classes: ["class3", "class4"],
      });
      await location2.save();

      payload = {
        label: "term1",
        pricePerSlice: 1,
        dates: ["2020-01-01", "2020-01-15"],
        locations: [location1._id, location2._id],
      };
    });

    it("should return a 401 id user not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    describe("payload.label", () => {
      it("should return a 400 if label not provided", async () => {
        delete payload.label;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if label is less than 5 char(s)", async () => {
        payload.label = "abcd";

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if label is greater than 10 chars", async () => {
        payload.erf = new Array(257).join("a");

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    describe("payload.pricePerSlice", () => {
      it("should return a 400 if pricePerSlice not provided", async () => {
        delete payload.pricePerSlice;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if pricePerSlice is less than 0", async () => {
        payload.label = -1;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if label is not a number", async () => {
        payload.erf = "ab";

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    describe("payload.dates", () => {
      it("should return a 400 if dates is not provided", async () => {
        delete payload.dates;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if dates is not a date", async () => {
        payload.dates = "abcd";

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if dates item is not a valid date", async () => {
        payload.dates = ["1-2-2012"];

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    describe("payload.locations", () => {
      it("should return a 400 if locations is not provided", async () => {
        delete payload.locations;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if locations is not a valid ObjectId", async () => {
        payload.locations = ["abcd"];

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if locations is valid but unknown", async () => {
        payload.locations = [new mongoose.Types.ObjectId()];

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    it("should save the term if it is valid", async () => {
      await exec();

      const termInDb = await Term.findOne({ label: "term1" });

      expect(termInDb).not.toBeNull();
    });

    it("should return term if it is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("label", payload.label);
      expect(res.body).toHaveProperty("pricePerSlice", payload.pricePerSlice);
      expect(res.body).toHaveProperty("dates");
      expect(res.body).toHaveProperty("locations");
    });
  });

  describe("PUT /", () => {
    let token;
    let payload;
    let term;
    let termId;

    function exec() {
      return request(server)
        .put(`${endpoint}/${termId}`)
        .set("x-auth-token", token)
        .send(payload);
    }

    beforeEach(async () => {
      const location1 = new Location({
        label: "loca1",
        classes: ["class1", "class2"],
      });
      await location1.save();
      const location2 = new Location({
        label: "loca2",
        classes: ["class3", "class4"],
      });
      await location2.save();
      const location3 = new Location({
        label: "loca3",
        classes: ["class5", "class6"],
      });
      await location3.save();
      const location4 = new Location({
        label: "loca4",
        classes: ["class7", "class8"],
      });
      await location4.save();

      term = new Term({
        label: "term1",
        pricePerSlice: 1,
        dates: ["2020-01-01", "2020-01-15"],
        locations: [
          {
            label: "loca1",
            classes: ["class1", "class2"],
          },
          {
            label: "loca2",
            classes: ["class3", "class4"],
          },
        ],
      });
      await term.save();
      termId = term._id;

      token = User().generateAuthToken();
      payload = {
        label: "term2",
        pricePerSlice: 2,
        dates: ["2020-02-01", "2020-02-15"],
        locations: [location3._id, location4._id],
      };
    });

    it("should return a 401 id user not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return a 404 if id is invalid", async () => {
      termId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return a 404 if id is valid but not found", async () => {
      termId = new mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    describe("payload.label", () => {
      it("should return a 400 if label not provided", async () => {
        delete payload.label;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if label is less than 5 char(s)", async () => {
        payload.label = "abcd";

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if label is greater than 10 chars", async () => {
        payload.erf = new Array(257).join("a");

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    describe("payload.pricePerSlice", () => {
      it("should return a 400 if pricePerSlice not provided", async () => {
        delete payload.pricePerSlice;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if pricePerSlice is less than 0", async () => {
        payload.label = -1;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if label is not a number", async () => {
        payload.erf = "ab";

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    describe("payload.dates", () => {
      it("should return a 400 if dates is not provided", async () => {
        delete payload.dates;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if dates is not a date", async () => {
        payload.dates = "abcd";

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if dates item is not a valid date", async () => {
        payload.dates = ["1-2-2012"];

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    describe("payload.locations", () => {
      it("should return a 400 if locations is not provided", async () => {
        delete payload.locations;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if locations is not a valid ObjectId", async () => {
        payload.locations = ["abcd"];

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if locations is valid but unknown", async () => {
        payload.locations = [new mongoose.Types.ObjectId()];

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    it("should save the term if it is valid", async () => {
      await exec();

      const termInDb = await Term.findOne({ label: "term2" });

      expect(termInDb).not.toBeNull();
    });

    it("should return term if it is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", term._id.toHexString());
      expect(res.body).toHaveProperty("label", payload.label);
      expect(res.body).toHaveProperty("pricePerSlice", payload.pricePerSlice);
      expect(res.body).toHaveProperty("dates");
      expect(res.body).toHaveProperty("locations");
    });
  });

  describe("DELETE /", () => {
    // TODO
    let term;
    let token;
    let termId;

    function exec() {
      return request(server)
        .delete(`${endpoint}/${termId}`)
        .set("x-auth-token", token);
    }

    beforeEach(async () => {
      term = new Term({
        label: "term1",
        pricePerSlice: 1,
        dates: ["2020-01-01", "2020-01-15"],
        locations: [
          { label: "loca1", classes: ["class1", "class2"] },
          { label: "loca2", classes: ["class3", "class4"] },
        ],
      });
      await term.save();

      termId = term._id;
      token = User({
        _id: new mongoose.Types.ObjectId(),
        isAdmin: true,
      }).generateAuthToken();
    });

    it("should return a status of 401 if user not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return a status of 403 if user logged in but not admin", async () => {
      token = User({
        _id: new mongoose.Types.ObjectId(),
        isAdmin: false,
      }).generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it("should return a status of 404 if id is not valid", async () => {
      termId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return a status of 404 if id is valid but not found", async () => {
      termId = new mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should delete term from db", async () => {
      await exec();

      const res = await Term.findOne({ erf: term.erf });

      expect(res).toBeNull();
    });

    it("should return term if deleted (archived)", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", term._id.toHexString());
      expect(res.body).toHaveProperty("label", term.label);
      expect(res.body).toHaveProperty("pricePerSlice", term.pricePerSlice);
      expect(res.body).toHaveProperty("dates");
      expect(res.body).toHaveProperty("locations");
    });
  });
});
