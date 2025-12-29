#!/usr/bin/env node
/**
 * Copies the built Admin UI from .medusa/server/public/admin to projectRoot/public/admin
 * so that the runtime admin loader can find index.html in production.
 */
const fs = require('fs')
const path = require('path')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry)
    const d = path.join(dest, entry)
    const stat = fs.statSync(s)
    if (stat.isDirectory()) {
      copyDir(s, d)
    } else {
      fs.copyFileSync(s, d)
    }
  }
  return true
}

const projectRoot = process.cwd()
const builtAdmin = path.join(projectRoot, '.medusa', 'server', 'public', 'admin')
const targetAdmin = path.join(projectRoot, 'public', 'admin')

const ok = copyDir(builtAdmin, targetAdmin)
if (ok) {
  console.log(`[admin-copy] Copied admin build to ${targetAdmin}`)
} else {
  console.warn('[admin-copy] No admin build found. Run `npm run build` first if starting in production.')
}
