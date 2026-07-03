import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const DOMAIN = "https://kaustubhavastram.in"; // Update with your actual production domain

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
  try {
    // Fetch all available products
    const { data: products, error } = await supabase
      .from("products")
      .select("id, updated_at, available")
      .eq("available", true);

    if (error) throw error;

    // Static routes in your app
    const staticRoutes = [
      "/",
      "/checkout",
      "/shipping-returns",
      "/size-guide",
      "/contact"
    ];

    const today = new Date().toISOString();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static routes
    for (const route of staticRoutes) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${DOMAIN}${route}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n`;
      sitemap += `  </url>\n`;
    }

    // Add product routes dynamically
    if (products) {
      for (const product of products) {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${DOMAIN}/product/${product.id}</loc>\n`;
        sitemap += `    <lastmod>${product.updated_at || today}</lastmod>\n`;
        sitemap += `    <changefreq>daily</changefreq>\n`;
        sitemap += `    <priority>0.9</priority>\n`;
        sitemap += `  </url>\n`;
      }
    }

    sitemap += `</urlset>`;

    // Ensure public directory exists
    const publicDir = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    // Write to public/sitemap.xml
    const outputPath = path.resolve(publicDir, 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemap);

    console.log(`✅ Sitemap generated successfully at ${outputPath}`);
    console.log(`Generated ${staticRoutes.length} static routes and ${products?.length || 0} product routes.`);
    
  } catch (err) {
    console.error("Error generating sitemap:", err);
    process.exit(1);
  }
}

generateSitemap();
