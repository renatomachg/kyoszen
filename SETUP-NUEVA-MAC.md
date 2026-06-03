# Configurar Kyoszen en una computadora nueva

Guía para clonar y dejar el proyecto **idéntico y aislado** en otra Mac: git con llave SSH propia, identidad local, Supabase y el MCP de Claude. Sigue los pasos en orden.

> Repo: `renatomachg/kyoszen` · Cuenta GitHub: **renatomachg** · Supabase de Kyoszen: `xwzggymwdrvxpwvuefqf`

---

## 0. Clonar el proyecto

**Primera vez** (por HTTPS, no necesita llave todavía):
```bash
cd ~/Desktop
git clone https://github.com/renatomachg/kyoszen.git
cd kyoszen
```

**Para traer la versión más reciente** (cada vez que retomas el trabajo):
```bash
git pull origin main
```

> Si ya configuraste el SSH (paso 2), el remote queda en SSH y el pull funciona igual: `git pull`.

---

## 1. Qué conexiones tiene el proyecto (mapa mental)

| Conexión | Para qué sirve | Cómo se configura | ¿Viaja por git? |
|---|---|---|---|
| **GitHub (push/pull)** | subir/bajar código | llave SSH propia + alias (paso 2) | ❌ la llave NO |
| **Supabase del sitio** | base de datos de la app (vacantes, cursos, revisor, informes) | `.env.local` (URL + service role) | ❌ |
| **Anthropic / Claude** | asistente Kyo, Estratega, importador, informes | `ANTHROPIC_API_KEY` en `.env.local` | ❌ |
| **MCP Supabase (Claude Code)** | que Claude consulte la BD de Kyoszen | `.mcp.json` con token `sbp_` (paso 5) | ❌ |
| **SMTP (correos)** | invitaciones, notificaciones del revisor | está en `site_config` de Supabase, NO en archivos | ✅ (vive en la BD) |
| **VPS Hostinger (deploy)** | publicar a kyoszen.com | llave SSH `~/.ssh/kyoszen_vps` (paso 8) | ❌ |

**Regla de oro:** todo lo marcado ❌ son secretos que **NO están en GitHub**. Hay que copiarlos a mano desde la otra Mac, o regenerarlos. El código sí baja con el clone; los secretos no.

---

## 2. SSH propio para GitHub (cuenta renatomachg)

Genera una llave **dedicada** a esta cuenta (no reutilices otra), crea el alias y enlázala.

```bash
# a) generar la llave (sin passphrase, dedicada a esta cuenta)
ssh-keygen -t ed25519 -C "renatomachg@gmail.com" -f ~/.ssh/github_renatomachg -N ""

# b) crear el alias en ~/.ssh/config
cat >> ~/.ssh/config <<'EOF'

Host github-renatomachg
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_renatomachg
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config ~/.ssh/github_renatomachg

# c) ver la llave PÚBLICA para copiarla
cat ~/.ssh/github_renatomachg.pub
```

**Acción manual:** copia la línea que imprime `cat ...pub` y pégala en
[github.com/settings/ssh/new](https://github.com/settings/ssh/new) (logueado como **renatomachg**) → Title: "Mac (nombre)" → Add SSH key.

```bash
# d) apuntar el remote a SSH con el alias
git remote set-url origin git@github-renatomachg:renatomachg/kyoszen.git

# e) probar (debe decir "Hi renatomachg! ...")
ssh -T git@github-renatomachg
```

---

## 3. Identidad git local (aísla este repo)

```bash
git config --local user.name "Renato Machado"
git config --local user.email "renatomachg@gmail.com"
```

---

## 4. `.env.local` (SECRETO — copiar a mano)

`.env.local` **no viaja por git**. Cópialo desde la Mac donde ya funciona (AirDrop, USB o gestor de secretos) a la raíz del proyecto. Debe contener al menos:

```
NEXT_PUBLIC_SUPABASE_URL=https://xwzggymwdrvxpwvuefqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```
(más las que ya traiga el archivo original). **No lo subas nunca a git** (ya está en `.gitignore`).

---

## 5. `.mcp.json` (SECRETO — recrear con tu token)

Para que Claude Code consulte la BD de Kyoszen. Usa un token `sbp_` de la cuenta **dueña de Kyoszen** (genéralo en [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)).

Crea el archivo `.mcp.json` en la raíz con este contenido (reemplaza `PEGA_TU_TOKEN`):
```json
{
  "mcpServers": {
    "supabase-kyoszen": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref=xwzggymwdrvxpwvuefqf"],
      "env": { "SUPABASE_ACCESS_TOKEN": "PEGA_TU_TOKEN" }
    }
  }
}
```
> Se llama `supabase-kyoszen` (no `supabase`) a propósito, para no chocar con otro server MCP global que apunte a otro proyecto. Ya está en `.gitignore`, nunca se sube. Tras crearlo, **reinicia Claude Code**.

---

## 6. Dependencias

```bash
npm ci          # instalación limpia desde package-lock.json
```

---

## 7. Arrancar en local

El proyecto necesita el `.env.local` cargado. Usa el script del repo:
```bash
bash dev.sh     # carga .env.local y arranca en http://localhost:3002
```
Si no existe `dev.sh`, equivalente manual:
```bash
set -a; source .env.local; set +a
npm run dev     # next dev -p 3002
```
Abre **http://localhost:3002** y verifica que responde.

> Si al arrancar sale un error de caché de Turbopack ("Directory not empty"), borra `.next` y reintenta: `rm -rf .next && bash dev.sh`.

---

## 8. (Opcional) Deploy al VPS

Para publicar a kyoszen.com necesitas la llave `~/.ssh/kyoszen_vps` (cópiala de la otra Mac, NO está en git). Luego:
```bash
ssh -i ~/.ssh/kyoszen_vps root@76.13.111.112 "bash /home/kyoszen/deploy.sh"
```

---

## ✅ Checklist final

- [ ] `git pull` trae lo último
- [ ] `ssh -T git@github-renatomachg` dice "Hi renatomachg!"
- [ ] `.env.local` copiado (con SUPABASE + ANTHROPIC)
- [ ] `.mcp.json` creado con tu token `sbp_`
- [ ] `npm ci` corrió sin errores
- [ ] `bash dev.sh` → localhost:3002 responde
- [ ] Claude Code reiniciado (para tomar el `.mcp.json`)

## Lo que NUNCA está en git (copiar a mano por Mac)

1. `.env.local` (claves de Supabase + Anthropic)
2. `.mcp.json` (token de Supabase)
3. `~/.ssh/github_renatomachg` (llave de GitHub — mejor generar una nueva por Mac)
4. `~/.ssh/kyoszen_vps` (llave del VPS, solo si vas a desplegar)
