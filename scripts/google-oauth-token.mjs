// Genera un GOOGLE_REFRESH_TOKEN para subir videos archivados a Google Drive.
// Uso (una sola vez):
//   GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..." node scripts/google-oauth-token.mjs
//
// Abre el link que imprime, autoriza con tu cuenta (renatomachg@gmail.com),
// y al final te da el refresh_token para pegar en .env.local.
//
// Scope: drive.file = la app SOLO puede tocar archivos que ella misma crea.
// (mínimo privilegio — no ve el resto de tu Drive).

import http from "node:http";
import { spawn } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/drive.file";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\n❌ Falta GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET.\n");
  console.error('Corre así:\n  GOOGLE_CLIENT_ID="xxx" GOOGLE_CLIENT_SECRET="yyy" node scripts/google-oauth-token.mjs\n');
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  }).toString();

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) {
    res.writeHead(404);
    res.end();
    return;
  }
  const code = new URL(req.url, REDIRECT).searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    res.end("Sin código.");
    return;
  }

  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT,
        grant_type: "authorization_code",
      }),
    });
    const tok = await r.json();
    if (!tok.refresh_token) {
      console.error("\n❌ No llegó refresh_token. Respuesta:", tok);
      res.writeHead(500);
      res.end("No llegó refresh_token. Revisa la terminal.");
    } else {
      console.log("\n✅ LISTO. Pega esto en tu .env.local:\n");
      console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
      console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`GOOGLE_REFRESH_TOKEN=${tok.refresh_token}\n`);
      console.log("Falta solo GOOGLE_DRIVE_FOLDER_ID (el ID de la carpeta destino).\n");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h2>✅ Autorización lista. Vuelve a la terminal para copiar el token.</h2>");
    }
  } catch (e) {
    console.error("Error intercambiando el código:", e);
    res.writeHead(500);
    res.end("Error. Revisa la terminal.");
  } finally {
    setTimeout(() => server.close(() => process.exit(0)), 500);
  }
});

server.listen(PORT, () => {
  console.log("\n🔑 Abre este link en tu navegador y autoriza:\n");
  console.log(authUrl + "\n");
  // intenta abrirlo solo (macOS)
  spawn("open", [authUrl]).on("error", () => {});
});
