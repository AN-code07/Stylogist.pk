import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { User } from "../../modules/users/user.model.js";
import { seedCustomerAuth } from "../helpers/fixtures.js";

describe("GET /api/v1/users/me", () => {
  it("returns the authenticated user's profile", async () => {
    const { user, authHeader } = await seedCustomerAuth();

    const res = await request(app).get("/api/v1/users/me").set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBe(user._id.toString());
    // Password is select:false on the schema; never leaks via this endpoint.
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("rejects unauthenticated calls", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/v1/users/me", () => {
  it("updates the user's name", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(authHeader)
      .send({ name: "Renamed User" });

    expect(res.status).toBe(200);
    const reread = await User.findById(user._id);
    expect(reread.name).toBe("Renamed User");
  });

  it("strips privilege-escalation fields (role / isBlocked / password)", async () => {
    const { user, authHeader } = await seedCustomerAuth();
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set(authHeader)
      .send({
        name: "Allowed Change",
        role: "Super Admin", // must be ignored
        isBlocked: true, // must be ignored
        password: "NewSneaky1!", // must be ignored
      });

    expect(res.status).toBe(200);
    const reread = await User.findById(user._id).select("+password");
    expect(reread.role).toBe("User"); // unchanged
    expect(reread.isBlocked).toBe(false); // unchanged
    // bcrypt-hashed seed password starts with $2; the sneaky update must
    // not have replaced it.
    expect(reread.password.startsWith("$2")).toBe(true);
  });

  it("rejects a body that doesn't update at least one field", async () => {
    const { authHeader } = await seedCustomerAuth();
    const res = await request(app).patch("/api/v1/users/me").set(authHeader).send({});
    expect(res.status).toBe(400);
  });
});
