import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { forceIpv4 } from "./src/lib/force-ipv4";

forceIpv4();
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
