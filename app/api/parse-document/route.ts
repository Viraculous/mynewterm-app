import { NextRequest, NextResponse } from "next/server";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getExtension(filename: string) {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx + 1).toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return jsonError("Missing file field 'file' in form data.", 400);
    if (typeof file.arrayBuffer !== "function") return jsonError("Invalid file upload.", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) return jsonError("Uploaded file is empty.", 400);

    const ext = getExtension(file.name || "");

    let text = "";
    if (ext === "pdf" || file.type === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const parsed = await parser.getText();
        text = parsed.text || "";
      } finally {
        await parser.destroy();
      }
    } else if (
      ext === "docx" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else if (ext === "txt" || file.type === "text/plain") {
      text = buffer.toString("utf-8");
    } else {
      return jsonError("Unsupported file type. Please upload a .pdf, .docx, or .txt file.", 415);
    }

    const cleaned = text.trim();
    if (!cleaned) return jsonError("No readable text found in document.", 422);

    return NextResponse.json({ ok: true, text: cleaned }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse document";
    return jsonError(message, 500);
  }
}

