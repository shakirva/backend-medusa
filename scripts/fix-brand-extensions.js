#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const OUT_DIR = '/var/www/marqa-souq/frontend/markasouq-web/public/brands';
let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && fs.existsSync('/var/www/marqa-souq/backend/backend-medusa/.env')) {
  const envContent = fs.readFileSync('/var/www/marqa-souq/backend/backend-medusa/.env', 'utf8');
  const match = envContent.match(/DATABASE_URL\s*=\s*"?([^\s"]+)"?/);
  if (match) DATABASE_URL = match[1];
}

async function fixExtensions() {
  const pg = new Client({ connectionString: DATABASE_URL });
  await pg.connect();

  const files = fs.readdirSync(OUT_DIR);
  let fixed = 0;

  for (const file of files) {
    if (!file.endsWith('.png') && !file.endsWith('.jpg')) continue;

    const fpath = path.join(OUT_DIR, file);
    const content = fs.readFileSync(fpath, 'utf8'); // read first bit as string

    // Check if it's actually an SVG
    if (content.trim().startsWith('<svg') || content.trim().startsWith('<?xml')) {
      const newFileName = file.replace(/\.(png|jpg)$/, '.svg');
      const newPath = path.join(OUT_DIR, newFileName);
      
      console.log(`Fixing ${file} -> ${newFileName}`);
      fs.renameSync(fpath, newPath);

      // Update database
      const oldUrl = `/brands/${file}`;
      const newUrl = `/brands/${newFileName}`;
      
      await pg.query('UPDATE brand SET logo_url = $1 WHERE logo_url = $2', [newUrl, oldUrl]);
      fixed++;
    }
  }

  await pg.end();
  console.log(`Done fixing ${fixed} file extensions.`);
}

fixExtensions().catch(console.error);
