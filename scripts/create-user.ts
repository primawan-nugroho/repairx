import path from "node:path";
import { config } from "dotenv";
import { hash } from "bcryptjs";
import { forceIpv4 } from "@/lib/force-ipv4";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createUserSchema } from "@/lib/validations";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

// Usage: npm run create-user -- <username> <password> "<Display Name>" <role>
// role: admin | production_control | viewer
async function main() {
  const [username, password, displayName, role] = process.argv.slice(2);

  const parsed = createUserSchema.parse({
    username,
    password,
    displayName,
    role,
  });

  const passwordHash = await hash(parsed.password, 12);

  await db
    .insert(users)
    .values({
      username: parsed.username.toLowerCase(),
      passwordHash,
      displayName: parsed.displayName,
      role: parsed.role,
    })
    .onConflictDoUpdate({
      target: users.username,
      set: { passwordHash, displayName: parsed.displayName, role: parsed.role },
    });

  console.log(`User "${parsed.username}" (${parsed.role}) created/updated.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
