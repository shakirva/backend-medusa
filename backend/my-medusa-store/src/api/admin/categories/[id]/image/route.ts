import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/categories/:id/image
 * Get category image
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);
  const { id } = req.params;

  try {
    const result = await pgConnection.raw(
      `SELECT id, name, handle, metadata FROM product_category WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Category not found",
      });
    }

    const category = result.rows[0];
    const metadata = category.metadata || {};

    res.json({
      category: {
        id: category.id,
        name: category.name,
        handle: category.handle,
        image_url: metadata.image_url || null,
        icon: metadata.icon || null,
      },
    });
  } catch (error: any) {
    console.error("[Category Image] GET error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};

/**
 * POST /admin/categories/:id/image
 * Update category image
 * 
 * Request body:
 * {
 *   "image_url": "https://example.com/image.jpg",
 *   "icon": "smartphone" // optional icon name
 * }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);
  const { id } = req.params;
  const { image_url, icon } = req.body as { image_url?: string; icon?: string };

  try {
    // Check if category exists
    const existing = await pgConnection.raw(
      `SELECT id, name, handle, metadata FROM product_category WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Category not found",
      });
    }

    const currentMetadata = existing.rows[0].metadata || {};
    const newMetadata = {
      ...currentMetadata,
      ...(image_url !== undefined && { image_url }),
      ...(icon !== undefined && { icon }),
    };

    // Update metadata
    await pgConnection.raw(
      `UPDATE product_category SET metadata = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(newMetadata), id]
    );

    res.json({
      success: true,
      category: {
        id: existing.rows[0].id,
        name: existing.rows[0].name,
        handle: existing.rows[0].handle,
        image_url: newMetadata.image_url || null,
        icon: newMetadata.icon || null,
      },
    });
  } catch (error: any) {
    console.error("[Category Image] POST error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};

/**
 * DELETE /admin/categories/:id/image
 * Remove category image
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);
  const { id } = req.params;

  try {
    // Check if category exists
    const existing = await pgConnection.raw(
      `SELECT id, metadata FROM product_category WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({
        type: "not_found",
        message: "Category not found",
      });
    }

    const currentMetadata = existing.rows[0].metadata || {};
    delete currentMetadata.image_url;
    delete currentMetadata.icon;

    // Update metadata
    await pgConnection.raw(
      `UPDATE product_category SET metadata = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(currentMetadata), id]
    );

    res.json({
      success: true,
      message: "Category image removed",
    });
  } catch (error: any) {
    console.error("[Category Image] DELETE error:", error);
    res.status(500).json({
      type: "server_error",
      message: error.message,
    });
  }
};
