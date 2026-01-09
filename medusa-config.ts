import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const httpConfig = {
  storeCors: process.env.STORE_CORS || "*",
  adminCors: process.env.ADMIN_CORS || "*",
  authCors: process.env.AUTH_CORS || "*",
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  cookieSecret: process.env.COOKIE_SECRET || "supersecret",
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

  modules: {
    auth: {
      resolve: "@medusajs/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
            options: {},
          },
        ],
      },
    },

    brands: { resolve: "./src/modules/brands" },
    wishlist: { resolve: "./src/modules/wishlist" },
    reviews: { resolve: "./src/modules/reviews" },
    media: { resolve: "./src/modules/media" },
    sellers: { resolve: "./src/modules/sellers" },
    warranty: { resolve: "./src/modules/warranty" },
  },
})
