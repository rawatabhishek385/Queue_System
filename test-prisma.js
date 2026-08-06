const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

try {
  const adapter = new PrismaLibSql({ url: "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });
  
  prisma.company.findFirst().then(c => {
    console.log("SUCCESS:", c);
  }).catch(e => {
    console.error("QUERY ERROR:", e.message);
  });
} catch (e) {
  console.error("ERROR:", e.message);
}
