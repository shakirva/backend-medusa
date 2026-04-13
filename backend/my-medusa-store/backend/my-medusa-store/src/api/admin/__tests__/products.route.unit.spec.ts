import { POST, PUT } from '../../admin/products/route'

describe('Admin products route validation (unit)', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  test('POST should reject when REQUIRE_PRODUCT_METADATA=true and payload lacks metadata', async () => {
    process.env.REQUIRE_PRODUCT_METADATA = 'true'

    const req: any = { body: {}, scope: { resolve: jest.fn() } }
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await POST(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }))
  })

  test('POST should create product when payload includes metadata', async () => {
    process.env.REQUIRE_PRODUCT_METADATA = 'true'

    const created = { id: 'prod_1', title: 'Created' }
    const productService = { create: jest.fn().mockResolvedValue(created) }

    const req: any = { body: { title: 'P', tags: ['powerbank'] }, scope: { resolve: () => productService } }
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await POST(req, res)

    expect(productService.create).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ product: created })
  })

  test('PUT should return 400 missing id when no id provided', async () => {
    process.env.REQUIRE_PRODUCT_METADATA = 'true'
    const req: any = { body: {}, query: {}, scope: { resolve: jest.fn() } }
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await PUT(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }))
  })
})
