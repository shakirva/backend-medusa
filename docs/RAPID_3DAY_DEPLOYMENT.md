# 🚀 RAPID 3-DAY DEPLOYMENT PLAN

**Timeline:** March 3-5, 2026 (Monday-Wednesday)  
**Goal:** Deliver complete Odoo product sync + RunBazaar-style product detail page  
**Status:** ACTIVE - Executing now

---

## 📋 QUICK STATUS

| Task | Status | Priority | Est. Time |
|------|--------|----------|-----------|
| Enhanced Webhook (All Odoo Fields) | 🟢 READY | CRITICAL | 4 hours |
| Frontend Product Detail Page | 🟡 IN PROGRESS | CRITICAL | 6 hours |
| Shipping/Delivery Section | 🟡 IN PROGRESS | HIGH | 3 hours |
| Product Images Display | 🟡 IN PROGRESS | HIGH | 3 hours |
| Specifications/Features Tab | 🟡 IN PROGRESS | HIGH | 3 hours |
| Testing & Debugging | 🔴 NOT STARTED | CRITICAL | 4 hours |
| Production Deployment | 🔴 NOT STARTED | CRITICAL | 2 hours |

---

## 🕐 DAY 1 (MONDAY) - BACKEND & SCHEMA

### Goal: All Odoo fields fetching correctly into database

### Task 1.1: Extend Product Schema (1 hour)

**What to do:**
Update product metadata to store all Odoo fields. Create table for tracking.

**File:** `backend/my-medusa-store/src/api/odoo/webhooks/products/route.ts`

**Fields to add to metadata:**
```
Core Fields:
- odoo_id (Odoo product ID)
- sku (Odoo default_code)
- barcode
- name
- description
- category_id, category_name
- brand_id, brand_name

Specifications:
- model
- specifications (JSON object)
- features (array)
- dimensions
- weight
- capacity
- screen_size
- cpu_type
- ram
- battery_capacity
- camera_specs

eCommerce:
- list_price
- standard_price (cost)
- currency
- discount_percentage
- list_price_currency

Inventory:
- qty_available
- virtual_available
- stock_status
- is_new

Images & Media:
- image_1920 (main image URL)
- image_1024
- image_512
- all_images (array of all image URLs)

Seller & Logistics:
- seller_name
- warranty
- warranty_type
- warranty_months
- delivery_days
- return_days
- return_policy

Reviews & Ratings:
- rating
- reviews_count
- is_bestseller

Shipping & Taxes:
- weight_for_shipping
- tax_name
- tax_percentage
- shipping_class
```

### Task 1.2: Update Webhook to Fetch ALL Fields (3 hours)

**What to do:**
Modify webhook to accept and store all critical Odoo fields

**Steps:**
1. Read complete webhook file
2. Extend the product interface to include all fields
3. Store all fields in product metadata
4. Create/update product_odoo_sync table to track sync

**Implementation:**

```typescript
// In webhook, update product interface:
export interface OdooProduct {
  // Identifiers
  odoo_id: number;
  sku: string;
  barcode?: string;
  name: string;
  
  // Descriptions
  description?: string;
  short_name?: string;
  
  // Pricing
  list_price?: number;
  standard_price?: number;
  currency?: string;
  discount?: number;
  
  // Inventory
  qty_available?: number;
  virtual_available?: number;
  stock_status?: string;
  
  // Categorization
  category_id?: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  
  // Specifications
  model?: string;
  specifications?: Record<string, any>;
  features?: string[];
  
  // Images
  image_1920?: string;
  image_1024?: string;
  image_512?: string;
  images?: string[];
  
  // Seller/Logistics
  seller_name?: string;
  warranty?: string;
  warranty_months?: number;
  delivery_days?: number;
  return_days?: number;
  return_policy?: string;
  weight?: number;
  dimensions?: string;
  
  // Reviews
  rating?: number;
  reviews_count?: number;
  
  // Status
  active?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
}
```

### Task 1.3: Store in Metadata (immediately after hook runs)

**Steps:**
1. When product is found, save ALL fields to product.metadata
2. Create/update product_odoo_sync table record
3. Log all fields received

**Check:**
```bash
# Test webhook with complete payload
curl -X POST http://localhost:9000/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "product.created",
    "product": {
      "odoo_id": 12345,
      "sku": "SAMSUNG-S25-BLUE",
      "name": "Samsung Galaxy S25 Ultra",
      "list_price": 5999,
      "standard_price": 4200,
      "qty_available": 50,
      "image_1920": "https://odoo.example.com/images/product.png",
      "model": "SM-S938BZBEAAE",
      "warranty": "1 Year Warranty",
      "rating": 4.5,
      "reviews_count": 320,
      ...
    }
  }'

# Verify in database
psql -c "SELECT metadata FROM product WHERE handle = 'samsung-galaxy-s25-ultra' LIMIT 1;"
```

---

## 🎨 DAY 2 (TUESDAY) - FRONTEND UI

### Goal: Product detail page looks like RunBazaar (shipping, specs, warranty, etc.)

### Task 2.1: Update Product Detail Page Layout (3 hours)

**File:** `frontend/markasouq-web/src/app/[lang]/products/[id]/page.js`

**Changes needed:**
1. Read all metadata fields from product
2. Add RunBazaar-style sections:
   - Product title + brand/model
   - Image gallery with color variants
   - Price display with discount
   - Shipping section (RunBazaar style)
   - Warranty & seller info
   - Specifications tab
   - Product highlights
   - Delivery options

### Task 2.2: Add Shipping Section (2 hours)

**What to show (like RunBazaar Samsung screenshot):**

```jsx
<ShippingSection>
  <ShippingMethodSelector>
    {/* Standard Delivery - Free */}
    <MethodOption selected={true}>
      <Icon>truck</Icon>
      <MethodTitle>Standard Delivery</MethodTitle>
      <MethodPrice>Free (For You!)</MethodPrice>
      <DeliveryDate>Get it by February 28</DeliveryDate>
    </MethodOption>
    
    {/* Night Delivery */}
    <MethodOption>
      <Icon>moon</Icon>
      <MethodTitle>Night Delivery</MethodTitle>
      <MethodPrice>KD 2.00</MethodPrice>
    </MethodOption>
  </ShippingMethodSelector>
  
  <DeliverToSection>
    <Label>Deliver to</Label>
    <LocationSelector value="Kuwait" />
    <DeliveryDate>Get it by {delivery_date}</DeliveryDate>
  </DeliverToSection>
  
  <PaymentMethodsSection>
    <Label>Payment methods</Label>
    <Icons>CASH | MASTERCARD | VISA</Icons>
  </PaymentMethodsSection>
  
  <SellerInfoSection>
    <SellerName>{product.seller}</SellerName>
    <Badges>
      <Badge>✓ Cash on delivery</Badge>
      <Badge>✓ 45 days returnable</Badge>
      <Badge>✓ Secure transaction</Badge>
    </Badges>
  </SellerInfoSection>
</ShippingSection>
```

### Task 2.3: Add Product Specifications Tab (2 hours)

**Show all product details from metadata:**

```jsx
<SpecificationsTab>
  <SpecGroup title="Basic Info">
    <Spec label="Model" value={product.model} />
    <Spec label="Brand" value={product.brand} />
    <Spec label="Color" value={selectedVariant?.color} />
    <Spec label="SKU" value={product.sku} />
  </SpecGroup>
  
  <SpecGroup title="Display">
    <Spec label="Screen Size" value={product.specs.screen_size} />
    <Spec label="Technology" value={product.specs.display_type} />
    <Spec label="Resolution" value={product.specs.resolution} />
  </SpecGroup>
  
  <SpecGroup title="Performance">
    <Spec label="CPU Type" value={product.specs.cpu_type} />
    <Spec label="RAM" value={product.specs.ram} />
    <Spec label="Storage" value={product.specs.storage} />
  </SpecGroup>
  
  <SpecGroup title="Camera">
    <Spec label="Front Camera" value={product.specs.front_camera} />
    <Spec label="Rear Camera" value={product.specs.rear_camera} />
  </SpecGroup>
  
  <SpecGroup title="Battery">
    <Spec label="Capacity" value={product.specs.battery_capacity} />
    <Spec label="Type" value={product.specs.battery_type} />
  </SpecGroup>
  
  <SpecGroup title="Physical">
    <Spec label="Weight" value={product.weight} />
    <Spec label="Dimensions" value={product.dimensions} />
    <Spec label="Design" value={product.specs.design} />
  </SpecGroup>
</SpecificationsTab>
```

### Task 2.4: Add Warranty & Seller Section (1 hour)

```jsx
<WarrantySection>
  <WarrantyInfo>
    <Icon>shield</Icon>
    <Title>{product.warranty}</Title>
    <Detail>Free</Detail>
  </WarrantyInfo>
  
  <SellerBadges>
    <Badge>✓ Cash on delivery</Badge>
    <Badge>✓ {product.return_days} days returnable</Badge>
    <Badge>✓ Secure transaction</Badge>
    <Badge>✓ Store Delivery</Badge>
  </SellerBadges>
  
  <ReturnPolicy>
    <Text>{product.return_policy}</Text>
  </ReturnPolicy>
</WarrantySection>
```

### Task 2.5: Enhance Product Images Gallery (1 hour)

**Show:**
1. Main image display (large)
2. Thumbnail strip below (like RunBazaar)
3. Color variant selector (if available)
4. Image counter (Pics 1/8)

```jsx
<ProductImageSection>
  <ImageGallery>
    <MainImage>
      <Image src={selectedImage} />
      <Badge>Free Shipping</Badge>
      <ImageCounter>Pics {selectedImageIndex + 1}/{images.length}</ImageCounter>
    </MainImage>
    
    <ThumbnailStrip>
      {product.images.map((img, idx) => (
        <Thumbnail
          key={idx}
          src={img}
          active={selectedImageIndex === idx}
          onClick={() => setSelectedImage(idx)}
        />
      ))}
    </ThumbnailStrip>
    
    {/* Color variants */}
    {product.available_colors && (
      <ColorSelector>
        {product.available_colors.map(color => (
          <ColorOption
            key={color}
            color={color}
            onClick={() => filterByColor(color)}
          />
        ))}
      </ColorSelector>
    )}
  </ImageGallery>
</ProductImageSection>
```

### Task 2.6: Add "More about this item" Section (1 hour)

**Show key features from Odoo:**

```jsx
<MoreAboutSection>
  <Title>More about this item</Title>
  <FeaturesList>
    {product.features?.map(feature => (
      <FeatureItem key={feature}>
        {feature}
      </FeatureItem>
    ))}
  </FeaturesList>
</MoreAboutSection>
```

---

## 🧪 DAY 3 (WEDNESDAY) - TESTING & DEPLOYMENT

### Task 3.1: Test Webhook End-to-End (1 hour)

**Test checklist:**
```bash
# 1. Start backend
cd backend/my-medusa-store
npm run dev

# 2. Wait for it to be ready
sleep 5

# 3. Test webhook with real-like product
curl -X POST http://localhost:9000/odoo/webhooks/products \
  -H "Content-Type: application/json" \
  -d @test-product-payload.json

# 4. Check database
psql -c "SELECT id, title, metadata FROM product WHERE metadata->>'odoo_id' = '12345' LIMIT 1;"

# 5. Check all fields are there
psql -c "SELECT * FROM product_odoo_sync WHERE odoo_id = 12345 LIMIT 1;"
```

### Task 3.2: Test Frontend Product Page (1 hour)

**Test checklist:**
```
1. Start frontend:
   cd frontend/markasouq-web
   npm run dev

2. Navigate to product page:
   http://localhost:3000/products/[product-handle]

3. Verify displays:
   ✓ Product images with gallery
   ✓ Product title, brand, model
   ✓ Price and discount
   ✓ Shipping section (standard + night delivery)
   ✓ Warranty badge
   ✓ Seller info
   ✓ Specifications tab (all fields)
   ✓ Features list
   ✓ Stock status
   ✓ Payment methods
   ✓ Delivery location selector

4. Test interactions:
   ✓ Click delivery method
   ✓ Click color variants
   ✓ Click image thumbnails
   ✓ Open specifications modal
   ✓ Add to cart
```

### Task 3.3: Build for Production (30 min)

```bash
# Backend
cd backend/my-medusa-store
npm run build
npm test  # Run tests if available

# Frontend
cd frontend/markasouq-web
npm run build
```

### Task 3.4: Deploy to Production (30 min)

```bash
# Deploy to server (72.61.240.40)

# 1. Pull latest code
ssh root@72.61.240.40 'cd /var/www/medusa && git pull origin main'

# 2. Backend
ssh root@72.61.240.40 'cd /var/www/medusa/backend/my-medusa-store && npm install && npm run build'

# 3. Restart backend
ssh root@72.61.240.40 'pm2 restart medusa-backend'

# 4. Frontend
ssh root@72.61.240.40 'cd /var/www/medusa/frontend/markasouq-web && npm install && npm run build'

# 5. Restart frontend
ssh root@72.61.240.40 'pm2 restart nextjs-app'

# 6. Verify
ssh root@72.61.240.40 'curl -s http://localhost:9000/health | jq .'
ssh root@72.61.240.40 'curl -s http://localhost:3000 | grep -i "marka souq" | head -1'
```

---

## 📝 KEY FILES TO MODIFY

### Backend
1. **src/api/odoo/webhooks/products/route.ts** (EXTEND)
   - Add all field types
   - Store in metadata
   - Create sync tracking

2. **src/types/odoo/index.ts** (CREATE if not exists)
   - Define OdooProduct interface with all fields
   - Define metadata structure

### Frontend
1. **src/app/[lang]/products/[id]/page.js** (MODIFY)
   - Add shipping section
   - Add specifications tab
   - Add warranty section
   - Enhance image gallery
   - Add "More about" section

2. **src/components/** (CREATE if needed)
   - ProductShippingSection component
   - ProductSpecifications component
   - ProductWarranty component
   - ProductImageGallery component

---

## ✅ SUCCESS CRITERIA

### Backend
- [ ] Webhook accepts all Odoo fields
- [ ] Fields stored in product metadata
- [ ] product_odoo_sync table tracks all syncs
- [ ] No errors in logs
- [ ] All critical fields mandatory

### Frontend
- [ ] Product detail page loads
- [ ] All metadata fields display
- [ ] Images show correctly
- [ ] Shipping section looks like RunBazaar
- [ ] Specifications tab shows all details
- [ ] Warranty badge displays
- [ ] Seller info visible
- [ ] No console errors

### Data
- [ ] Test product syncs end-to-end
- [ ] All fields transfer correctly
- [ ] Images display properly
- [ ] Prices calculate correctly
- [ ] Stock status accurate

### Deployment
- [ ] Production build succeeds
- [ ] No TypeScript errors
- [ ] Frontend accessible at domain
- [ ] Backend API responding
- [ ] Webhook working in production

---

## 🎯 RIGHT NOW (IMMEDIATE ACTIONS)

1. **Start Backend Webhook Update** (TASK 1.1 + 1.2)
   - Extend product interface
   - Add all field types
   - Store in metadata
   
2. **Start Frontend Update** (TASK 2.1)
   - Add shipping section
   - Add specifications tab
   - Enhance images
   
3. **Prepare Test Data** (TASK 3.1)
   - Create test product payload with all fields
   - Get sample Odoo product data

---

## 🚨 CRITICAL WARNINGS

⚠️ **These MUST be done:**
1. ALL Odoo fields must be in webhook
2. ALL fields must be stored in metadata
3. Frontend MUST display them like RunBazaar
4. Shipping section is CRITICAL (free shipping shown clearly)
5. Specifications tab MUST show all details
6. Warranty badge MUST be visible
7. NO errors on product page

⚠️ **Test before deploying:**
1. Webhook test with real Odoo data
2. Frontend page loads all fields
3. Images display correctly
4. No console errors
5. Mobile responsive (if needed)

⚠️ **Deployment checklist:**
1. Build succeeds
2. No TypeScript errors
3. Tests pass (if any)
4. Database migrations done
5. Verified on staging first

---

## 📞 SUPPORT

**If stuck:**
1. Check logs: `tail -f /tmp/medusa-backend.log`
2. Check database: `psql -c "SELECT * FROM product LIMIT 1;"`
3. Test webhook: Use curl commands above
4. Frontend debug: Check browser console (F12)
5. Check git status: `git status` to see changes

---

## 🎬 EXECUTION CHECKLIST

### DAY 1 (Monday)
- [ ] Read this document
- [ ] Extend webhook with all fields
- [ ] Test webhook locally
- [ ] Commit changes

### DAY 2 (Tuesday)
- [ ] Update frontend product page
- [ ] Add shipping section
- [ ] Add specifications
- [ ] Add warranty info
- [ ] Test locally
- [ ] Commit changes

### DAY 3 (Wednesday)
- [ ] Full end-to-end testing
- [ ] Build both apps
- [ ] Deploy to production
- [ ] Test on production
- [ ] Verify with client

---

**Remember:** Focus on getting Odoo fields into the database correctly first, then display them beautifully on frontend. Test as you go!

**Timeline:** 3 days, starting NOW! 🚀
