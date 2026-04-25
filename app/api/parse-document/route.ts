import { NextRequest, NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

function jsonError(error: string, status = 500) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = (file.name || "").toLowerCase();

    let text = "";

    if (fileName.endsWith(".pdf")) {
      // pdf-parse is CommonJS (module.exports = fn); dynamic import().default
      // is not declared in its type definitions. Use require() with an explicit
      // signature so the call site stays type-safe.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (
        buffer: Buffer
      ) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      text = data.text ?? "";
    } else if (fileName.endsWith(".docx")) {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer });
      text = result.value ?? "";
    } else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return jsonError("Unsupported file type. Please upload a .pdf, .docx, or .txt file.", 415);
    }

    return NextResponse.json({ ok: true, text }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse document";
    return jsonError(message, 500);
  }
}

