import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { Address } from "../../modules/address/address.model.js";
import { seedCustomerAuth, seedCustomer, signTokenFor } from "../helpers/fixtures.js";

const validAddress = {
  label: "Home",
  addressLine1: "House 7, Street 3",
  city: "Lahore",
  state: "Punjab",
  postalCode: "54000",
  country: "Pakistan",
};

describe("POST /api/v1/addresses", () => {
  it("creates an address scoped to the calling user", async () => {
    const { user, authHeader } = await seedCustomerAuth();

    const res = await request(app)
      .post("/api/v1/addresses")
      .set(authHeader)
      .send(validAddress);

    expect(res.status).toBe(201);
    const saved = await Address.findOne({ userId: user._id });
    expect(saved).toBeTruthy();
    expect(saved.city).toBe("Lahore");
  });

  it("rejects unauthenticated calls", async () => {
    const res = await request(app).post("/api/v1/addresses").send(validAddress);
    expect(res.status).toBe(401);
  });

  it("rejects invalid payloads with 400", async () => {
    const { authHeader } = await seedCustomerAuth();
    const res = await request(app)
      .post("/api/v1/addresses")
      .set(authHeader)
      .send({ label: "X" }); // missing required fields
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/addresses", () => {
  it("returns only the calling user's addresses", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const otherUser = await seedCustomer({
      email: "other-addr@stylogist.test",
      phone: "03002221111",
    });
    await Address.create({ ...validAddress, userId: user._id });
    await Address.create({ ...validAddress, userId: otherUser._id, label: "Other" });

    const res = await request(app).get("/api/v1/addresses").set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.data.addresses).toHaveLength(1);
    expect(res.body.data.addresses[0].label).toBe("Home");
  });
});

describe("PATCH /api/v1/addresses/:id", () => {
  it("updates an address the user owns", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const saved = await Address.create({ ...validAddress, userId: user._id });

    const res = await request(app)
      .patch(`/api/v1/addresses/${saved._id}`)
      .set(authHeader)
      .send({ city: "Karachi" });

    expect(res.status).toBe(200);
    const reread = await Address.findById(saved._id);
    expect(reread.city).toBe("Karachi");
  });

  it("refuses to update someone else's address", async () => {
    const { authHeader } = await seedCustomerAuth();
    const otherUser = await seedCustomer({
      email: "other-addr2@stylogist.test",
      phone: "03002221122",
    });
    const otherAddress = await Address.create({ ...validAddress, userId: otherUser._id });

    const res = await request(app)
      .patch(`/api/v1/addresses/${otherAddress._id}`)
      .set(authHeader)
      .send({ city: "Hijacked" });

    expect(res.status).toBe(404);
    const reread = await Address.findById(otherAddress._id);
    expect(reread.city).toBe("Lahore");
  });
});

describe("DELETE /api/v1/addresses/:id", () => {
  it("removes the user's own address", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const saved = await Address.create({ ...validAddress, userId: user._id });
    const res = await request(app)
      .delete(`/api/v1/addresses/${saved._id}`)
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(await Address.findById(saved._id)).toBeNull();
  });
});
