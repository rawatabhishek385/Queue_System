const { createClient } = require('@libsql/client');

try {
  const db1 = createClient({ url: "file:./dev.db" });
  console.log("file:./dev.db works!");
} catch (e) {
  console.error("file:./dev.db FAILED:", e.message);
}

try {
  const db2 = createClient({ url: "file:dev.db" });
  console.log("file:dev.db works!");
} catch (e) {
  console.error("file:dev.db FAILED:", e.message);
}

try {
  const db3 = createClient({ url: "file:///C:/Users/ABHISHEK RAWAT/OneDrive/Desktop/queue/dev.db" });
  console.log("file:///... works!");
} catch (e) {
  console.error("file:///... FAILED:", e.message);
}
