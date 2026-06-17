import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 30;

// Extrae el texto de un PDF subido (FormData con campo "file").
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibio ningun archivo." }, { status: 400 });
  }

  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    const limpio = (text ?? "").trim();
    if (limpio.length < 20) {
      return NextResponse.json({ error: "El PDF no tiene texto seleccionable (puede ser una imagen escaneada)." }, { status: 422 });
    }
    return NextResponse.json({ text: limpio });
  } catch (err) {
    console.error("extract-pdf:", err);
    return NextResponse.json({ error: "No se pudo leer el PDF." }, { status: 500 });
  }
}
