# Odoo ERP Integration for Marqa Souq

This document describes the Odoo ERP integration for syncing products and inventory to the MedusaJS e-commerce platform.

## Overview

The integration fetches products, categories, and inventory data from Odoo ERP and makes them available in the MedusaJS store. This allows for real-time product synchronization between your ERP system and your e-commerce frontend.

## Configuration

### Environment Variables

Add the following environment variables to your backend `.env` file:

```bash
# Odoo ERP Integration
ODOO_URL=https://your-odoo-instance.odoo.com
ODOO_DB_NAME=your-database-name
ODOO_USERNAME=admin
ODOO_API_KEY=your-api-key
```

### Finding Your Odoo Credentials

1. **ODOO_URL**: Your Odoo instance URL (e.g., `https://mycompany.odoo.com`)
2. **ODOO_DB_NAME**: Found in Settings > Database Manager or in the URL after login (`?db=DATABASE_NAME`)
3. **ODOO_USERNAME**: Your Odoo login email/username
4. **ODOO_API_KEY**: Generated in Odoo Settings > Users > Security > API Keys

## API Endpoints

### Admin Endpoints (require authentication)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/odoo` | GET | Get Odoo configuration status |
| `/admin/odoo` | POST | Test Odoo connection |
| `/admin/odoo/products` | GET | Fetch products from Odoo |
| `/admin/odoo/categories` | GET | Fetch categories from Odoo |
| `/admin/odoo/inventory` | GET | Fetch inventory levels from Odoo |
| `/admin/odoo/sync` | GET | Get sync status |
| `/admin/odoo/sync` | POST | Sync products from Odoo to MedusaJS |

### Store Endpoints (public)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/store/odoo/products` | GET | Fetch products for storefront display |

## Usage Examples

### Test Connection

```bash
curl http://localhost:9000/admin/odoo -X POST -H "Content-Type: application/json"
```

### Fetch Products from Odoo

```bash
curl "http://localhost:9000/admin/odoo/products?limit=50&offset=0"
```

### Sync Products (Dry Run)

```bash
curl http://localhost:9000/admin/odoo/sync \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "dryRun": true}'
```

### Sync Products (Actual Import)

```bash
curl http://localhost:9000/admin/odoo/sync \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "dryRun": false}'
```

## Frontend Integration

### Components

1. **OdooProductsGrid** - A React component that displays products from Odoo

```jsx
import OdooProductsGrid from '../components/OdooProductsGrid';

// Display all products
<OdooProductsGrid title="All Products" limit={20} />

// Display products from a specific category
<OdooProductsGrid 
  title="Electronics" 
  category="electronics"
  limit={10}
/>
```

2. **useOdooProducts Hook** - A React hook for fetching Odoo products

```jsx
import { useOdooProducts } from '../hooks/useOdooProducts';

function MyComponent() {
  const { products, loading, error, loadMore, refresh } = useOdooProducts({
    limit: 20,
    category: 'electronics',
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      <button onClick={loadMore}>Load More</button>
    </div>
  );
}
```

### Pages

- `/inventory` - Dedicated page showing all Odoo products

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Odoo ERP     │────▶│   MedusaJS       │────▶│   Next.js       │
│   (Products,    │     │   Backend        │     │   Frontend      │
│    Inventory)   │     │  (API Endpoints) │     │  (Display)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Files Created

### Backend

- `src/modules/odoo-sync/index.ts` - Module definition
- `src/modules/odoo-sync/service.ts` - Core sync service with Odoo API integration
- `src/api/admin/odoo/route.ts` - Admin status endpoints
- `src/api/admin/odoo/products/route.ts` - Admin products endpoint
- `src/api/admin/odoo/categories/route.ts` - Admin categories endpoint
- `src/api/admin/odoo/inventory/route.ts` - Admin inventory endpoint
- `src/api/admin/odoo/sync/route.ts` - Admin sync endpoint
- `src/api/store/odoo/products/route.ts` - Store products endpoint

### Frontend

- `src/lib/odoo.ts` - Odoo API client
- `src/hooks/useOdooProducts.ts` - React hook for Odoo products
- `src/components/OdooProductsGrid.js` - Product grid component
- `src/app/[lang]/inventory/page.js` - Inventory page

## Troubleshooting

### Connection Issues

1. **SSL Certificate Errors**: For development Odoo instances with self-signed certificates, the service automatically disables SSL verification.

2. **Database Not Found**: Ensure the database name exactly matches your Odoo database. You can find this in:
   - URL after login: `?db=YOUR_DB`
   - Odoo Settings > Database Manager

3. **Authentication Failed**: 
   - Verify your API key is valid
   - Ensure the user has proper permissions
   - Check if the Odoo instance is accessible from your network

### Testing the Connection

Use the test script to verify your Odoo credentials:

```bash
cd backend/my-medusa-store
npx ts-node src/scripts/test-odoo-jsonrpc.ts
```

## Next Steps

1. **Verify Odoo Credentials**: Contact your Odoo administrator to get the correct:
   - Instance URL
   - Database name
   - API key with proper permissions

2. **Configure Webhooks** (Optional): Set up Odoo webhooks to trigger automatic sync when products are updated

3. **Schedule Sync**: Use the MedusaJS job scheduler to periodically sync products

4. **Add Image Sync**: Implement image download and storage for Odoo product images
