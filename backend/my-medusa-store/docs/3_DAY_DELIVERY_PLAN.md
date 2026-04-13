# 🚀 3-Day Delivery Plan — MarqaSouq Launch

## Day 1: Fix Critical Bugs
| Time | Task | Details |
|------|------|---------|
| 1 hr | Fix homepage New Arrivals section | Collection query returning empty — debug SQL |
| 1 hr | Fix product images loading | Verify safeImageFor() works, fix any remaining 400 errors |
| 2 hr | Sync product images from Odoo | Run image sync for all 2172 products (currently only 86 have images) |
| 1 hr | Fix product prices (showing 0.000) | Verify Odoo price sync, update prices in DB |
| 1 hr | Verify Kuwait region (KWD) setup | Remove Europe region, ensure KWD is default |
| 1 hr | End-to-end checkout test | Place a test order, verify entire flow |

## Day 2: Payment + Deployment
| Time | Task | Details |
|------|------|---------|
| 3 hr | Payment gateway setup | Integrate KNET (Kuwait) or Stripe |
| 1 hr | Email setup (SendGrid/Resend) | Order confirmation, password reset emails |
| 2 hr | Deploy backend to VPS | PostgreSQL, MedusaJS, PM2, Nginx |
| 1 hr | Deploy frontend to VPS | Next.js build, PM2, Nginx |
| 1 hr | SSL certificates + DNS | Let's Encrypt, point domains |

## Day 3: Testing + Final Fixes
| Time | Task | Details |
|------|------|---------|
| 2 hr | Full site testing | All pages, cart, checkout, payment, orders |
| 1 hr | Mobile responsive testing | Test on phone, fix any layout issues |
| 1 hr | Fix any bugs found during testing | Quick fixes |
| 1 hr | Production .env verification | Correct URLs, API keys, DB credentials |
| 1 hr | Final deploy + smoke test | Push final code, verify live site works |
| 1 hr | Flutter team handoff documentation | API docs, postman collection, auth flow |

---

## ⏰ Total Estimated Hours: ~22 hours across 3 days
