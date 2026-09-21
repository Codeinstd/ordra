// auth.ts throws at import time if JWT_SECRET isn't set, since a real
// deployment should never run without one. Tests need a value present
// before that module is ever required.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-for-jest";
