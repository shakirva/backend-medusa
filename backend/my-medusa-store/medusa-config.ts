import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const httpConfig: any = {
  storeCors: process.env.STORE_CORS || "*",
  adminCors: process.env.ADMIN_CORS || "*",
  authCors: process.env.AUTH_CORS || "*",
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  cookieSecret: process.env.COOKIE_SECRET || "supersecret",
  // Ensure admin auth works when served over plain HTTP (e.g., VPS without TLS)
  // Medusa will default cookies to secure in production which breaks on HTTP.
  // We relax cookie security unless BACKEND_URL is HTTPS.
  cookieOptions: {
    secure: (process.env.BACKEND_URL || "").startsWith("https://"),
    sameSite: "lax",
  },
}

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: httpConfig,
  },

  admin: {
    path: "/app",
  },

  modules: [
    // Authentication with email/password provider
    {
      resolve: "@medusajs/auth",
      options: {
        providers: [
          { resolve: "@medusajs/auth-emailpass", id: "emailpass", options: {} },
        ],
      },
    },

    // Local business modules
    { resolve: "./src/modules/brands", options: {} },
    { resolve: "./src/modules/wishlist", options: {} },
    { resolve: "./src/modules/reviews", options: {} },
    { resolve: "./src/modules/media", options: {} },
    { resolve: "./src/modules/sellers", options: {} },
    { resolve: "./src/modules/warranty", options: {} },
  ],
})
