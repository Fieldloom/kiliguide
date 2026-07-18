import * as pdfjsLib from "npm:pdfjs-dist@3.11.174/legacy/build/pdf.js";
console.log(Object.keys(pdfjsLib));
if (pdfjsLib.default) {
  console.log("DEFAULT:", Object.keys(pdfjsLib.default));
}
