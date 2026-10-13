# LearnSpace LMS

LearnSpace is a learning management system (LMS) for organizing courses and supporting students through lessons, learning materials, quizzes, and assignments. It has a React and Vite frontend, an Express API, and a MySQL database.

## Features

### Student experience

- **Dashboard:** View course counts, average learning progress, completed lessons, pending assignments, and announcements.
- **Course catalog:** Browse courses, search by course title or instructor, and filter by category.
- **Course overview:** Review the instructor and course description, track lesson completion, and see progress.
- **Lessons:** Mark course lessons complete. Completion is saved to the database per student.
- **Learning materials:** Read text materials and download course PDFs.
- **Quizzes:** Answer course quiz questions and submit for server-side scoring. Students receive one saved attempt per quiz; their chosen answers and score remain available when they return to the course.
- **Assignments:** Review assignment instructions and due dates, upload a PDF submission, replace a previous submission, and download your submitted file.
- **Discussion forum:** Post questions or comments in the discussion view.
- **Announcements:** View LMS announcements.
- **Profile:** View and edit the name and email shown in the current app session.

### Administrator experience

- **Course catalog management:** Create, edit, and delete courses, including their title, category, instructor, and description.
- **Lesson management:** Add, rename, and delete lessons belonging to a course.
- **Learning materials:** Add text content or upload PDF materials to a specific course; download or remove materials.
- **Assignments:** Create assignments with instructions and due dates, review student PDF submissions, download submissions, and remove assignments.
- **Quizzes:** Create course quizzes with a question and multiple-choice answers, choose the correct answer, and remove quizzes. Correct answers are available only to administrators; editing a quiz clears existing student attempts.
- **Administrator profile:** See administrator account details and shortcuts to course management and the audit log.

Administrators access these controls by signing in with an account whose database role is `admin`. Public registration creates student accounts only. Have a trusted database administrator assign administrator roles; do not expose database credentials or create a public admin-registration flow.

## Technology

- **Frontend:** React, Vite, and Oxlint
- **Backend:** Node.js, Express, and Multer
- **Database:** MySQL, accessed with `mysql2`
- **Authentication:** bcrypt password hashing and signed JWT bearer tokens
- **Uploads:** PDFs stored on the backend server and served through authenticated API routes

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- MySQL

## Local setup

### 1. Prepare MySQL

Create a database named `lms`. The backend expects the application’s `users` and `courses` tables to exist. It creates the course lessons, lesson progress, materials, assignments, quiz, quiz attempt, audit, and assignment submission tables when it starts. If your project does not already have the `users` and `courses` schema, create those tables before starting the backend.

### 2. Configure the backend

From the project root, copy the example environment file:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set the database connection details in `backend/.env`. Set `JWT_SECRET` to a private, randomly generated value of at least 32 characters. Never commit `.env` or share its values.

Environment variables:

| Name | Purpose | Default |
| --- | --- | --- |
| `PORT` | Backend HTTP port | `5000` |
| `DB_HOST` | MySQL server host | Required |
| `DB_USER` | MySQL username | Required |
| `DB_PASSWORD` | MySQL password | Required |
| `DB_NAME` | MySQL database name | Required; use `lms` for the steps above |
| `JWT_SECRET` | Secret used to sign authentication tokens | Required; at least 32 characters |

### 3. Install packages

Run from the project root:

```powershell
Set-Location backend
npm install
Set-Location ..\frontend
npm install
```

### 4. Start the application

Open one terminal for the backend:

```powershell
Set-Location backend
npm run dev
```

Open a second terminal for the frontend:

```powershell
Set-Location frontend
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. The backend API runs at `http://localhost:5000`; its health endpoint is `http://localhost:5000/api/health`.

## Typical workflows

### Create course content

1. Sign in as an administrator.
2. Open **Manage Courses** and create a course, or edit an existing course.
3. Add lessons from the Lessons section.
4. Open **My Courses**, open the course, and select **Materials**, **Assignments**, or **Quizzes** to add course-specific content.
5. Students can open the same course to study the material, take quizzes, and submit assignment PDFs.

### Submit an assignment

1. Sign in as a student and open **My Courses**.
2. Open a course and choose **Assignments**.
3. Choose a PDF file (up to 10 MB) and upload it.
4. The student can download or replace their own submission. Administrators can review and download submissions from that course.

## PDF storage and security

- PDF materials and assignment submissions are saved under `backend/uploads/`; that folder is ignored by Git.
- Uploads are limited to one PDF at a time and 10 MB per file. The server checks the PDF signature as well as the file type and extension.
- PDF downloads require a valid login. Students can only download their own assignment submissions; administrators can review submissions.
- Correct quiz answers are not sent to student course views. Quiz scoring is performed by the backend, and each student can submit one attempt per quiz.
- Back up the MySQL database and `backend/uploads/` together. Deleting a course or its assignments also removes their associated uploaded files.
- Local disk storage is intended for development or a single-server deployment. Use private shared object storage for a multi-server or production deployment.

## Data and current scope notes

- Course, lesson, material, assignment, quiz, and assignment submission data is stored in MySQL.
- Lesson completion is tracked per user. Replacing a submission replaces that student's previous PDF for the assignment.
- Discussion posts, profile edits, and the sample announcements are currently frontend demo data; profile edits and discussion posts are not persisted to MySQL.
- The app currently uses `http://localhost:5000/api` for frontend API requests. Configure the app appropriately before deploying frontend and backend separately.
- Admin APIs are protected by role checks; hiding admin controls in the frontend is not the security boundary.

## Project layout

```text
backend/
  server.js          Express API and MySQL initialization
  .env.example       Environment variable template
  uploads/           Local PDF storage (created when files are uploaded)
frontend/
  src/App.jsx        LMS pages and course workflows
  src/Auth.jsx       Login and registration UI
  src/*.css          Application styling
README.md            Setup and feature documentation
```

## Validation

Run the frontend linter and production build:

```powershell
Set-Location frontend
npm run lint
npm run build
```

Check backend JavaScript syntax:

```powershell
Set-Location backend
node --check server.js
```
