import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

// Validates req.body against a schema before the route handler runs, and
// replaces req.body with the parsed (and type-coerced) result — so a
// handler downstream can trust the shape it receives rather than
// re-checking it. Failure is a 400 with the specific field errors, not a
// generic "bad request".
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request body", details: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}
