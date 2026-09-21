import { z } from "zod";
import { Request, Response } from "express";
import { validate } from "../middleware/validate";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("validate middleware", () => {
  const schema = z.object({ email: z.string().email(), amount: z.number().positive() });

  it("calls next() and normalizes req.body when valid", () => {
    const req = { body: { email: "rae@example.com", amount: 100 } } as Request;
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ email: "rae@example.com", amount: 100 });
  });

  it("responds 400 with field errors and does not call next() when invalid", () => {
    const req = { body: { email: "not-an-email", amount: -5 } } as Request;
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.error).toBe("Invalid request body");
    expect(jsonArg.details).toHaveProperty("email");
    expect(jsonArg.details).toHaveProperty("amount");
  });

  it("rejects a missing required field", () => {
    const req = { body: { email: "rae@example.com" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
