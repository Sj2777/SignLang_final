# HandSpeak

A small MERN-stack community for people beginning to learn American Sign Language (ASL). It includes a Vite/React frontend, an Express API, MongoDB persistence, cookie-based JWT sessions, starter lesson prompts, and a community feed.

## Requirements

- Node.js 18 or newer
- MongoDB running locally or a MongoDB connection URI

## Run locally

1. Install all root and workspace dependencies from the repository root:

   ```sh
   npm install
   ```

2. Copy both environment examples. In `server/.env`, set `MONGODB_URI` and replace `JWT_SECRET` with a private random value of at least 32 characters. `client/.env.local` can use the example API URL for local development.

   ```powershell
   Copy-Item client/.env.example client/.env.local
   Copy-Item server/.env.example server/.env
   ```

3. Start the client and API together:

   ```sh
   npm run dev
   ```

The Vite development server runs on `http://localhost:5173` and proxies `/api` requests to the API on port 5000. Set `CLIENT_ORIGIN` to the frontend origin. In production, serve the frontend over HTTPS and set `NODE_ENV=production` so the session cookie is secure.

## Project structure

```text
.
├── client/
│   ├── src/
│   │   ├── components/       # Shared form and authentication layout components
│   │   ├── styles/           # Tokens, base styles, shared components, page styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── package.json
```

Other useful root commands: `npm run build` builds the client, and `npm start` starts the API.

## Authentication API

Install dependencies from the repository root with `npm install`. The authentication routes use bcrypt password hashes, JWTs in an `httpOnly` `handspeak_session` cookie, field validation, and rate limiting on both login routes. API failures use the shape `{ "error": { "code": "...", "message": "...", "details": [] } }`; `details` appears for field validation failures.

### Endpoints

- `POST /api/auth/register/individual` — accepts `email`, `password`, and `profile.fullName`.
- `POST /api/auth/register/organization` — accepts `email`, `password`, and `profile.organizationName`, `profile.organizationType`, `profile.contactPersonName`; `profile.contactPhone` and `profile.website` are optional.
- `POST /api/auth/login/individual` and `POST /api/auth/login/organization` — accept `email` and `password`. Valid credentials for the other account type return `403 ACCOUNT_TYPE_MISMATCH`.
- `POST /api/auth/logout` — clears the session cookie.
- `GET /api/auth/me` — returns the signed-in account and profile.

Organization types are `school`, `NGO`, `company`, `interpreter agency`, and `other`. Authenticated routes can use the exported `requireAuth` middleware; follow it with `requireAccountType('individual')` or `requireAccountType('organization')` to restrict an endpoint by account type.

```js
import { requireAccountType, requireAuth } from './middleware/auth.js';

router.get('/organization/dashboard', requireAuth, requireAccountType('organization'), handler);
```

### Sample curl requests

Register an individual:

```sh
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"learner@example.com","password":"learning123","profile":{"fullName":"Alex Rivera"}}' \
  http://localhost:5001/api/auth/register/individual
```

Register an organization:

```sh
curl -i -c org-cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"hello@example.org","password":"learning123","profile":{"organizationName":"Open Hands School","organizationType":"school","contactPersonName":"Jordan Lee","contactPhone":"+1 555 010 2020","website":"https://example.org"}}' \
  http://localhost:5001/api/auth/register/organization
```

Sign in, then use the saved cookie to check the session:

```sh
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"learner@example.com","password":"learning123"}' \
  http://localhost:5001/api/auth/login/individual

curl -i -b cookies.txt http://localhost:5001/api/auth/me
```

Try the organization login route with individual credentials to see the account-type mismatch:

```sh
curl -i -H "Content-Type: application/json" \
  -d '{"email":"learner@example.com","password":"learning123"}' \
  http://localhost:5001/api/auth/login/organization
```

Sign out:

```sh
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:5001/api/auth/logout
```

## MVP routes

- `/` — introduction and links into the site
- `/learn` and `/learn/:slug` — starter ASL learning prompts
- `/community` — public feed; signed-in members can post
- `/login` — choose an individual or organization sign-in
- `/login/individual` and `/login/organization` — account-type-specific sign-in
- `/signup/individual` and `/signup/organization` — account-type-specific registration
- `/dashboard/individual` and `/dashboard/organization` — account-type-protected dashboards

The learning content is deliberately a set of prompts, not text-only claims to teach exact signs. ASL is visual and has regional variation; learners should use demonstrations and instruction from Deaf ASL educators.
