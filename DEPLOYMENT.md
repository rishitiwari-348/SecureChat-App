# SecureChat deployment checklist

## Render backend environment

```env
NODE_ENV=production
CLIENT_URL=https://secure-chat-app-nu.vercel.app
SERVER_URL=https://secure-chat-app-gvfp.onrender.com
GOOGLE_CALLBACK_URL=https://secure-chat-app-gvfp.onrender.com/api/auth/oauth/google/callback
GITHUB_CALLBACK_URL=https://secure-chat-app-gvfp.onrender.com/api/auth/oauth/github/callback
```

Also configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in Render. Do not commit their values.

## Vercel frontend environment

```env
VITE_API_URL=https://secure-chat-app-gvfp.onrender.com
```

Redeploy the frontend after changing a `VITE_*` variable because Vite embeds it at build time.

## Google Cloud Console

- Authorized JavaScript origin: `https://secure-chat-app-nu.vercel.app`
- Authorized redirect URI: `https://secure-chat-app-gvfp.onrender.com/api/auth/oauth/google/callback`

## GitHub OAuth App

- Homepage URL: `https://secure-chat-app-nu.vercel.app`
- Authorization callback URL: `https://secure-chat-app-gvfp.onrender.com/api/auth/oauth/github/callback`

## Verification flow

Verification emails must link to:

```text
https://secure-chat-app-gvfp.onrender.com/api/auth/verify-email?token=<one-time-token>
```

The backend then redirects to one of:

```text
https://secure-chat-app-nu.vercel.app/login?emailVerification=success
https://secure-chat-app-nu.vercel.app/login?emailVerification=invalid
```

## Dashboard checks

1. Confirm every URL is entered without quotes, whitespace, or a trailing path not shown above.
2. Confirm Render uses the repository backend service and Vercel builds the `frontend` directory.
3. Redeploy Render after changing backend variables.
4. Redeploy Vercel after changing `VITE_API_URL`.
5. Test Google and GitHub in a private browser window and confirm the callback host is Render.
