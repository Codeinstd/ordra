import { hashPassword, verifyPassword, issueToken, verifyToken } from "../auth";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("produces a different hash each time (salted)", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toBe(b);
  });
});

describe("JWT issue/verify", () => {
  const user = { id: "user-1", email: "rae@example.com", name: "Rae Requester", organizationId: "org-1" };

  it("round-trips the payload it was issued with", () => {
    const token = issueToken(user);
    const payload = verifyToken(token);
    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe(user.email);
    expect(payload.name).toBe(user.name);
    expect(payload.organizationId).toBe(user.organizationId);
  });

  it("rejects a tampered token", () => {
    const token = issueToken(user);
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");
    expect(() => verifyToken(tampered)).toThrow();
  });
});
