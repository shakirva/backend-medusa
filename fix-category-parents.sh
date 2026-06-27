#!/bin/bash
# Run this on the production server to fix the parent categories for power-station and gaming-consoles
# Usage: bash fix-category-parents.sh

echo "=== Fixing parent categories in Medusa DB ==="

PGPASSWORD=Medusa1234 psql -U medusa_user -d medusa -h 127.0.0.1 << 'SQL'

-- Update 'power-station' to be a child of 'power-banks'
UPDATE product_category
SET parent_category_id = (SELECT id FROM product_category WHERE handle = 'power-banks')
WHERE handle = 'power-station' 
AND parent_category_id IS NULL;

-- Update 'gaming-consoles' to be a child of 'consoles'
UPDATE product_category
SET parent_category_id = (SELECT id FROM product_category WHERE handle = 'consoles')
WHERE handle = 'gaming-consoles'
AND parent_category_id IS NULL;

-- Verify the update
SELECT name, handle, 
       (SELECT name FROM product_category pc2 WHERE pc2.id = pc1.parent_category_id) as parent_name 
FROM product_category pc1
WHERE handle IN ('power-station', 'gaming-consoles');

SQL

echo "=== Done! The storefront will now hide them from the main menu and show them under their proper parents. ==="
