import fs from "fs/promises";
import path from "path";
import { Client } from "pg";

const connectionString = "<postgresql_url>";
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in .env");
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  // Create tables if not exist
  await client.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id UUID PRIMARY KEY REFERENCES users(id),
      budget TEXT,
      interests JSONB,
      preferred_pace TEXT,
      travel_style TEXT,
      embedding VECTOR(768)
    );

    CREATE TABLE IF NOT EXISTS places (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      budgetlevel INTEGER,
      imageurl TEXT,
      embedding VECTOR(768)
    );
  `);

  const dataPath = path.resolve(__dirname, "../data/sample-places.json");
  const raw = await fs.readFile(dataPath, "utf-8");
  const places = JSON.parse(raw);

  for (const place of places) {
    await client.query(
      `INSERT INTO places (name, description, category, budgetlevel, imageurl, embedding)
       VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        place.name,
        place.description,
        place.category,
        place.budgetlevel,
        place.imageurl,
        place.embedding,
      ]
    );
  }

  console.log(`Inserted/updated ${places.length} places.`);
  await client.end();
}

main().catch(console.error);
