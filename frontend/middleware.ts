import { withAuth } from "next-auth/middleware";

// Explicitly calling withAuth() here (rather than re-exporting next-auth's
// default) so this file's default export is unambiguously a function —
// Next's middleware static check doesn't reliably resolve a bare
// `export { default } from "next-auth/middleware"` re-export.
export default withAuth({
  pages: { signIn: "/signin" },
});

export const config = {
  matcher: [
    "/approvals/:path*",
    "/vendors/:path*",
    "/rfqs/:path*",
    "/requests/:path*",
    "/team/:path*",
    "/policies/:path*",
    "/review/:path*",
    "/negotiations/:path*",
    "/audit/:path*",
  ],
};
