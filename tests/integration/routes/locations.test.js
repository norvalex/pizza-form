const request = require("supertest");
const { Location } = require("../../../models/location");
const { User } = require("../../../models/user");
const { mongoose } = require("mongoose");
const moment = require("moment");
// const { Rental } = require("../../../models/rental");

let server;
const endpoint = "/api/locations";

describe(endpoint, () => {
  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Location.collection.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all locations", async () => {
      await Location.insertMany([
        {
          label: "loca1",
          classes: ["class1", "class2"],
        },
        {
          label: "loca2",
          classes: ["class3", "class4"],
        },
      ]);

      const res = await request(server).get(endpoint);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.label === "loca1")).toBeTruthy();
      expect(res.body.some((g) => g.label === "loca2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    let location;

    beforeEach(async () => {
      location = new Location({
        label: "loca1",
        classes: ["class1", "class2"],
      });
      await location.save();
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

    it("should return the location if id is valid", async () => {
      const res = await request(server).get(`${endpoint}/${location._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("label", location.label);
      expect(res.body).toHaveProperty("classes", location.classes);
    });
  });

  describe("POST /", () => {
    let token;
    let payload;

    function exec() {
      return request(server)
        .post(endpoint)
        .set("x-auth-token", token)
        .send(payload);
    }

    beforeEach(async () => {
      token = User().generateAuthToken();
      payload = {
        label: "loca1",
        classes: ["class1", "class2"],
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

    describe("payload.classes", () => {
      it("should return a 400 if classes is not provided", async () => {
        delete payload.classes;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if classes is not an array", async () => {
        payload.classes = "abcd";

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if classes item has more than 255 chars", async () => {
        payload.classes = [new Array("").join("a")];

        const res = await exec();

        expect(res.status).toBe(400);
      });
    });

    it("should save the location if it is valid", async () => {
      await exec();

      const locationInDb = await Location.findOne({ label: "loca1" });

      expect(locationInDb).not.toBeNull();
    });

    it("should return location if it is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("label", payload.label);
      expect(res.body).toHaveProperty("classes", payload.classes);
    });
  });

  describe("PUT /", () => {
    let token;
    let payload;
    let location;
    let locationId;

    function exec() {
      return request(server)
        .put(`${endpoint}/${locationId}`)
        .set("x-auth-token", token)
        .send(payload);
    }

    beforeEach(async () => {
      location = new Location({
        label: "loca1",
        classes: ["class1", "class2"],
      });
      await location.save();
      locationId = location._id;

      token = User().generateAuthToken();
      payload = {
        label: "loca2",
        classes: ["class3", "class4"],
      };
    });

    it("should return a 401 id user not logged in", async () => {
      token = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return a 404 if id is invalid", async () => {
      locationId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return a 404 if id is valid but not found", async () => {
      locationId = new mongoose.Types.ObjectId();

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
        payload.label = "abce";

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if label is greater than 255 chars", async () => {
        payload.label = new Array(257).join("a");

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should set label if posted", async () => {
        const res = await exec();

        expect(res.body).toHaveProperty("label", payload.label);
      });
    });

    describe("payload.classes", () => {
      it("should return a 400 if classes is not provided", async () => {
        delete payload.classes;

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should return a 400 if classes is greater than 255 chars", async () => {
        payload.classes = [new Array(257).join("a")];

        const res = await exec();

        expect(res.status).toBe(400);
      });

      it("should set classes if posted", async () => {
        const res = await exec();

        expect(res.body).toHaveProperty("classes", payload.classes);
      });
    });

    it("should save the location if it is valid", async () => {
      await exec();

      const locationInDb = await Location.findOne({ label: "loca2" });

      expect(locationInDb).not.toBeNull();
    });

    it("should return location if it is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", location._id.toHexString());
      expect(res.body).toHaveProperty("label", payload.label);
      expect(res.body).toHaveProperty("classes", payload.classes);
    });
  });

  describe("DELETE /", () => {
    // TODO
    let location;
    let token;
    let locationId;

    function exec() {
      return request(server)
        .delete(`${endpoint}/${locationId}`)
        .set("x-auth-token", token);
    }

    beforeEach(async () => {
      location = new Location({
        label: "loca1",
        classes: ["class1", "class2"],
      });
      await location.save();

      locationId = location._id;
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
      locationId = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return a status of 404 if id is valid but not found", async () => {
      locationId = new mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should delete location from db", async () => {
      await exec();

      const res = await Location.findOne({ erf: location.erf });

      expect(res).toBeNull();
    });

    it("should return location if deleted (archived)", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id", location._id.toHexString());
      expect(res.body).toHaveProperty("label", location.label);
      expect(res.body).toHaveProperty("classes", location.classes);
    });
  });
});
