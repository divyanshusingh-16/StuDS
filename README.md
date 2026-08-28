# STUDS

## Authentication

STUDS uses server-side, database-backed sessions. On successful login, the server creates a random session token, stores only its HMAC hash in MongoDB, and sends the raw token only in the `studs_session` HTTP-only cookie. Every protected request loads the session and active user on the server before role authorization runs.

Roles:

- `student`: public learning experience only.
- `content_admin`: may upload PDFs, manage chapter content, and generate study summaries.
- `super_admin`: includes content-admin permissions and may create subjects and units.

Required backend environment variables:

- `MONGO_URI`
- `FRONTEND_ORIGINS` (comma-separated allowed browser origins; `FRONTEND_URL` is also supported for compatibility)
- `SESSION_TOKEN_PEPPER` (at least 32 random characters in production)
- `SESSION_TTL_DAYS` (optional; 1–30, defaults to 7)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`

Copy `backend/.env.example` for local development. Local cookies use `SameSite=Lax` and do not require HTTPS. Production cookies use `HttpOnly`, `Secure`, `SameSite=None`, explicit max age, and path `/`; the production frontend origin must be configured exactly.

## Create the first super-admin

Set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in a private environment only, then run:

```bash
cd backend
npm run create:super-admin
```

The command requires a password of at least 12 characters, hashes it with bcrypt, and refuses to run when a `super_admin` already exists. Remove the temporary credential environment variables after use.

## Session endpoints

- `POST /api/auth/login` accepts `email` and `password`, sets the session cookie, and returns safe user details.
- `POST /api/auth/logout` revokes the current session when present and clears the cookie.
- `GET /api/auth/me` returns the current safe identity or `401`.

The login endpoint is rate limited. Never put passwords, session tokens, API keys, or backend environment values in the frontend or source control.
