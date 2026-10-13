require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const uploadDirectory = path.join(__dirname, "uploads");
const maxPdfSize = 10 * 1024 * 1024;

const pdfUpload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, callback) {
      fs.mkdir(uploadDirectory, { recursive: true }, (error) =>
        callback(error, uploadDirectory)
      );
    },
    filename(_req, _file, callback) {
      callback(null, `${crypto.randomUUID()}.pdf`);
    },
  }),
  limits: { fileSize: maxPdfSize, files: 1 },
  fileFilter(_req, file, callback) {
    if (
      file.mimetype !== "application/pdf" ||
      !file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      return callback(new Error("Only PDF files are allowed."));
    }
    return callback(null, true);
  },
});

function receivePdf(req, res, next) {
  pdfUpload.single("file")(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "PDF files must be 10 MB or smaller."
        : error.message || "Unable to receive PDF file.";
    return res.status(400).json({ message });
  });
}

function getSafeOriginalFilename(filename) {
  return path.basename(filename.replace(/[\\/]/g, path.sep)).slice(0, 255);
}

async function isPdfFile(filePath) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const signature = Buffer.alloc(5);
    const { bytesRead } = await handle.read(signature, 0, signature.length, 0);
    return bytesRead === 5 && signature.toString("ascii") === "%PDF-";
  } finally {
    await handle.close();
  }
}

async function removeUploadedFile(filename) {
  if (!filename) return;
  try {
    await fs.promises.unlink(path.join(uploadDirectory, path.basename(filename)));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function removeStoredFiles(files) {
  for (const filename of new Set(files.filter(Boolean))) {
    try {
      await removeUploadedFile(filename);
    } catch (error) {
      console.error(`Unable to remove uploaded file ${filename}:`, error.message);
    }
  }
}

function sendStoredPdf(res, filename, originalFilename, errorMessage) {
  const storedPath = path.join(uploadDirectory, path.basename(filename));
  return res.download(storedPath, getSafeOriginalFilename(originalFilename), (error) => {
    if (!error) return;
    console.error("PDF download failed:", error.message);
    if (!res.headersSent) res.status(500).json({ message: errorMessage });
  });
}

const defaultCourseContent = {
  1: {
    materials: [
      {
        id: 1,
        title: "Frontend Foundations",
        content:
          "Review HTML structure, semantic tags, and the relationship between page layout and accessibility.",
      },
      {
        id: 2,
        title: "Responsive Design Checklist",
        content:
          "Plan mobile-first layouts, fluid spacing, breakpoints, and accessible UI states for modern interfaces.",
      },
    ],
    assignments: [
      {
        id: 1,
        title: "Responsive landing page",
        description: "Build a landing page using semantic HTML and responsive CSS.",
        due_date: "2026-10-18",
        status: "Pending",
      },
    ],
    quizzes: [
      {
        id: 1,
        title: "HTML and CSS basics",
        questions: [
          {
            id: 1,
            question: "Which element is used to define the main content of a document?",
            options: ["<header>", "<main>", "<footer>", "<section>"],
            answer: "<main>",
          },
        ],
      },
    ],
    audit: [
      {
        id: 1,
        actor: "Admin",
        action: "Published course materials",
        timestamp: "2026-10-13T10:15:00.000Z",
      },
    ],
  },
  2: {
    materials: [
      {
        id: 1,
        title: "Python data workflow",
        content:
          "Follow a clear pipeline: collect data, clean it, visualize it, and evaluate the quality of your model choices.",
      },
    ],
    assignments: [
      {
        id: 1,
        title: "Data analysis notebook",
        description: "Prepare a notebook that summarizes KPI trends and key insights.",
        due_date: "2026-10-20",
        status: "Pending",
      },
    ],
    quizzes: [
      {
        id: 1,
        title: "Python fundamentals",
        questions: [
          {
            id: 1,
            question: "Which library is commonly used for data manipulation in Python?",
            options: ["Django", "Pandas", "Express", "Flask"],
            answer: "Pandas",
          },
        ],
      },
    ],
    audit: [
      {
        id: 1,
        actor: "Admin",
        action: "Reviewed assessment plan",
        timestamp: "2026-10-12T12:30:00.000Z",
      },
    ],
  },
  3: {
    materials: [
      {
        id: 1,
        title: "Database modeling basics",
        content:
          "Understand entity relationships, normalization rules, indexing, and the trade-offs between SQL design options.",
      },
    ],
    assignments: [
      {
        id: 1,
        title: "SQL query practice",
        description: "Write optimized SQL to retrieve and aggregate student performance metrics.",
        due_date: "2026-10-22",
        status: "Submitted",
      },
    ],
    quizzes: [
      {
        id: 1,
        title: "Relational database review",
        questions: [
          {
            id: 1,
            question: "Which SQL statement retrieves rows from a table?",
            options: ["INSERT", "UPDATE", "SELECT", "DELETE"],
            answer: "SELECT",
          },
        ],
      },
    ],
    audit: [
      {
        id: 1,
        actor: "Admin",
        action: "Updated database rubric",
        timestamp: "2026-10-11T09:40:00.000Z",
      },
    ],
  },
  4: {
    materials: [
      {
        id: 1,
        title: "Machine learning roadmap",
        content:
          "Learn the lifecycle of an ML project, from feature engineering to model evaluation and deployment decisions.",
      },
    ],
    assignments: [
      {
        id: 1,
        title: "Model evaluation report",
        description: "Compare model quality metrics and explain which algorithm is best suited to the dataset.",
        due_date: "2026-10-25",
        status: "Pending",
      },
    ],
    quizzes: [
      {
        id: 1,
        title: "ML fundamentals",
        questions: [
          {
            id: 1,
            question: "What does the term overfitting mean in machine learning?",
            options: [
              "The model performs well on new data",
              "The model learns noise instead of general patterns",
              "The model is too simple",
              "The model is not trained",
            ],
            answer: "The model learns noise instead of general patterns",
          },
        ],
      },
    ],
    audit: [
      {
        id: 1,
        actor: "Admin",
        action: "Approved learning path",
        timestamp: "2026-10-09T14:10:00.000Z",
      },
    ],
  },
};

// Validate JWT configuration.
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters long in .env"
  );
}

// Security middleware.
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "10kb" }));

// MySQL connection pool.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Rate limit login and registration requests.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many attempts. Please try again later.",
  },
});

// Generate a signed JWT.
function createToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
      algorithm: "HS256",
    }
  );
}

// Authentication middleware.
async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Please log in to access this resource.",
    });
  }

  try {
    const token = authorization.slice(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    const [users] = await pool.execute(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = ?`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    req.user = users[0];
    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token. Please log in again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Authentication failed.",
    });
  }
}

// Authorization middleware.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (
      !req.user ||
      !allowedRoles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
}

// Health check.
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LMS backend is running!",
  });
});

// REGISTER
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        message: "Name must contain 2 to 100 characters.",
      });
    }

    if (
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Public registration always creates a student account.
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'student')`,
      [cleanName, cleanEmail, passwordHash]
    );

    const user = {
      id: result.insertId,
      name: cleanName,
      email: cleanEmail,
      role: "student",
    };

    return res.status(201).json({
      message: "Registration successful.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Registration failed.",
    });
  }
});

// LOGIN
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const [users] = await pool.execute(
      `SELECT id, name, email, password_hash, role, created_at
       FROM users
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      role: users[0].role,
      created_at: users[0].created_at,
    };

    return res.json({
      message: "Login successful.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
});

// CURRENT USER PROFILE
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
  });
});

// ADMIN-ONLY USER LIST
app.get(
  "/api/admin/users",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const [users] = await pool.execute(
        `SELECT id, name, email, role, created_at
         FROM users
         ORDER BY id DESC`
      );

      return res.json({ users });
    } catch (error) {
      console.error("User query failed:", error.message);

      return res.status(500).json({
        message: "Unable to fetch users.",
      });
    }
  }
);

function validateCourse(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const instructor = typeof body.instructor === "string" ? body.instructor.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!title || !category || !instructor) {
    return { error: "Title, category, and instructor are required." };
  }

  if (title.length > 255 || category.length > 100 || instructor.length > 150 || description.length > 2000) {
    return { error: "Course details exceed the allowed length." };
  }

  return { course: { title, category, instructor, description } };
}

function getCourseId(value) {
  const courseId = Number(value);
  return Number.isSafeInteger(courseId) && courseId > 0 ? courseId : null;
}

function normalizeQuizOptions(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function normalizeAuditTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function loadCourseContentMap(userId = null, includeAllSubmissions = false) {
  const [materials] = await pool.execute(
    "SELECT * FROM course_materials ORDER BY course_id, id"
  );
  const [assignments] = await pool.execute(
    "SELECT * FROM course_assignments ORDER BY course_id, id"
  );
  const [submissions] = await pool.execute(
    includeAllSubmissions
      ? `SELECT s.id, s.assignment_id, s.user_id, s.original_filename, s.submitted_at,
                u.name AS student_name, u.email AS student_email
         FROM assignment_submissions s
         INNER JOIN users u ON u.id = s.user_id
         ORDER BY s.submitted_at DESC`
      : `SELECT id, assignment_id, user_id, original_filename, submitted_at
         FROM assignment_submissions
         WHERE user_id = ?
         ORDER BY submitted_at DESC`,
    includeAllSubmissions ? [] : [userId]
  );
  const [quizzes] = await pool.execute(
    "SELECT * FROM course_quizzes ORDER BY course_id, id"
  );
  const [questions] = await pool.execute(
    "SELECT * FROM quiz_questions ORDER BY quiz_id, id"
  );
  const [auditEntries] = await pool.execute(
    "SELECT * FROM course_audit_log ORDER BY course_id, created_at DESC, id DESC"
  );

  const contentMap = {};

  for (const item of materials) {
    if (!contentMap[item.course_id]) {
      contentMap[item.course_id] = {
        materials: [],
        assignments: [],
        quizzes: [],
        audit: [],
      };
    }
    contentMap[item.course_id].materials.push({
      id: item.id,
      title: item.title,
      content: item.content,
      fileName: item.original_filename,
      hasPdf: Boolean(item.file_path),
    });
  }

  for (const item of assignments) {
    if (!contentMap[item.course_id]) {
      contentMap[item.course_id] = {
        materials: [],
        assignments: [],
        quizzes: [],
        audit: [],
      };
    }
    const userSubmission = submissions.find(
      (submission) =>
        Number(submission.assignment_id) === Number(item.id) &&
        Number(submission.user_id) === Number(userId)
    );
    contentMap[item.course_id].assignments.push({
      id: item.id,
      title: item.title,
      description: item.description,
      due: item.due_date,
      status: userSubmission
        ? "Submitted"
        : includeAllSubmissions
          ? item.status
          : "Pending",
      submission: userSubmission
        ? {
            id: userSubmission.id,
            fileName: userSubmission.original_filename,
            submittedAt: userSubmission.submitted_at,
          }
        : null,
      submissions: includeAllSubmissions
        ? submissions
            .filter((submission) => Number(submission.assignment_id) === Number(item.id))
            .map((submission) => ({
              id: submission.id,
              userId: submission.user_id,
              studentName: submission.student_name,
              studentEmail: submission.student_email,
              fileName: submission.original_filename,
              submittedAt: submission.submitted_at,
            }))
        : [],
    });
  }

  for (const item of quizzes) {
    if (!contentMap[item.course_id]) {
      contentMap[item.course_id] = {
        materials: [],
        assignments: [],
        quizzes: [],
        audit: [],
      };
    }
    const quizQuestions = questions
      .filter((question) => Number(question.quiz_id) === Number(item.id))
      .map((question) => ({
        id: question.id,
        question: question.question,
        options: normalizeQuizOptions(question.options),
        answer: question.answer,
      }));

    contentMap[item.course_id].quizzes.push({
      id: item.id,
      title: item.title,
      questions: quizQuestions,
    });
  }

  for (const item of auditEntries) {
    if (!contentMap[item.course_id]) {
      contentMap[item.course_id] = {
        materials: [],
        assignments: [],
        quizzes: [],
        audit: [],
      };
    }
    contentMap[item.course_id].audit.push({
      id: item.id,
      actor: item.actor,
      action: item.action,
      timestamp: item.created_at,
    });
  }

  return contentMap;
}

function withCourseContent(courses, contentMap = {}) {
  return courses.map((course) => {
    const content = contentMap[course.id] || {
      materials: [],
      assignments: [],
      quizzes: [],
      audit: [],
    };

    return {
      ...course,
      materials: content.materials || [],
      assignments: content.assignments || [],
      quizzes: content.quizzes || [],
      audit: content.audit || [],
      lesson_count: Number(course.lesson_count ?? 0),
      completed_count: Number(course.completed_count ?? 0),
      progress:
        Number(course.lesson_count ?? 0) === 0
          ? 0
          : Math.round(
              (Number(course.completed_count ?? 0) /
                Number(course.lesson_count ?? 0)) *
                100
            ),
    };
  });
}

async function fetchCourses(userId = null, includeAllSubmissions = false) {
  const [courses] = await pool.execute(
    `SELECT c.*,
       (SELECT COUNT(*) FROM course_lessons l WHERE l.course_id = c.id) AS lesson_count,
       (SELECT COUNT(*)
        FROM course_lesson_progress p
        INNER JOIN course_lessons l ON l.id = p.lesson_id
        WHERE l.course_id = c.id AND p.user_id = ?) AS completed_count
     FROM courses c
     ORDER BY c.id DESC`,
    [userId]
  );

  const contentMap = await loadCourseContentMap(userId, includeAllSubmissions);
  return withCourseContent(courses, contentMap);
}

async function logAudit(courseId, actor, action) {
  if (!courseId || !actor || !action) return;

  await pool.execute(
    "INSERT INTO course_audit_log (course_id, actor, action) VALUES (?, ?, ?)",
    [courseId, actor, action]
  );
}

app.get(
  "/api/admin/courses",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      return res.json(await fetchCourses(req.user.id, true));
    } catch (error) {
      console.error("Admin course query failed:", error.message);
      return res.status(500).json({ message: "Unable to fetch courses." });
    }
  }
);

app.get(
  "/api/admin/audit",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const [auditEntries] = await pool.execute(
        `SELECT a.*, c.title AS course_title
         FROM course_audit_log a
         INNER JOIN courses c ON c.id = a.course_id
         ORDER BY a.created_at DESC, a.id DESC`
      );

      return res.json({
        audits: auditEntries.map((entry) => ({
          id: entry.id,
          courseId: entry.course_id,
          courseTitle: entry.course_title,
          actor: entry.actor,
          action: entry.action,
          timestamp: entry.created_at,
        })),
      });
    } catch (error) {
      console.error("Audit query failed:", error.message);
      return res.status(500).json({ message: "Unable to fetch audits." });
    }
  }
);

app.get(
  "/api/courses/:courseId/content",
  authenticateToken,
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    try {
      const [courses] = await pool.execute(
        "SELECT id FROM courses WHERE id = ?",
        [courseId]
      );
      if (courses.length === 0) {
        return res.status(404).json({ message: "Course not found." });
      }

      const courseContent = await loadCourseContentMap(
        req.user.id,
        req.user.role === "admin"
      );
      return res.json(courseContent[courseId] || {
        materials: [],
        assignments: [],
        quizzes: [],
        audit: [],
      });
    } catch (error) {
      console.error("Course content query failed:", error.message);
      return res.status(500).json({ message: "Unable to fetch course content." });
    }
  }
);

app.post(
  "/api/admin/courses/:courseId/materials",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

    if (!courseId || !title || !content) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    try {
      const [courses] = await pool.execute("SELECT id FROM courses WHERE id = ?", [courseId]);
      if (courses.length === 0) {
        return res.status(404).json({ message: "Course not found." });
      }

      const [result] = await pool.execute(
        "INSERT INTO course_materials (course_id, title, content) VALUES (?, ?, ?)",
        [courseId, title, content]
      );

      await logAudit(courseId, req.user?.name || "Admin", `Added learning material: ${title}`);
      return res.status(201).json({ id: result.insertId, courseId, title, content });
    } catch (error) {
      console.error("Material creation failed:", error.message);
      return res.status(500).json({ message: "Unable to create learning material." });
    }
  }
);

app.post(
  "/api/admin/courses/:courseId/materials/pdf",
  authenticateToken,
  requireRole("admin"),
  receivePdf,
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    let materialSaved = false;
    if (!courseId || !title || !req.file) {
      if (req.file) await removeUploadedFile(req.file.filename);
      return res.status(400).json({ message: "Course, material title, and PDF file are required." });
    }

    try {
      if (!(await isPdfFile(req.file.path))) {
        await removeUploadedFile(req.file.filename);
        return res.status(400).json({ message: "The selected file is not a valid PDF." });
      }

      const [courses] = await pool.execute("SELECT id FROM courses WHERE id = ?", [courseId]);
      if (courses.length === 0) {
        await removeUploadedFile(req.file.filename);
        return res.status(404).json({ message: "Course not found." });
      }

      const originalFilename = getSafeOriginalFilename(req.file.originalname);
      const [result] = await pool.execute(
        `INSERT INTO course_materials
          (course_id, title, content, file_path, original_filename)
         VALUES (?, ?, '', ?, ?)`,
        [courseId, title, req.file.filename, originalFilename]
      );
      materialSaved = true;
      await logAudit(courseId, req.user.name, `Added PDF learning material: ${title}`);
      return res.status(201).json({
        id: result.insertId,
        courseId,
        title,
        content: "",
        fileName: originalFilename,
        hasPdf: true,
      });
    } catch (error) {
      if (!materialSaved) await removeUploadedFile(req.file.filename);
      console.error("PDF material creation failed:", error.message);
      return res.status(500).json({ message: "Unable to create PDF learning material." });
    }
  }
);

app.get(
  "/api/courses/:courseId/materials/:materialId/pdf",
  authenticateToken,
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const materialId = getCourseId(req.params.materialId);
    if (!courseId || !materialId) {
      return res.status(400).json({ message: "Invalid course or material ID." });
    }

    try {
      const [materials] = await pool.execute(
        `SELECT file_path, original_filename FROM course_materials
         WHERE id = ? AND course_id = ? AND file_path IS NOT NULL`,
        [materialId, courseId]
      );
      if (materials.length === 0) {
        return res.status(404).json({ message: "PDF material not found." });
      }
      return sendStoredPdf(
        res,
        materials[0].file_path,
        materials[0].original_filename,
        "Unable to download learning material."
      );
    } catch (error) {
      console.error("PDF material lookup failed:", error.message);
      return res.status(500).json({ message: "Unable to download learning material." });
    }
  }
);

app.get(
  "/api/courses/:courseId/assignments/:assignmentId/submissions/:submissionId/pdf",
  authenticateToken,
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const assignmentId = getCourseId(req.params.assignmentId);
    const submissionId = getCourseId(req.params.submissionId);
    if (!courseId || !assignmentId || !submissionId) {
      return res.status(400).json({ message: "Invalid course, assignment, or submission ID." });
    }

    try {
      const [submissions] = await pool.execute(
        `SELECT s.file_path, s.original_filename, s.user_id
         FROM assignment_submissions s
         INNER JOIN course_assignments a ON a.id = s.assignment_id
         WHERE s.id = ? AND s.assignment_id = ? AND a.course_id = ?`,
        [submissionId, assignmentId, courseId]
      );
      if (submissions.length === 0) {
        return res.status(404).json({ message: "Assignment submission not found." });
      }
      if (
        req.user.role !== "admin" &&
        Number(req.user.id) !== Number(submissions[0].user_id)
      ) {
        return res.status(403).json({ message: "You cannot access this submission." });
      }
      return sendStoredPdf(
        res,
        submissions[0].file_path,
        submissions[0].original_filename,
        "Unable to download assignment submission."
      );
    } catch (error) {
      console.error("Assignment submission lookup failed:", error.message);
      return res.status(500).json({ message: "Unable to download assignment submission." });
    }
  }
);

app.put(
  "/api/admin/courses/:courseId/materials/:materialId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const materialId = getCourseId(req.params.materialId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

    if (!courseId || !materialId || !title || !content) {
      return res.status(400).json({ message: "Material title and content are required." });
    }

    try {
      const [result] = await pool.execute(
        "UPDATE course_materials SET title = ?, content = ? WHERE id = ? AND course_id = ?",
        [title, content, materialId, courseId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Learning material not found." });
      }
      await logAudit(courseId, req.user?.name || "Admin", `Updated learning material: ${title}`);
      return res.json({ message: "Learning material updated." });
    } catch (error) {
      console.error("Material update failed:", error.message);
      return res.status(500).json({ message: "Unable to update learning material." });
    }
  }
);

app.delete(
  "/api/admin/courses/:courseId/materials/:materialId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const materialId = getCourseId(req.params.materialId);

    if (!courseId || !materialId) {
      return res.status(400).json({ message: "Invalid material ID." });
    }

    try {
      const [materials] = await pool.execute(
        "SELECT file_path FROM course_materials WHERE id = ? AND course_id = ?",
        [materialId, courseId]
      );
      const [result] = await pool.execute(
        "DELETE FROM course_materials WHERE id = ? AND course_id = ?",
        [materialId, courseId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Learning material not found." });
      }
      if (materials[0].file_path) {
        await removeUploadedFile(materials[0].file_path);
      }
      await logAudit(courseId, req.user?.name || "Admin", "Deleted a learning material");
      return res.json({ message: "Learning material deleted." });
    } catch (error) {
      console.error("Material deletion failed:", error.message);
      return res.status(500).json({ message: "Unable to delete learning material." });
    }
  }
);

app.post(
  "/api/admin/courses/:courseId/assignments",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    const dueDate = typeof req.body.due_date === "string" ? req.body.due_date.trim() : "";
    const status = typeof req.body.status === "string" ? req.body.status : "Pending";

    if (!courseId || !title || !description || !dueDate) {
      return res.status(400).json({ message: "Assignment title, description, and due date are required." });
    }

    try {
      const [courses] = await pool.execute("SELECT id FROM courses WHERE id = ?", [courseId]);
      if (courses.length === 0) {
        return res.status(404).json({ message: "Course not found." });
      }

      const [result] = await pool.execute(
        "INSERT INTO course_assignments (course_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)",
        [courseId, title, description, dueDate, status]
      );

      await logAudit(courseId, req.user?.name || "Admin", `Added assignment: ${title}`);
      return res.status(201).json({ id: result.insertId, courseId, title, description, due_date: dueDate, status });
    } catch (error) {
      console.error("Assignment creation failed:", error.message);
      return res.status(500).json({ message: "Unable to create assignment." });
    }
  }
);

app.put(
  "/api/admin/courses/:courseId/assignments/:assignmentId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const assignmentId = getCourseId(req.params.assignmentId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    const dueDate = typeof req.body.due_date === "string" ? req.body.due_date.trim() : "";
    const status = typeof req.body.status === "string" ? req.body.status : "Pending";

    if (!courseId || !assignmentId || !title || !description || !dueDate) {
      return res.status(400).json({ message: "Assignment title, description, and due date are required." });
    }

    try {
      const [result] = await pool.execute(
        "UPDATE course_assignments SET title = ?, description = ?, due_date = ?, status = ? WHERE id = ? AND course_id = ?",
        [title, description, dueDate, status, assignmentId, courseId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Assignment not found." });
      }
      await logAudit(courseId, req.user?.name || "Admin", `Updated assignment: ${title}`);
      return res.json({ message: "Assignment updated." });
    } catch (error) {
      console.error("Assignment update failed:", error.message);
      return res.status(500).json({ message: "Unable to update assignment." });
    }
  }
);

app.delete(
  "/api/admin/courses/:courseId/assignments/:assignmentId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const assignmentId = getCourseId(req.params.assignmentId);

    if (!courseId || !assignmentId) {
      return res.status(400).json({ message: "Invalid assignment ID." });
    }

    try {
      const [storedSubmissions] = await pool.execute(
        "SELECT file_path FROM assignment_submissions WHERE assignment_id = ?",
        [assignmentId]
      );
      const [result] = await pool.execute(
        "DELETE FROM course_assignments WHERE id = ? AND course_id = ?",
        [assignmentId, courseId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Assignment not found." });
      }
      await pool.execute(
        "DELETE FROM assignment_submissions WHERE assignment_id = ?",
        [assignmentId]
      );
      await removeStoredFiles(storedSubmissions.map((submission) => submission.file_path));
      await logAudit(courseId, req.user?.name || "Admin", "Deleted an assignment");
      return res.json({ message: "Assignment deleted." });
    } catch (error) {
      console.error("Assignment deletion failed:", error.message);
      return res.status(500).json({ message: "Unable to delete assignment." });
    }
  }
);

app.post(
  "/api/courses/:courseId/assignments/:assignmentId/submissions",
  authenticateToken,
  requireRole("student"),
  receivePdf,
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const assignmentId = getCourseId(req.params.assignmentId);
    let submissionSaved = false;
    if (!courseId || !assignmentId || !req.file) {
      if (req.file) await removeUploadedFile(req.file.filename);
      return res.status(400).json({ message: "Assignment and PDF file are required." });
    }

    try {
      if (!(await isPdfFile(req.file.path))) {
        await removeUploadedFile(req.file.filename);
        return res.status(400).json({ message: "The selected file is not a valid PDF." });
      }

      const [assignments] = await pool.execute(
        "SELECT id FROM course_assignments WHERE id = ? AND course_id = ?",
        [assignmentId, courseId]
      );
      if (assignments.length === 0) {
        await removeUploadedFile(req.file.filename);
        return res.status(404).json({ message: "Assignment not found in this course." });
      }

      const [previousSubmissions] = await pool.execute(
        "SELECT id, file_path FROM assignment_submissions WHERE assignment_id = ? AND user_id = ?",
        [assignmentId, req.user.id]
      );
      const originalFilename = getSafeOriginalFilename(req.file.originalname);
      const [result] = await pool.execute(
        `INSERT INTO assignment_submissions
          (assignment_id, user_id, file_path, original_filename)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           id = LAST_INSERT_ID(id),
           file_path = VALUES(file_path),
           original_filename = VALUES(original_filename),
           submitted_at = CURRENT_TIMESTAMP`,
        [assignmentId, req.user.id, req.file.filename, originalFilename]
      );
      submissionSaved = true;
      const oldFile = previousSubmissions[0]?.file_path;
      if (oldFile && oldFile !== req.file.filename) {
        await removeStoredFiles([oldFile]);
      }

      return res.status(201).json({
        id: result.insertId,
        assignmentId,
        fileName: originalFilename,
        submittedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (!submissionSaved) await removeUploadedFile(req.file.filename);
      console.error("Assignment PDF submission failed:", error.message);
      return res.status(500).json({ message: "Unable to submit assignment PDF." });
    }
  }
);

app.post(
  "/api/admin/courses/:courseId/quizzes",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];

    if (!courseId || !title || questions.length === 0) {
      return res.status(400).json({ message: "Quiz title and at least one question are required." });
    }

    try {
      const [courses] = await pool.execute("SELECT id FROM courses WHERE id = ?", [courseId]);
      if (courses.length === 0) {
        return res.status(404).json({ message: "Course not found." });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [quizResult] = await connection.execute(
          "INSERT INTO course_quizzes (course_id, title) VALUES (?, ?)",
          [courseId, title]
        );

        const insertEntries = questions.map((question) => [
          quizResult.insertId,
          question.question,
          JSON.stringify(Array.isArray(question.options) ? question.options : []),
          question.answer,
        ]);

        if (insertEntries.length > 0) {
          await connection.query(
            "INSERT INTO quiz_questions (quiz_id, question, options, answer) VALUES ?",
            [insertEntries]
          );
        }

        await connection.commit();
        await logAudit(courseId, req.user?.name || "Admin", `Added quiz: ${title}`);
        return res.status(201).json({ id: quizResult.insertId, courseId, title, questions });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Quiz creation failed:", error.message);
      return res.status(500).json({ message: "Unable to create quiz." });
    }
  }
);

app.put(
  "/api/admin/courses/:courseId/quizzes/:quizId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const quizId = getCourseId(req.params.quizId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];

    if (!courseId || !quizId || !title || questions.length === 0) {
      return res.status(400).json({ message: "Quiz title and questions are required." });
    }

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [result] = await connection.execute(
          "UPDATE course_quizzes SET title = ? WHERE id = ? AND course_id = ?",
          [title, quizId, courseId]
        );
        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({ message: "Quiz not found." });
        }

        await connection.execute("DELETE FROM quiz_questions WHERE quiz_id = ?", [quizId]);

        const values = questions.map((question) => [
          quizId,
          question.question,
          JSON.stringify(Array.isArray(question.options) ? question.options : []),
          question.answer,
        ]);

        if (values.length > 0) {
          await connection.query(
            "INSERT INTO quiz_questions (quiz_id, question, options, answer) VALUES ?",
            [values]
          );
        }

        await connection.commit();
        await logAudit(courseId, req.user?.name || "Admin", `Updated quiz: ${title}`);
        return res.json({ message: "Quiz updated." });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Quiz update failed:", error.message);
      return res.status(500).json({ message: "Unable to update quiz." });
    }
  }
);

app.delete(
  "/api/admin/courses/:courseId/quizzes/:quizId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const quizId = getCourseId(req.params.quizId);

    if (!courseId || !quizId) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    try {
      const [result] = await pool.execute(
        "DELETE FROM course_quizzes WHERE id = ? AND course_id = ?",
        [quizId, courseId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Quiz not found." });
      }

      await pool.execute("DELETE FROM quiz_questions WHERE quiz_id = ?", [quizId]);
      await logAudit(courseId, req.user?.name || "Admin", "Deleted a quiz");
      return res.json({ message: "Quiz deleted." });
    } catch (error) {
      console.error("Quiz deletion failed:", error.message);
      return res.status(500).json({ message: "Unable to delete quiz." });
    }
  }
);

app.post(
  "/api/admin/courses",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const validation = validateCourse(req.body);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    try {
      const { title, category, instructor, description } = validation.course;
      const [result] = await pool.execute(
        `INSERT INTO courses (title, category, instructor, description)
         VALUES (?, ?, ?, ?)`,
        [title, category, instructor, description]
      );

      await logAudit(
        result.insertId,
        req.user?.name || "Admin",
        `Created course: ${title}`
      );

      return res.status(201).json({ id: result.insertId });
    } catch (error) {
      console.error("Course creation failed:", error.message);
      return res.status(500).json({ message: "Unable to create course." });
    }
  }
);

app.put(
  "/api/admin/courses/:courseId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const validation = validateCourse(req.body);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course ID." });
    }
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    try {
      const { title, category, instructor, description } = validation.course;
      const [result] = await pool.execute(
        `UPDATE courses
         SET title = ?, category = ?, instructor = ?, description = ?
         WHERE id = ?`,
        [title, category, instructor, description, courseId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Course not found." });
      }

      await logAudit(
        courseId,
        req.user?.name || "Admin",
        `Updated course: ${title}`
      );

      return res.json({ message: "Course updated." });
    } catch (error) {
      console.error("Course update failed:", error.message);
      return res.status(500).json({ message: "Unable to update course." });
    }
  }
);

app.delete(
  "/api/admin/courses/:courseId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [courses] = await connection.execute(
        "SELECT id, title FROM courses WHERE id = ? FOR UPDATE",
        [courseId]
      );
      if (courses.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Course not found." });
      }
      const [materialFiles] = await connection.execute(
        "SELECT file_path FROM course_materials WHERE course_id = ?",
        [courseId]
      );
      const [submissionFiles] = await connection.execute(
        `SELECT s.file_path FROM assignment_submissions s
         INNER JOIN course_assignments a ON a.id = s.assignment_id
         WHERE a.course_id = ?`,
        [courseId]
      );
      await connection.execute(
        `DELETE FROM assignment_submissions
         WHERE assignment_id IN (SELECT id FROM course_assignments WHERE course_id = ?)`,
        [courseId]
      );
      await connection.execute(
        `DELETE FROM course_lesson_progress
         WHERE lesson_id IN (SELECT id FROM course_lessons WHERE course_id = ?)`,
        [courseId]
      );
      await connection.execute("DELETE FROM course_lessons WHERE course_id = ?", [courseId]);
      await connection.execute("DELETE FROM course_materials WHERE course_id = ?", [courseId]);
      await connection.execute("DELETE FROM course_assignments WHERE course_id = ?", [courseId]);
      await connection.execute(
        "DELETE FROM quiz_questions WHERE quiz_id IN (SELECT id FROM course_quizzes WHERE course_id = ?)",
        [courseId]
      );
      await connection.execute("DELETE FROM course_quizzes WHERE course_id = ?", [courseId]);
      await connection.execute("DELETE FROM course_audit_log WHERE course_id = ?", [courseId]);
      await connection.execute("DELETE FROM courses WHERE id = ?", [courseId]);
      await connection.commit();
      await removeStoredFiles([
        ...materialFiles.map((item) => item.file_path),
        ...submissionFiles.map((item) => item.file_path),
      ]);

      await logAudit(
        courseId,
        req.user?.name || "Admin",
        `Deleted course: ${courses[0].title}`
      );

      return res.json({ message: "Course deleted." });
    } catch (error) {
      await connection.rollback();
      console.error("Course deletion failed:", error.message);
      return res.status(500).json({ message: "Unable to delete course." });
    } finally {
      connection.release();
    }
  }
);

app.get(
  "/api/courses",
  authenticateToken,
  async (req, res) => {
  try {
      return res.json(await fetchCourses(req.user.id, req.user.role === "admin"));
  } catch (error) {
    console.error("Course query failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch courses",
    });
  }
  }
);

app.get(
  "/api/courses/:courseId/lessons",
  authenticateToken,
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    try {
      const [courses] = await pool.execute(
        "SELECT id FROM courses WHERE id = ?",
        [courseId]
      );
      if (courses.length === 0) {
        return res.status(404).json({ message: "Course not found." });
      }
      const [lessons] = await pool.execute(
        `SELECT l.id, l.title, l.sort_order,
           (p.lesson_id IS NOT NULL) AS completed
         FROM course_lessons l
         LEFT JOIN course_lesson_progress p
           ON p.lesson_id = l.id AND p.user_id = ?
         WHERE l.course_id = ?
         ORDER BY l.sort_order, l.id`,
        [req.user.id, courseId]
      );
      return res.json(lessons);
    } catch (error) {
      console.error("Lesson query failed:", error.message);
      return res.status(500).json({ message: "Unable to fetch lessons." });
    }
  }
);

app.post(
  "/api/courses/:courseId/lessons/:lessonId/complete",
  authenticateToken,
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const lessonId = getCourseId(req.params.lessonId);
    if (!courseId || !lessonId) {
      return res.status(400).json({ message: "Invalid course or lesson ID." });
    }

    try {
      const [lessons] = await pool.execute(
        "SELECT id FROM course_lessons WHERE id = ? AND course_id = ?",
        [lessonId, courseId]
      );
      if (lessons.length === 0) {
        return res.status(404).json({ message: "Lesson not found." });
      }
      await pool.execute(
        `INSERT IGNORE INTO course_lesson_progress (user_id, lesson_id)
         VALUES (?, ?)`,
        [req.user.id, lessonId]
      );
      const courses = await fetchCourses(req.user.id);
      return res.json(
        courses.find((course) => Number(course.id) === courseId)
      );
    } catch (error) {
      console.error("Lesson completion failed:", error.message);
      return res.status(500).json({ message: "Unable to update progress." });
    }
  }
);

app.post(
  "/api/admin/courses/:courseId/lessons",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    if (!courseId || !title || title.length > 255) {
      return res.status(400).json({ message: "A valid course and lesson title are required." });
    }

    try {
      const [courses] = await pool.execute(
        "SELECT id FROM courses WHERE id = ?",
        [courseId]
      );
      if (courses.length === 0) {
        return res.status(404).json({ message: "Course not found." });
      }
      const [result] = await pool.execute(
        `INSERT INTO course_lessons (course_id, title, sort_order)
         SELECT ?, ?, COALESCE(MAX(sort_order), 0) + 1
         FROM course_lessons WHERE course_id = ?`,
        [courseId, title, courseId]
      );
      return res.status(201).json({ id: result.insertId, title });
    } catch (error) {
      console.error("Lesson creation failed:", error.message);
      return res.status(500).json({ message: "Unable to create lesson." });
    }
  }
);

app.put(
  "/api/admin/courses/:courseId/lessons/:lessonId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const lessonId = getCourseId(req.params.lessonId);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    if (!courseId || !lessonId || !title || title.length > 255) {
      return res.status(400).json({ message: "A valid lesson title is required." });
    }

    try {
      const [result] = await pool.execute(
        "UPDATE course_lessons SET title = ? WHERE id = ? AND course_id = ?",
        [title, lessonId, courseId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Lesson not found." });
      }
      return res.json({ message: "Lesson updated." });
    } catch (error) {
      console.error("Lesson update failed:", error.message);
      return res.status(500).json({ message: "Unable to update lesson." });
    }
  }
);

app.delete(
  "/api/admin/courses/:courseId/lessons/:lessonId",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    const courseId = getCourseId(req.params.courseId);
    const lessonId = getCourseId(req.params.lessonId);
    if (!courseId || !lessonId) {
      return res.status(400).json({ message: "Invalid course or lesson ID." });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [lessons] = await connection.execute(
        "SELECT id FROM course_lessons WHERE id = ? AND course_id = ? FOR UPDATE",
        [lessonId, courseId]
      );
      if (lessons.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Lesson not found." });
      }
      await connection.execute(
        "DELETE FROM course_lesson_progress WHERE lesson_id = ?",
        [lessonId]
      );
      await connection.execute("DELETE FROM course_lessons WHERE id = ?", [lessonId]);
      await connection.commit();
      return res.json({ message: "Lesson deleted." });
    } catch (error) {
      await connection.rollback();
      console.error("Lesson deletion failed:", error.message);
      return res.status(500).json({ message: "Unable to delete lesson." });
    } finally {
      connection.release();
    }
  }
);

async function seedCourseContentIfNeeded() {
  const [courses] = await pool.execute("SELECT id FROM courses");

  for (const course of courses) {
    const courseId = Number(course.id);
    if (!defaultCourseContent[courseId]) {
      continue;
    }

    const [materials] = await pool.execute(
      "SELECT id FROM course_materials WHERE course_id = ? LIMIT 1",
      [courseId]
    );
    if (materials.length === 0) {
      for (const material of defaultCourseContent[courseId].materials || []) {
        await pool.execute(
          "INSERT INTO course_materials (course_id, title, content) VALUES (?, ?, ?)",
          [courseId, material.title, material.content]
        );
      }
    }

    const [assignments] = await pool.execute(
      "SELECT id FROM course_assignments WHERE course_id = ? LIMIT 1",
      [courseId]
    );
    if (assignments.length === 0) {
      for (const assignment of defaultCourseContent[courseId].assignments || []) {
        await pool.execute(
          "INSERT INTO course_assignments (course_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)",
          [
            courseId,
            assignment.title,
            assignment.description,
            assignment.due_date,
            assignment.status,
          ]
        );
      }
    }

    const [quizzes] = await pool.execute(
      "SELECT id FROM course_quizzes WHERE course_id = ? LIMIT 1",
      [courseId]
    );
    if (quizzes.length === 0) {
      for (const quiz of defaultCourseContent[courseId].quizzes || []) {
        const [quizResult] = await pool.execute(
          "INSERT INTO course_quizzes (course_id, title) VALUES (?, ?)",
          [courseId, quiz.title]
        );

        for (const question of quiz.questions || []) {
          await pool.execute(
            "INSERT INTO quiz_questions (quiz_id, question, options, answer) VALUES (?, ?, ?, ?)",
            [quizResult.insertId, question.question, JSON.stringify(question.options || []), question.answer]
          );
        }
      }
    }

    const [auditRows] = await pool.execute(
      "SELECT id FROM course_audit_log WHERE course_id = ? LIMIT 1",
      [courseId]
    );
    if (auditRows.length === 0) {
      for (const entry of defaultCourseContent[courseId].audit || []) {
        const createdAt = normalizeAuditTimestamp(entry.timestamp);
        await pool.execute(
          "INSERT INTO course_audit_log (course_id, actor, action, created_at) VALUES (?, ?, ?, ?)",
          [courseId, entry.actor, entry.action, createdAt || null]
        );
      }
    }
  }
}

// Start the server.
async function startServer() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_lessons (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        course_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_lessons_course_order (course_id, sort_order)
      ) ENGINE=InnoDB
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_lesson_progress (
        user_id BIGINT UNSIGNED NOT NULL,
        lesson_id BIGINT UNSIGNED NOT NULL,
        completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, lesson_id),
        INDEX idx_lesson_progress_lesson (lesson_id)
      ) ENGINE=InnoDB
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_materials (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        course_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        file_path VARCHAR(255) NULL,
        original_filename VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_materials_course (course_id)
      ) ENGINE=InnoDB
    `);
    for (const [columnName, columnDefinition] of [
      ["file_path", "VARCHAR(255) NULL"],
      ["original_filename", "VARCHAR(255) NULL"],
    ]) {
      const [columns] = await connection.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_materials'
           AND COLUMN_NAME = ?`,
        [columnName]
      );
      if (columns.length === 0) {
        await connection.query(
          `ALTER TABLE course_materials ADD COLUMN ${columnName} ${columnDefinition}`
        );
      }
    }
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_assignments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        course_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_assignments_course (course_id)
      ) ENGINE=InnoDB
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        assignment_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_assignment_submission (assignment_id, user_id),
        INDEX idx_assignment_submissions_user (user_id)
      ) ENGINE=InnoDB
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_quizzes (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        course_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_quizzes_course (course_id)
      ) ENGINE=InnoDB
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        quiz_id BIGINT UNSIGNED NOT NULL,
        question TEXT NOT NULL,
        options JSON NOT NULL,
        answer VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_quiz_questions_quiz (quiz_id)
      ) ENGINE=InnoDB
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_audit_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        course_id BIGINT UNSIGNED NOT NULL,
        actor VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_audit_course (course_id, created_at)
      ) ENGINE=InnoDB
    `);
    connection.release();

    await seedCourseContentIfNeeded();

    console.log("MySQL connected successfully");

    app.listen(PORT, () => {
      console.log(
        `LMS backend running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
}

startServer();