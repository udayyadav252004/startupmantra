# StartupMantra - Your Idea, Our Roadmap

StartupMantra is a simple full-stack startup planning app with:

- React + Vite + Tailwind CSS frontend
- Node.js + Express backend
- Firebase Firestore for stored ideas, users, and roadmap history
- OpenAI-powered startup idea generation, roadmap generation, and mentor chat

## Project structure

```text
StartupMantra/
|-- backend/
|   |-- config/
|   |-- middleware/
|   |-- prompts/
|   |-- routes/
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- src/
|   |-- .env.example
|   |-- package.json
|   `-- vite.config.js
`-- README.md
```

## Prerequisites

- Node.js 20 or newer
- A Firebase project with Firestore enabled
- A Firebase service account JSON file for the backend
- An OpenAI API key for AI features

## Backend setup

```bash
cd backend
npm install
copy .env.example .env
```

Update `backend/.env` with:

```env
PORT=5000
JWT_SECRET=replace-with-a-long-random-string
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

Place your Firebase service account JSON file at:

```text
backend/serviceAccountKey.json
```

If you store the file somewhere else, update `FIREBASE_SERVICE_ACCOUNT_KEY_PATH`.

## Frontend setup

```bash
cd frontend
npm install
copy .env.example .env
```

Update `frontend/.env` with your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Run locally

Open two terminals.

### Terminal 1 - backend

```bash
cd backend
npm run dev
```

### Terminal 2 - frontend

```bash
cd frontend
npm run dev
```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Current frontend flow

1. Sign up or log in from the account card to verify auth endpoints and the protected dashboard route.
2. Generate startup ideas from a category and load one into the idea form.
3. Save the idea to Firestore.
4. Generate a roadmap for the saved idea.
5. Ask follow-up questions in mentor chat using the selected idea and roadmap context.

## Notes

- If Firestore is not configured, idea and roadmap requests will return backend errors until Firebase is set up.
- If `OPENAI_API_KEY` is missing or out of quota, AI routes will return an error message in the UI.
- The Vite dev server proxies frontend API requests to the Express backend on port `5000`.
