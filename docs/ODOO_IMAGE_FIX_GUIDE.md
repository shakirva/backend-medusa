

All product image URLs in the database point to the Odoo server:

```
https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/{odoo_id}/image_1920
```

But when these URLs are opened, Odoo returns a **grey placeholder image** (`placeholder.png`, 6KB) instead of the real product photo.

This means the product images have **not been uploaded** in the Odoo backend.

---

## How to Verify the Problem

Open any of these URLs in a browser:

```
https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92540/image_1920
https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92541/image_1920
https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92549/image_1920
```

| Result | Meaning |
|--------|---------|
| Grey placeholder icon shows | ❌ Image not uploaded in Odoo |
| Real product photo shows | ✅ Image is working |

---

## How to Fix (Steps for Odoo Developer)

### Step 1 — Log in to Odoo
Go to: `https://oskarllc-new-27289548.dev.odoo.com`  
Log in with your Odoo admin credentials.

### Step 2 — Go to Products
Navigate to: **Sales → Products** (or **Inventory → Products**)

### Step 3 — Upload Image for Each Product
1. Open a product (e.g. "PAWA Magnifier Series Mini Projector")
2. Click the **image/camera icon** at the **top-left** of the product form
3. Upload the product photo
4. Click **Save**
5. Repeat for all products

### Step 4 — Verify It Worked
Open this URL in your browser after uploading:
```
https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92540/image_1920
```
✅ If you see the real product photo → done, the website will automatically update  
❌ If you still see a grey placeholder → image was not saved correctly, try again

---

## List of Products That Need Images

| Odoo ID | Product Name |
|---------|-------------|
| 71138 | Devia Soft Elegant anti-shock case for iPhone 11 pro, Black |
| 71491 | Powerology Spetelli 10000mAh MagSafe Aluminum Power Bank -Orange |
| 71494 | Devia Nylon Braided Watch Loop iWatch 42/44/45/49mm Oat Milk |
| 71495 | Devia iPad Pro 11 (2020) Tempered Screen Guard |
| 71497 | Lepresso Mudcake Blended Coffee Capsules - Green |
| 71498 | Lepresso Rwanda Single Origin Coffee Capsules - Gold |
| 71499 | Lepresso Smooth Crema Blended Coffee Capsules - Pink |
| 71502 | Levelo Opulis MagSafe Frosted Case for iPhone 17 Pro Max - Phantom Black |
| 71503 | Levelo Solo Case iPhone 15 Pro Max Black |
| 71506 | Pawa Retro 25W With Type-C Port UK Plug With Type-C To Type-C Cable - Black |
| 71508 | Pawa Retro 3.1A Dual USB Travel Adapter With UK Plug With Type-C Cable - Black |
| 71511 | Porodo Double Sided Compact Mirror with PowerBank 5000mAh - White Rose Gold |
| 71512 | Porodo Soundtec ENC Airpods 2 - White |
| 71513 | Porodo 110W Dual Port Transparent Aluminum Car Charger Integrated Type-C Cable 1m |
| 71514 | Porodo 20000mAh Power Bank Dual Cable Built-In PB081 - Black |
| 71516 | Porodo 4-in-1 OTG Adapter, TF Card Reader - Black |
| 71518 | Porodo Crystal Shell GaN Wall Charger With USB-C Cable - Orange |
| 71519 | Porodo LED Auto-off Type-C to Type-C Braided USB Cable 1M - Gray |
| 71520 | Powerology ENC Wireless Neckband Earphones HiFi Sound IPX5 |
| 71522 | Powerology Monitor & App Baby Camera - Blue/Pink |
| 71540 | Power Socket (Universal) |
| 92540 | PAWA Magnifier Series Mini Projector - Gray |
| 92541 | Pawa Magbeats Mini Magsafe Speaker - Black |
| 92542 | Pawa Magcore Magsafe Powerbank With Built-in Stand - White |
| 92543 | Pawa Paris Trail Watch Strap Ultra/Series8 49/45/44/42MM Black Loop |
| 92544 | Pawa Stellar Smart Watch - Black |
| 92545 | Pawa Sturdy PD20W 30000mAh Powerbank With Digital Display and Type-C Cable |
| 92546 | Porodo 10.1" Kids Android Tablet HD Display 4000mAh Battery - Pink |
| 92547 | Porodo Cappadoc 60000mAh Multi-Port Power Bank with TFT Display - Black |
| 92548 | Porodo Lifestyle Silicone England Flag Watch Strap - Red/White |
| 92549 | Porodo Soundtec Party Speaker BASH 200W with 5.25" Woofer 2 Tweeter and FM - Black |
| 92550 | Porodo Blue 20000mAh/22.5W Quick Charge Power Bank Dual USB-A Output White |
| 92551 | Porodo Blue 4-in-1 USB-A Hub to 1x USB-A 3.0 5Gbps and 3x USB-A 2.0 480Mbps |
| 92552 | Porodo Blue 6 Universal Sockets Power Strip 3m - Black |
| 92553 | Porodo Blue Deep Bass Wireless Earbuds 3 - Pink |
| 92554 | Porodo Blue FM Transmitter Car Charger Type-C and Quick Charge 3.0 - Black |
| 92555 | Porodo Blue PVC Type-C to Lightning Cable 1M 20W - Black |
| 92556 | Porodo Blue Phone & Tablet Stand |
| 92557 | Porodo Lifestyle Birch 190 Wooden LED Flashlight - Wooden |
| 92558 | Porodo Gaming PDX551 Condenser Microphone Streaming/Podcasting/Recording - Black |
| 92559 | Porodo Gaming 27" 240Hz Curved Gaming Monitor Adjustable Rotating Stand - Black |
| 92560 | Porodo Gaming 5" IPS High Definition Handheld Transparent Game Console 128G - Black |
| 92561 | Porodo Gaming 6-in-1 USB-C Hub Type-C PD 100W HDMI USB SD MicroSD - Black |
| 92562 | Porodo Gaming 9D Wireless RGB Mouse 1000DPI 600mAh Battery - Black |
| 92563 | Porodo Gaming Stereo Speakers Bluetooth - Black |
| 92564 | Porodo Gaming Triple-Mode Gaming Headphone - Black |
| 92565 | Powerology Power Station (New) |
| 92566 | Powerology 4AC 2990W Power Strip - Black |
| 92567 | Powerology Pater III Portable Power Station 1200W - Gray |
| 92568 | Powerology Ultra Short Throw DLP Projector - Black |

**Total: 50 products need images uploaded**

---

## WhatsApp Message to Send

> Hi,
>
> Product images are not showing on our website because the Odoo backend is returning a grey placeholder instead of real product photos.
>
> **Please test this yourself:**
> Open this link in your browser:
> `https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/92540/image_1920`
>
> If you see a grey placeholder (not a real product photo), the images are missing.
>
> **To fix:**
> 1. Go to **Sales → Products** in Odoo
> 2. Open each product
> 3. Click the **image icon** (top-left of the product form)
> 4. Upload the product photo and click **Save**
>
> After uploading, open the same link again — if you see the real product photo, our website will automatically show it. No changes needed from our side.
>
> **50 products total need images.** I have sent the full list as a document.
>
> Please confirm once done. Thank you!

---

## Technical Notes (For Developers)

- **Image URL format:** `https://oskarllc-new-27289548.dev.odoo.com/web/image/product.template/{odoo_id}/image_1920`
- **Field name in Odoo:** `image_1920` on `product.template` model
- **No code changes needed** once images are uploaded — the URLs are already stored correctly in the Medusa database
- **Database column:** `product.thumbnail` in the Medusa PostgreSQL database
- **Affected table:** `product` where `metadata->>'odoo_id' IS NOT NULL`
