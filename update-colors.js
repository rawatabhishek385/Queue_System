const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

async function updateSettings() {
  try {
    const adapter = new PrismaLibSql({ url: "file:./dev.db" });
    const prisma = new PrismaClient({ adapter });
    
    await prisma.settings.update({
      where: { companyId: "demo-company" },
      data: {
        backgroundColor: "#8b2c2c",
        primaryColor: "#000000",
        textColor: "#ffffff",
        scrollingText: "hi testing"
      }
    });
    console.log("Settings updated to red!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
updateSettings();
