import { Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { issueToken } from "../auth";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("requireAuth middleware", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects a header that isn't a Bearer token", () => {
    const req = { headers: { authorization: "Basic abc123" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects an invalid/garbage token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-jwt" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("accepts a valid token and attaches the caller's identity, including organizationId", () => {
    const token = issueToken({ id: "user-1", email: "rae@example.com", name: "Rae", organizationId: "org-1" });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toEqual({ id: "user-1", email: "rae@example.com", name: "Rae", organizationId: "org-1" });
  });
});
