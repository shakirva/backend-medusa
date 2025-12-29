import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    DATABASE_URL: 'sqlite://./medusa-test.db',
  },
  testSuite: ({ api }) => {
    describe("Storefront Products", () => {
      it("GET /store/products returns 200 and products array", async () => {
        const response = await api.get("/store/products")
        expect(response.status).toEqual(200)
        expect(Array.isArray(response.data.products)).toBe(true)
        expect(typeof response.data.count).toBe("number")
      })
    })
  },
})
