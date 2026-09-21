# Multi-stage build using Next's "standalone" output (enabled in
# next.config.js) so the runtime image only carries the files actually
# needed to serve the app, not the full node_modules tree.
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# NEXTAUTH_SECRET etc. are read at runtime, not build time, so no
# build-time secrets are required here — a placeholder is enough to let
# the build complete. NEXT_PUBLIC_* vars, by contrast, ARE inlined into
# the client bundle at build time, so that one has to be a build arg.
ARG NEXT_PUBLIC_API_BASE=http://localhost:4000/api
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NEXTAUTH_SECRET=build-placeholder
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
