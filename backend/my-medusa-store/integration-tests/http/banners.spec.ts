import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
	inApp: true,
	env: {
		DATABASE_URL: 'sqlite://./medusa-test.db',
	},
	testSuite: () => {
		describe("Banners placeholder", () => {
			it("runs placeholder test", async () => {
				expect(true).toBe(true)
			})
		})
	},
})
