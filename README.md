# LearnSpace LMS

LearnSpace is a learning management system with a React/Vite frontend and an Express/MySQL backend. Students can browse courses, complete lessons, read course materials, take quizzes, and submit assignment PDFs. Administrators can manage courses and add course-specific lessons, text or PDF materials, assignments, and quizzes.

## Requirements

- Node.js 20.19+ or 22.12+
- MySQL

## Setup

1. Create a MySQL database named `lms` and ensure the database contains the application's `users` and `courses` tables. The backend creates its course-content and submission tables when it starts.
2. Configure the backend:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```

   Edit `backend/.env` with your MySQL connection details and a private `JWT_SECRET` of at least 32 characters. Do not commit `.env`.

3. Install dependencies:

   ```powershell
   cd backend
   npm install
   cd ..\frontend
   npm install
   ```

4. Start the backend in one terminal:

   ```powershell
   cd backend
   npm run dev
   ```

5. Start the frontend in another terminal:

   ```powershell
   cd frontend
   npm run dev
   ```

   Open the local URL printed by Vite (normally `http://localhost:5173`).

## Accounts and roles

Use the registration screen to create a student account. Public registration always creates student accounts. An administrator account must be provisioned by a trusted database administrator by setting that user's `role` to `admin`. Admin-only course-management pages and forms are hidden from student accounts.

## PDF files

Course material PDFs and assignment submissions are stored locally under `backend/uploads/`, limited to 10 MB, and are not committed to Git. Downloads require authentication. Students can access their own submissions; administrators can review submissions for their courses.

Back up the uploads directory and MySQL database together. For deployment across multiple servers, replace local file storage with shared object storage.

## Checks

```powershell
cd frontend
npm run lint
npm run build
```

The backend can be syntax-checked with:

```powershell
cd backend
node --check server.js
```
