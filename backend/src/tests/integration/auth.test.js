import { describe, it, expect, vi, beforeEach } from "vitest";

// IMPORTANT: vi.mock is hoisted above the imports, so the auth controller
// loads the stubbed email module instead of trying to hit a real SMTP host.
// Tests assert on the spy to make sure the flow actually triggers an email.
vi.mock("../../utils/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import crypto from "node:crypto";
import app from "../../app.js";
import { User } from "../../modules/users/user.model.js";
import { sendEmail } from "../../utils/email.js";
import { seedAdminUser, seedCustomer, signTokenFor } from "../helpers/fixtures.js";

const HASHED_OTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

beforeEach(() => {
  // Vitest reuses spy state across tests in the same file, so we reset
  // call counts between scenarios. Implementation (.mockResolvedValue
  // → undefined) is preserved.
  sendEmail.mockClear();
});

describe("POST /api/v1/auth/register", () => {
  it("creates an unverified user and dispatches a verification email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Ali Khan",
        email: "ali@stylogist.test",
        phone: "03001234567",
        password: "Password1!",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("ali@stylogist.test");
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const persisted = await User.findOne({ email: "ali@stylogist.test" });
    expect(persisted).toBeTruthy();
    expect(persisted.isVerified).toBe(false);
    // OTP is stored as a sha256 hash, never the raw code.
    expect(persisted.otp).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects duplicate verified accounts with 409", async () => {
    await seedCustomer({ email: "dupe@stylogist.test", phone: "03001112222" });
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Ali",
      email: "dupe@stylogist.test",
      phone: "03001112222",
      password: "Password1!",
    });
    expect(res.status).toBe(409);
  });

  it("rejects a weak password with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Ali",
      email: "weak@stylogist.test",
      phone: "03004445555",
      password: "weakpass", // no uppercase, no digit
    });
    expect(res.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/auth/login", () => {
  it("issues a JWT for a verified user with correct credentials", async () => {
    await seedCustomer({
      email: "login@stylogist.test",
      phone: "03002223333",
      password: "Password1!",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login@stylogist.test", password: "Password1!" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.data.user.email).toBe("login@stylogist.test");
    // jwt cookie is also set so the SPA + server agree on session.
    expect(res.headers["set-cookie"]?.some((c) => c.startsWith("jwt="))).toBe(true);
  });

  it("rejects the wrong password with 401", async () => {
    await seedCustomer({
      email: "login2@stylogist.test",
      phone: "03003334444",
      password: "Password1!",
    });
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login2@stylogist.test", password: "WrongPass1!" });
    expect(res.status).toBe(401);
  });

  it("blocks unverified accounts from logging in", async () => {
    await seedCustomer({
      email: "unverified@stylogist.test",
      phone: "03005556666",
      password: "Password1!",
      isVerified: false,
    });
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "unverified@stylogist.test", password: "Password1!" });
    expect(res.status).toBe(403);
  });

  it("blocks suspended accounts even with correct credentials", async () => {
    await seedCustomer({
      email: "blocked@stylogist.test",
      phone: "03006667777",
      password: "Password1!",
      isBlocked: true,
    });
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "blocked@stylogist.test", password: "Password1!" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/v1/auth/verify-otp", () => {
  it("flips isVerified and issues a token for the correct OTP", async () => {
    const otp = "123456";
    await User.create({
      name: "Pending",
      email: "pending@stylogist.test",
      phone: "03007778888",
      password: "Password1!",
      isVerified: false,
      otp: HASHED_OTP(otp),
      otpExpires: Date.now() + 10 * 60 * 1000,
    });

    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: "pending@stylogist.test", otp });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();

    const reread = await User.findOne({ email: "pending@stylogist.test" });
    expect(reread.isVerified).toBe(true);
    expect(reread.otp).toBeUndefined();
  });

  it("rejects an expired OTP with 400", async () => {
    const otp = "654321";
    await User.create({
      name: "Expired",
      email: "expired@stylogist.test",
      phone: "03008889999",
      password: "Password1!",
      isVerified: false,
      otp: HASHED_OTP(otp),
      otpExpires: Date.now() - 1000, // already expired
    });

    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: "expired@stylogist.test", otp });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/change-password", () => {
  it("updates the password when the current password is correct", async () => {
    const user = await seedCustomer({
      email: "changepass@stylogist.test",
      phone: "03009990000",
      password: "Password1!",
    });
    const token = signTokenFor(user);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password1!", newPassword: "NewPass1!" });

    expect(res.status).toBe(200);

    // New password works on a fresh login.
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "changepass@stylogist.test", password: "NewPass1!" });
    expect(login.status).toBe(200);
  });

  it("rejects when current password is wrong", async () => {
    const user = await seedCustomer({
      email: "changepass2@stylogist.test",
      phone: "03001010101",
      password: "Password1!",
    });
    const token = signTokenFor(user);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "WrongPass1!", newPassword: "NewPass1!" });

    expect(res.status).toBe(401);
  });

  it("rejects reusing the same password", async () => {
    const user = await seedCustomer({
      email: "changepass3@stylogist.test",
      phone: "03002020202",
      password: "Password1!",
    });
    const token = signTokenFor(user);

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Password1!", newPassword: "Password1!" });

    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated calls", async () => {
    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .send({ currentPassword: "x", newPassword: "NewPass1!" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("clears the jwt cookie and 200s", async () => {
    const user = await seedAdminUser();
    const token = signTokenFor(user);
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    // The replacement cookie value is the literal string "loggedout".
    expect(
      res.headers["set-cookie"]?.some((c) => c.includes("jwt=loggedout"))
    ).toBe(true);
  });
});
