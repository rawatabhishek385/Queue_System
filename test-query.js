require('dotenv').config();

// We have to transpile or just import the built version, but since it's Next.js we might need to use dynamic import for ES modules, or just duplicate the logic.
// Let's just require the Prisma client directly and try a query.
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

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
