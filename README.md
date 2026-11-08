# Validex Backend

## Summary
This backend provides a proctoring and test management system for students, teachers, and administrators. It supports:

- student and teacher registration with email OTP verification
- web authentication using JWT access and refresh tokens
- desktop authentication for test delivery and progress tracking
- test creation, attempt retrieval, and result submission
- role-based authorization for teacher and admin actions
- password reset via email OTP
- automatic test submission when a live timer expires

## Quick Start

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file with the required environment variables.

3. Start in development mode:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm start
```

## Environment Variables

Required:

- `PORT` - backend port (default: `8000`)
- `MONGODB_URI` or `MONGODB_ATLAS_URI` - MongoDB connection URI
- `DB_NAME` - MongoDB database name
- `ACCESS_TOKEN_SECRET` - JWT access token secret
- `REFRESH_TOKEN_SECRET` - JWT refresh token secret
- `RESEND_API_KEY` - Resend email service API key
- `EMAIL_FROM` - optional email sender address
- `GEMINI_API_KEY` - optional AI grading API key

## Running the API

- Web clients should use cookie-based auth for login and refresh flows.
- Desktop clients should authenticate using `Authorization: Bearer <token>`.

## Files

- `src/app.ts` - Express app and route registration
- `src/index.ts` - server bootstrap and DB connection
- `src/router` - route definitions
- `src/controllers` - controller logic
- `src/middleware` - auth, validation, and error handling
- `src/models` - MongoDB schemas and methods
- `src/schemas` - request validation rules
- `src/utills` - helper services and email integration

## Documentation

Full API documentation is available in `API.md`.
