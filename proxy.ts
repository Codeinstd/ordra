import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
});

export const config = {
  matcher: [
    "/approvals/:path*",
    "/vendors/:path*",
    "/rfqs/:path*",
    "/requests/:path*",
  ],
};