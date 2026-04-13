import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/products/:id/qa
 * Get Q&A for a product
 * 
 * POST /store/products/:id/qa
 * Ask a question about a product
 * Body: { customer_id, question }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const productId = req.params.id

  try {
    // Check if product_qa table exists
    const tableExists = await pgConnection.raw(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = 'product_qa'
       ) as exists`
    )

    if (!tableExists.rows[0].exists) {
      // Create the table if it doesn't exist
      await pgConnection.raw(`
        CREATE TABLE IF NOT EXISTS product_qa (
          id VARCHAR(255) PRIMARY KEY,
          product_id VARCHAR(255) NOT NULL,
          customer_id VARCHAR(255),
          customer_name VARCHAR(255),
          question TEXT NOT NULL,
          answer TEXT,
          answered_by VARCHAR(255),
          answered_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          deleted_at TIMESTAMP
        )
      `)
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    // Get approved & answered Q&As (customers should see both)
    const qaResult = await pgConnection.raw(
      `SELECT id, question, answer, customer_name, answered_by, 
              answered_at, created_at
       FROM product_qa
       WHERE product_id = ? AND status IN ('approved', 'answered') AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    )

    const countResult = await pgConnection.raw(
      `SELECT COUNT(*) as total FROM product_qa 
       WHERE product_id = ? AND status IN ('approved', 'answered') AND deleted_at IS NULL`,
      [productId]
    )

    res.json({
      questions: qaResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
      has_more: offset + limit < parseInt(countResult.rows[0].total),
    })
  } catch (error: any) {
    console.error("[Product Q&A GET] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const productId = req.params.id
  const { customer_id, customer_name, question } = req.body as {
    customer_id?: string
    customer_name?: string
    question?: string
  }

  if (!question) {
    return res.status(400).json({
      type: "invalid_data",
      message: "question is required",
    })
  }

  try {
    // Ensure table exists
    await pgConnection.raw(`
      CREATE TABLE IF NOT EXISTS product_qa (
        id VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255),
        customer_name VARCHAR(255),
        question TEXT NOT NULL,
        answer TEXT,
        answered_by VARCHAR(255),
        answered_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `)

    const id = `qa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Get customer name if customer_id provided
    let name = customer_name || "Anonymous"
    if (customer_id && !customer_name) {
      const customerResult = await pgConnection.raw(
        `SELECT first_name, last_name FROM customer WHERE id = ?`,
        [customer_id]
      )
      if (customerResult.rows.length > 0) {
        const c = customerResult.rows[0]
        name = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Customer"
      }
    }

    await pgConnection.raw(
      `INSERT INTO product_qa (id, product_id, customer_id, customer_name, question, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'approved', NOW(), NOW())`,
      [id, productId, customer_id || null, name, question]
    )

    res.status(201).json({
      success: true,
      message: "Question submitted successfully. It will be visible once approved.",
      question_id: id,
    })
  } catch (error: any) {
    console.error("[Product Q&A POST] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}
