import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/qa
 * List all product Q&A questions
 * Query params: ?status=pending|approved|answered&product_id=&page=&limit=
 *
 * PATCH /admin/qa
 * Answer or update status of a question
 * Body: { id, answer, status, answered_by }
 *
 * DELETE /admin/qa
 * Delete a question
 * Body: { id }
 */

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const status = (req.query.status as string) || null
  const productId = (req.query.product_id as string) || null
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const offset = (page - 1) * limit

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

    const conditions: string[] = ["deleted_at IS NULL"]
    const bindings: unknown[] = []

    if (status) {
      conditions.push("status = ?")
      bindings.push(status)
    }
    if (productId) {
      conditions.push("product_id = ?")
      bindings.push(productId)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const qaResult = await pgConnection.raw(
      `SELECT id, product_id, customer_id, customer_name, question, answer,
              answered_by, answered_at, status, created_at, updated_at
       FROM product_qa
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...bindings, limit, offset]
    )

    const countResult = await pgConnection.raw(
      `SELECT COUNT(*) as total FROM product_qa ${where}`,
      bindings
    )

    // Get pending count for badge
    const pendingResult = await pgConnection.raw(
      `SELECT COUNT(*) as pending FROM product_qa WHERE status = 'pending' AND deleted_at IS NULL`
    )

    res.json({
      questions: qaResult.rows,
      total: parseInt(countResult.rows[0].total),
      pending_count: parseInt(pendingResult.rows[0].pending),
      page,
      limit,
      has_more: offset + limit < parseInt(countResult.rows[0].total),
    })
  } catch (error: any) {
    console.error("[Admin Q&A GET] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id, answer, status, answered_by } = req.body as {
    id?: string
    answer?: string
    status?: string
    answered_by?: string
  }

  if (!id) {
    return res.status(400).json({ type: "invalid_data", message: "id is required" })
  }

  try {
    const updates: string[] = ["updated_at = NOW()"]
    const bindings: unknown[] = []

    if (answer !== undefined) {
      updates.push("answer = ?")
      bindings.push(answer)
      updates.push("answered_at = NOW()")
      updates.push("status = 'answered'")
      if (answered_by) {
        updates.push("answered_by = ?")
        bindings.push(answered_by)
      }
    }

    if (status && status !== "answered") {
      updates.push("status = ?")
      bindings.push(status)
    }

    bindings.push(id)

    await pgConnection.raw(
      `UPDATE product_qa SET ${updates.join(", ")} WHERE id = ?`,
      bindings
    )

    const result = await pgConnection.raw(
      `SELECT * FROM product_qa WHERE id = ?`,
      [id]
    )

    res.json({ success: true, question: result.rows[0] })
  } catch (error: any) {
    console.error("[Admin Q&A PATCH] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.body as { id?: string }

  if (!id) {
    return res.status(400).json({ type: "invalid_data", message: "id is required" })
  }

  try {
    await pgConnection.raw(
      `UPDATE product_qa SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [id]
    )
    res.json({ success: true, message: "Question deleted" })
  } catch (error: any) {
    console.error("[Admin Q&A DELETE] Error:", error)
    res.status(500).json({ type: "server_error", message: error.message })
  }
}
