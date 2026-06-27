#!/bin/bash
# Run this on the production server to permanently delete fake/test categories
# Usage: bash delete-fake-categories.sh
# 
# Fake categories to delete: 's', 'mount', 'mobiletablet'
# These are NOT from Odoo's real category list and cause duplicates on the storefront.

echo "=== Deleting fake/test categories from Medusa DB ==="

PGPASSWORD=Medusa1234 psql -U medusa_user -d medusa -h 127.0.0.1 << 'SQL'

-- Show the fake categories first
SELECT id, name, handle, parent_category_id
FROM product_category
WHERE handle IN ('s', 'mount', 'mobiletablet');

-- Move any products in these categories to parent-less (orphan) state
-- so we don't lose product<->category links
UPDATE product_category_product
SET category_id = NULL
WHERE category_id IN (
  SELECT id FROM product_category WHERE handle IN ('s', 'mount', 'mobiletablet')
);

-- Delete the fake categories
DELETE FROM product_category WHERE handle IN ('s', 'mount', 'mobiletablet');

-- Verify they are gone
SELECT COUNT(*) AS remaining_fake FROM product_category 
WHERE handle IN ('s', 'mount', 'mobiletablet');

-- Show remaining parent categories  
SELECT name, handle FROM product_category 
WHERE parent_category_id IS NULL
ORDER BY name;

SQL

echo "=== Done! ==="
