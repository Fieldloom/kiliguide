declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  function pdfParse(dataBuffer: Buffer | ArrayBuffer | Uint8Array, options?: any): Promise<PDFData>;

  export = pdfParse;
}
