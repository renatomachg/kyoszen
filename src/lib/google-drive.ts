// Subida de archivos a Google Drive (respaldo de videos publicados).
// Usa OAuth con refresh token (cuenta del dueño). Scope drive.file:
// la app SOLO puede tocar archivos que ella misma crea.
//
// Requiere en .env.local:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_DRIVE_FOLDER_ID

let cachedToken: { value: string; exp: number } | null = null;

export function driveConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_DRIVE_FOLDER_ID
  );
}

async function getAccessToken(): Promise<string> {
  // reutiliza el token mientras no expire (con 60s de margen)
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const tok = await r.json();
  if (!tok.access_token) {
    throw new Error("Google Drive: no se pudo refrescar el token. " + JSON.stringify(tok));
  }
  cachedToken = { value: tok.access_token, exp: Date.now() + (tok.expires_in ?? 3600) * 1000 };
  return tok.access_token;
}

export interface DriveFile {
  id: string;
  webViewLink: string;
}

// Sube un buffer a la carpeta destino y devuelve { id, webViewLink }.
export async function subirADrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<DriveFile> {
  const accessToken = await getAccessToken();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  const boundary = "kyoszen" + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: filename, parents: [folderId] });

  // multipart/related: parte 1 = metadata JSON, parte 2 = bytes del archivo
  const pre = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${meta}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
  );
  const post = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([pre, buffer, post]);

  const up = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const f = await up.json();
  if (!f.id) throw new Error("Google Drive: falló la subida. " + JSON.stringify(f));
  return { id: f.id, webViewLink: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view` };
}
