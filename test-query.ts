import { PrismaClient } from './src/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

async function test() {
  try {
    const adapter = new PrismaLibSql({ url: "file:./dev.db" });
    const prisma = new PrismaClient({ adapter });
    
    console.log("Connecting...");
    const company = await prisma.company.findUnique({
      where: { id: "demo-company" },
      include: { settings: true }
    });
    
    console.log("Company:", company);
    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
}

test();
