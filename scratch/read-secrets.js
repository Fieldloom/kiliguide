import fs from "fs";

try {
  const content1 = fs.readFileSync("secrets_out.txt", "utf16le");
  console.log("secrets_out.txt (utf16le):", content1);
} catch (e) {
  try {
    const content1 = fs.readFileSync("secrets_out.txt", "utf8");
    console.log("secrets_out.txt (utf8):", content1);
  } catch (err) {}
}

try {
  const content2 = fs.readFileSync("secrets2.txt", "utf16le");
  console.log("secrets2.txt (utf16le):", content2);
} catch (e) {
  try {
    const content2 = fs.readFileSync("secrets2.txt", "utf8");
    console.log("secrets2.txt (utf8):", content2);
  } catch (err) {}
}
