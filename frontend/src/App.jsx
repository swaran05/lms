import { useState, useEffect } from "react";
import "./App.css";
import Auth from "./Auth";

const initialCourses = [
  {
    id: 1,
    title: "Full Stack Web Development",
    category: "Development",
    instructor: "Arjun Sharma",
    icon: "💻",
    color: "blue",
    progress: 75,
    lessons: 24,
    completed: 18,
  },
  {
    id: 2,
    title: "Python for Data Science",
    category: "Data Science",
    instructor: "Priya Reddy",
    icon: "🐍",
    color: "purple",
    progress: 45,
    lessons: 20,
    completed: 9,
  },
  {
    id: 3,
    title: "Database Management Systems",
    category: "Database",
    instructor: "Rahul Verma",
    icon: "🗄️",
    color: "orange",
    progress: 90,
    lessons: 15,
    completed: 14,
  },
  {
    id: 4,
    title: "Machine Learning Fundamentals",
    category: "Data Science",
    instructor: "Sneha Kumar",
    icon: "🤖",
    color: "green",
    progress: 30,
    lessons: 30,
    completed: 9,
  },
];

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
        due: "Oct 18",
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
      { id: 1, actor: "Admin", action: "Published course materials", timestamp: "2026-10-13" },
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
        due: "Oct 20",
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
      { id: 1, actor: "Admin", action: "Reviewed assessment plan", timestamp: "2026-10-12" },
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
        due: "Oct 22",
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
      { id: 1, actor: "Admin", action: "Updated database rubric", timestamp: "2026-10-11" },
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
        due: "Oct 25",
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
      { id: 1, actor: "Admin", action: "Approved learning path", timestamp: "2026-10-09" },
    ],
  },
};

async function apiRequest(authToken, path, options = {}) {
  const response = await fetch(`http://localhost:5000/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed.");
  }

  return data;
}

async function apiUpload(authToken, path, formData) {
  const response = await fetch(`http://localhost:5000/api${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "The file could not be uploaded.");
  }
  return data;
}

function mapCourses(data) {
  return data.map((course) => {
    const existingCourse = initialCourses.find(
      (item) => item.title === course.title
    );
    const courseCatalog =
      defaultCourseContent[String(course.id)] || {
        materials: [],
        assignments: [],
        quizzes: [],
        audit: [],
      };

    return {
      ...course,
      materials: course.materials ?? courseCatalog.materials,
      assignments: course.assignments ?? courseCatalog.assignments,
      quizzes: course.quizzes ?? courseCatalog.quizzes,
      audit: course.audit ?? courseCatalog.audit,
      icon: existingCourse?.icon ?? "📚",
      color: existingCourse?.color ?? "blue",
      lessons: Number(course.lesson_count ?? 0),
      completed: Number(course.completed_count ?? 0),
      progress: Number(course.progress ?? 0),
    };
  });
}

function App() {
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("lms_token")
  );

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lms_user") || "null");
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [courses, setCourses] = useState(initialCourses);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "",
    instructor: "",
    description: "",
  });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [courseLessonsLoading, setCourseLessonsLoading] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [materialForm, setMaterialForm] = useState({ title: "", content: "" });
  const [materialType, setMaterialType] = useState("text");
  const [materialFile, setMaterialFile] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [assignmentFiles, setAssignmentFiles] = useState({});
  const [quizForm, setQuizForm] = useState({
    title: "",
    question: "",
    options: ["", "", "", ""],
    answer: "",
  });
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonDraft, setLessonDraft] = useState("");
  const [courseActionError, setCourseActionError] = useState("");
  const [courseActionLoading, setCourseActionLoading] = useState(false);

  const announcements = [
    {
      id: 1,
      title: "Welcome to your LMS",
      message:
        "Explore courses and track your learning progress.",
    },
    {
      id: 2,
      title: "Keep learning every day",
      message:
        "Complete lessons regularly to reach your goals.",
    },
  ];

  const [discussion, setDiscussion] = useState([]);
  const [question, setQuestion] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittedQuizzes, setSubmittedQuizzes] = useState({});

  const [profileName, setProfileName] = useState(
    () => loggedInUser?.name || "Student"
  );
  const [profileEmail, setProfileEmail] = useState(
    () => loggedInUser?.email || ""
  );
  const [profileSaved, setProfileSaved] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseTab, setSelectedCourseTab] = useState("overview");
  const [notice, setNotice] = useState("");

  function handleLogin(token, user) {
    localStorage.setItem("lms_token", token);
    localStorage.setItem("lms_user", JSON.stringify(user));

    setAuthToken(token);
    setLoggedInUser(user);

    setProfileName(user.name);
    setProfileEmail(user.email);
  }

  function handleLogout() {
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_user");

    setAuthToken(null);
    setLoggedInUser(null);
    setActivePage("Dashboard");
    setSelectedCourse(null);
  }

  const isAdmin = loggedInUser?.role === "admin";

  async function refreshCourses(adminView = false) {
    const data = await apiRequest(
      authToken,
      adminView ? "/admin/courses" : "/courses"
    );
    const updatedCourses = mapCourses(data);
    setCourses(updatedCourses);
    setSelectedCourse((previous) =>
      previous
        ? updatedCourses.find(
            (course) => String(course.id) === String(previous.id)
          ) || previous
        : previous
    );
  }

  async function refreshCourseLessons(courseId) {
    const data = await apiRequest(
      authToken,
      `/courses/${courseId}/lessons`
    );
    setCourseLessons(data);
  }

  // Fetch courses from the Express backend and MySQL database.
  useEffect(() => {
    if (!authToken) {
      return;
    }

    let isCurrent = true;
    async function fetchCourses() {
      setCoursesLoading(true);
      try {
        const data = await apiRequest(authToken, "/courses");
        if (!isCurrent) return;
        setCourses(mapCourses(data));
        setCoursesError("");
      } catch (error) {
        if (!isCurrent) return;
        console.error("Error fetching courses:", error);
        setCoursesError(
          "Unable to load courses. Check that the backend is running."
        );
      } finally {
        if (isCurrent) setCoursesLoading(false);
      }
    }

    fetchCourses();

    return () => {
      isCurrent = false;
    };
  }, [authToken]);

  const lessonCourseId =
    selectedCourse?.id ??
    (activePage === "Manage Courses" ? editingCourseId : null);

  useEffect(() => {
    if (!lessonCourseId || !authToken) {
      return;
    }

    let isCurrent = true;
    apiRequest(authToken, `/courses/${lessonCourseId}/lessons`)
      .then((data) => {
        if (isCurrent) setCourseLessons(data);
      })
      .catch((error) => {
        if (isCurrent) setCourseActionError(error.message);
      })
      .finally(() => {
        if (isCurrent) setCourseLessonsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [lessonCourseId, authToken]);

  const navigation = [
    { name: "Dashboard", icon: "▦" },
    { name: "My Courses", icon: "▤" },
    { name: "Discussion Forum", icon: "☏" },
    { name: "Announcements", icon: "♧" },
    { name: "My Profile", icon: "○" },
    ...(isAdmin ? [{ name: "Manage Courses", icon: "⚙" }] : []),
    ...(isAdmin ? [{ name: "Audit Log", icon: "◫" }] : []),
  ];

  const courseAssignments = courses.flatMap((course) =>
    (course.assignments || []).map((assignment) => ({
      ...assignment,
      courseId: course.id,
      courseTitle: course.title,
    }))
  );

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.instructor.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || course.category === category;

    return matchesSearch && matchesCategory;
  });

  const averageProgress = Math.round(
    courses.reduce((sum, course) => sum + course.progress, 0) /
      Math.max(courses.length, 1)
  );

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  async function completeLesson(lessonId) {
    try {
      const updatedCourse = await apiRequest(
        authToken,
        `/courses/${selectedCourse.id}/lessons/${lessonId}/complete`,
        { method: "POST" }
      );
      const updatedValues = {
        lessons: Number(updatedCourse.lesson_count),
        completed: Number(updatedCourse.completed_count),
        progress: Number(updatedCourse.progress),
      };
      setCourses((previous) =>
        previous.map((course) =>
          Number(course.id) === Number(updatedCourse.id)
            ? { ...course, ...updatedValues }
            : course
        )
      );
      setSelectedCourse((previous) =>
        previous ? { ...previous, ...updatedValues } : previous
      );
      await refreshCourseLessons(selectedCourse.id);
      showNotice("Lesson completed. Your progress is saved.");
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  function resetCourseForm() {
    setCourseForm({ title: "", category: "", instructor: "", description: "" });
    setEditingCourseId(null);
    setCourseLessons([]);
    setCourseLessonsLoading(false);
    setNewLessonTitle("");
    setMaterialForm({ title: "", content: "" });
    setMaterialType("text");
    setMaterialFile(null);
    setAssignmentForm({ title: "", description: "", due_date: "" });
    setAssignmentFiles({});
    setQuizForm({ title: "", question: "", options: ["", "", "", ""], answer: "" });
    setCourseActionError("");
  }

  function openCourse(course) {
    setSelectedCourse(course);
    setSelectedCourseTab("overview");
    setCourseLessons([]);
    setCourseLessonsLoading(true);
    setCourseActionError("");
  }

  async function submitAssignment(assignmentId) {
    const file = assignmentFiles[assignmentId];
    if (!file || !selectedCourse) return;

    const formData = new FormData();
    formData.append("file", file);
    setCourseActionError("");
    try {
      await apiUpload(
        authToken,
        `/courses/${selectedCourse.id}/assignments/${assignmentId}/submissions`,
        formData
      );
      setAssignmentFiles((previous) => ({ ...previous, [assignmentId]: null }));
      await refreshCourses(isAdmin);
      showNotice("Assignment PDF submitted.");
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function downloadCoursePdf(path, filename) {
    setCourseActionError("");
    try {
      const response = await fetch(`http://localhost:5000/api${path}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to download PDF.");
      }

      const pdfUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  function editCourse(course) {
    setEditingCourseId(course.id);
    setCourseLessons([]);
    setCourseLessonsLoading(true);
    setNewLessonTitle("");
    setMaterialForm({ title: "", content: "" });
    setMaterialType("text");
    setMaterialFile(null);
    setAssignmentForm({ title: "", description: "", due_date: "" });
    setQuizForm({ title: "", question: "", options: ["", "", "", ""], answer: "" });
    setCourseForm({
      title: course.title,
      category: course.category,
      instructor: course.instructor,
      description: course.description || "",
    });
    setCourseActionError("");
  }

  async function saveCourse(event) {
    event.preventDefault();
    setCourseActionError("");
    setCourseActionLoading(true);
    try {
      const isEditing = editingCourseId !== null;
      const result = await apiRequest(
        authToken,
        isEditing ? `/admin/courses/${editingCourseId}` : "/admin/courses",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(courseForm),
        }
      );
      if (result.id) {
        setEditingCourseId(result.id);
        setCourseLessons([]);
        setCourseLessonsLoading(true);
      }
      await refreshCourses(true);
      showNotice(isEditing ? "Course updated." : "Course created.");
    } catch (error) {
      setCourseActionError(error.message);
    } finally {
      setCourseActionLoading(false);
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete “${course.title}” and its lessons?`)) return;

    setCourseActionError("");
    try {
      await apiRequest(authToken, `/admin/courses/${course.id}`, {
        method: "DELETE",
      });
      if (Number(editingCourseId) === Number(course.id)) resetCourseForm();
      await refreshCourses(true);
      showNotice("Course deleted.");
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function addLesson(event) {
    event.preventDefault();
    if (!editingCourseId) return;

    setCourseActionError("");
    try {
      await apiRequest(authToken, `/admin/courses/${editingCourseId}/lessons`, {
        method: "POST",
        body: JSON.stringify({ title: newLessonTitle }),
      });
      setNewLessonTitle("");
      await Promise.all([refreshCourseLessons(editingCourseId), refreshCourses(true)]);
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function addCourseMaterial(event) {
    event.preventDefault();
    const courseId = selectedCourse?.id ?? editingCourseId;
    if (!courseId) return;

    setCourseActionError("");
    try {
      if (materialType === "pdf") {
        if (!materialFile) {
          throw new Error("Choose a PDF file to upload.");
        }
        const formData = new FormData();
        formData.append("title", materialForm.title);
        formData.append("file", materialFile);
        await apiUpload(
          authToken,
          `/admin/courses/${courseId}/materials/pdf`,
          formData
        );
      } else {
        await apiRequest(authToken, `/admin/courses/${courseId}/materials`, {
          method: "POST",
          body: JSON.stringify(materialForm),
        });
      }
      setMaterialForm({ title: "", content: "" });
      setMaterialFile(null);
      await refreshCourses(true);
      showNotice(materialType === "pdf" ? "PDF material uploaded." : "Learning material added to the course.");
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function addCourseAssignment(event) {
    event.preventDefault();
    const courseId = selectedCourse?.id ?? editingCourseId;
    if (!courseId) return;

    setCourseActionError("");
    try {
      await apiRequest(authToken, `/admin/courses/${courseId}/assignments`, {
        method: "POST",
        body: JSON.stringify(assignmentForm),
      });
      setAssignmentForm({ title: "", description: "", due_date: "" });
      await refreshCourses(true);
      showNotice("Assignment added to the course.");
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function addCourseQuiz(event) {
    event.preventDefault();
    if (!selectedCourse) return;

    setCourseActionError("");
    try {
      await apiRequest(authToken, `/admin/courses/${selectedCourse.id}/quizzes`, {
        method: "POST",
        body: JSON.stringify({
          title: quizForm.title,
          questions: [{
            question: quizForm.question,
            options: quizForm.options,
            answer: quizForm.answer,
          }],
        }),
      });
      setQuizForm({ title: "", question: "", options: ["", "", "", ""], answer: "" });
      await refreshCourses(true);
      showNotice("Quiz added to the course.");
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function deleteCourseContent(type, itemId) {
    const courseId = selectedCourse?.id ?? editingCourseId;
    if (!courseId) return;
    const isMaterial = type === "materials";
    if (!window.confirm(`Delete this ${isMaterial ? "learning material" : "assignment"}?`)) {
      return;
    }

    setCourseActionError("");
    try {
      await apiRequest(
        authToken,
        `/admin/courses/${courseId}/${type}/${itemId}`,
        { method: "DELETE" }
      );
      await refreshCourses(true);
      showNotice(`${isMaterial ? "Learning material" : "Assignment"} deleted.`);
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function saveLesson(lessonId) {
    setCourseActionError("");
    try {
      await apiRequest(
        authToken,
        `/admin/courses/${editingCourseId}/lessons/${lessonId}`,
        {
          method: "PUT",
          body: JSON.stringify({ title: lessonDraft }),
        }
      );
      setEditingLessonId(null);
      await refreshCourseLessons(editingCourseId);
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  async function deleteLesson(lessonId) {
    if (!window.confirm("Delete this lesson and its learner completion records?")) return;

    setCourseActionError("");
    try {
      await apiRequest(
        authToken,
        `/admin/courses/${editingCourseId}/lessons/${lessonId}`,
        { method: "DELETE" }
      );
      await Promise.all([refreshCourseLessons(editingCourseId), refreshCourses(true)]);
    } catch (error) {
      setCourseActionError(error.message);
    }
  }

  function postQuestion(event) {
    event.preventDefault();

    if (!question.trim()) return;

    setDiscussion((previous) => [
      {
        id: Date.now(),
        message: question.trim(),
        author: profileName || "Student",
      },
      ...previous,
    ]);

    setQuestion("");
    showNotice("Your discussion post was added!");
  }

  function renderCourses() {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">YOUR LEARNING LIBRARY</span>
            <h1>My Courses</h1>
            <p>Explore your courses and continue learning.</p>
            {!isAdmin && (
              <p className="muted">
                Adding materials, quizzes, and assignments requires an administrator account.
              </p>
            )}
          </div>
          <span className="soft-badge">
            {courses.length} courses
          </span>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses or instructors..."
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter courses by category"
          >
            <option>All</option>
            {[...new Set(courses.map((course) => course.category))]
              .sort()
              .map((courseCategory) => (
                <option key={courseCategory}>{courseCategory}</option>
              ))}
          </select>
        </div>

        {coursesLoading ? (
          <p>Loading courses from database...</p>
        ) : coursesError ? (
          <p role="alert">{coursesError}</p>
        ) : (
          <div className="course-grid">
            {filteredCourses.map((course) => (
              <article className="course-card" key={course.id}>
                <div className={`course-art ${course.color}`}>
                  <span className="course-emoji">{course.icon}</span>
                  <span className="art-label">{course.category}</span>
                </div>

                <div className="course-body">
                  <h3>{course.title}</h3>
                  <p className="instructor">
                    By {course.instructor}
                  </p>

                  <div className="course-meta">
                    <span>{course.lessons} lessons</span>
                    <span>{course.progress}% complete</span>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>

                  <button
                    className="primary-button full-button"
                    onClick={() => openCourse(course)}
                  >
                    {course.progress === 100
                      ? "Review Course"
                      : "Continue Learning"}
                    <span>→</span>
                  </button>
                  {isAdmin && (
                    <button
                      className="small-button full-button"
                      type="button"
                      onClick={() => {
                        openCourse(course);
                        setSelectedCourseTab("materials");
                      }}
                    >
                      Add course content
                    </button>
                  )}
                </div>
              </article>
            ))}

            {filteredCourses.length === 0 && (
              <div className="empty-state">
                <span>⌕</span>
                <h3>No courses found</h3>
                <p>Try another search or category.</p>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  function renderCourseManager() {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Manage courses</h1>
            <p>Create courses, organize lessons, and update the catalog.</p>
          </div>
          <button className="primary-button" onClick={resetCourseForm}>
            New course
          </button>
        </div>

        <div className="course-admin-grid">
          <section className="panel course-admin-form-panel">
            <h2>{editingCourseId ? "Edit course" : "Course details"}</h2>
            <form className="course-admin-form" onSubmit={saveCourse}>
              <label>
                Course title
                <input
                  value={courseForm.title}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, title: event.target.value })
                  }
                  maxLength={255}
                  required
                />
              </label>
              <label>
                Category
                <input
                  value={courseForm.category}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, category: event.target.value })
                  }
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Instructor
                <input
                  value={courseForm.instructor}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, instructor: event.target.value })
                  }
                  maxLength={150}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={courseForm.description}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, description: event.target.value })
                  }
                  maxLength={2000}
                  rows={4}
                />
              </label>
              {courseActionError && (
                <p className="course-action-error" role="alert">
                  {courseActionError}
                </p>
              )}
              <div className="button-row course-admin-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={courseActionLoading}
                >
                  {courseActionLoading
                    ? "Saving..."
                    : editingCourseId
                      ? "Save changes"
                      : "Create course"}
                </button>
                {editingCourseId && (
                  <button
                    className="small-button"
                    type="button"
                    onClick={resetCourseForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {editingCourseId && (
              <>
                <div className="lesson-manager">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">CURRICULUM</span>
                      <h2>Lessons</h2>
                    </div>
                    <span className="soft-badge">
                      {courseLessons.length} lessons
                    </span>
                  </div>
                  <form className="lesson-add-form" onSubmit={addLesson}>
                    <input
                      value={newLessonTitle}
                      onChange={(event) => setNewLessonTitle(event.target.value)}
                      placeholder="Lesson title"
                      maxLength={255}
                      required
                    />
                    <button className="primary-button" type="submit">
                      Add lesson
                    </button>
                  </form>
                  {courseLessonsLoading ? (
                    <p className="muted">Loading lessons...</p>
                  ) : courseLessons.length === 0 ? (
                    <p className="muted">Add the first lesson to this course.</p>
                  ) : (
                    <div className="admin-lesson-list">
                      {courseLessons.map((lesson) => (
                        <div className="admin-lesson-row" key={lesson.id}>
                          {editingLessonId === lesson.id ? (
                            <input
                              value={lessonDraft}
                              onChange={(event) => setLessonDraft(event.target.value)}
                              maxLength={255}
                              aria-label="Lesson title"
                            />
                          ) : (
                            <span>{lesson.title}</span>
                          )}
                          <div className="course-row-actions">
                            {editingLessonId === lesson.id ? (
                              <button
                                className="text-button"
                                type="button"
                                onClick={() => saveLesson(lesson.id)}
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                className="text-button"
                                type="button"
                                onClick={() => {
                                  setEditingLessonId(lesson.id);
                                  setLessonDraft(lesson.title);
                                }}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              className="danger-text-button"
                              type="button"
                              onClick={() => deleteLesson(lesson.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lesson-manager">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">COURSE CONTENT</span>
                      <h2>Learning materials</h2>
                    </div>
                    <span className="soft-badge">
                      {courses.find((course) => String(course.id) === String(editingCourseId))
                        ?.materials?.length || 0} materials
                    </span>
                  </div>
                  <form className="course-admin-form" onSubmit={addCourseMaterial}>
                    <label>
                      Material type
                      <select
                        value={materialType}
                        onChange={(event) => setMaterialType(event.target.value)}
                      >
                        <option value="text">Text</option>
                        <option value="pdf">PDF file</option>
                      </select>
                    </label>
                    <label>
                      Material title
                      <input
                        value={materialForm.title}
                        onChange={(event) =>
                          setMaterialForm({ ...materialForm, title: event.target.value })
                        }
                        maxLength={255}
                        required
                      />
                    </label>
                    {materialType === "text" ? (
                      <label>
                        Material content
                        <textarea
                          value={materialForm.content}
                          onChange={(event) =>
                            setMaterialForm({ ...materialForm, content: event.target.value })
                          }
                          rows={4}
                          required
                        />
                      </label>
                    ) : (
                      <label>
                        PDF file (maximum 10 MB)
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(event) => setMaterialFile(event.target.files[0] || null)}
                          required
                        />
                      </label>
                    )}
                    <button className="primary-button" type="submit">
                      Add learning material
                    </button>
                  </form>
                  <div className="admin-lesson-list">
                    {(courses.find((course) => String(course.id) === String(editingCourseId))
                      ?.materials || []).map((material) => (
                      <div className="admin-lesson-row" key={material.id}>
                        <span>
                          <strong>{material.title}</strong>
                          <br />
                          {material.hasPdf ? material.fileName : material.content}
                        </span>
                        <div className="course-row-actions">
                          {material.hasPdf && (
                            <button
                              className="text-button"
                              type="button"
                              onClick={() =>
                                downloadCoursePdf(
                                  `/courses/${editingCourseId}/materials/${material.id}/pdf`,
                                  material.fileName
                                )
                              }
                            >
                              Download
                            </button>
                          )}
                          <button
                            className="danger-text-button"
                            type="button"
                            onClick={() => deleteCourseContent("materials", material.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lesson-manager">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">COURSEWORK</span>
                      <h2>Assignments</h2>
                    </div>
                    <span className="soft-badge">
                      {courses.find((course) => String(course.id) === String(editingCourseId))
                        ?.assignments?.length || 0} assignments
                    </span>
                  </div>
                  <form className="course-admin-form" onSubmit={addCourseAssignment}>
                    <label>
                      Assignment title
                      <input
                        value={assignmentForm.title}
                        onChange={(event) =>
                          setAssignmentForm({ ...assignmentForm, title: event.target.value })
                        }
                        maxLength={255}
                        required
                      />
                    </label>
                    <label>
                      Instructions
                      <textarea
                        value={assignmentForm.description}
                        onChange={(event) =>
                          setAssignmentForm({
                            ...assignmentForm,
                            description: event.target.value,
                          })
                        }
                        rows={4}
                        required
                      />
                    </label>
                    <label>
                      Due date
                      <input
                        type="date"
                        value={assignmentForm.due_date}
                        onChange={(event) =>
                          setAssignmentForm({ ...assignmentForm, due_date: event.target.value })
                        }
                        required
                      />
                    </label>
                    <button className="primary-button" type="submit">
                      Add assignment
                    </button>
                  </form>
                  <div className="admin-lesson-list">
                    {(courses.find((course) => String(course.id) === String(editingCourseId))
                      ?.assignments || []).map((assignment) => (
                      <div className="admin-lesson-row" key={assignment.id}>
                        <span>
                          <strong>{assignment.title}</strong>
                          <br />
                          {assignment.description} · Due {assignment.due}
                        </span>
                        <button
                          className="danger-text-button"
                          type="button"
                          onClick={() => deleteCourseContent("assignments", assignment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="panel course-admin-list-panel">
            <div className="panel-heading">
              <h2>Course catalog</h2>
              <span className="soft-badge">{courses.length} courses</span>
            </div>
            {coursesLoading ? (
              <p className="muted">Loading courses...</p>
            ) : coursesError ? (
              <p className="course-action-error" role="alert">
                {coursesError}
              </p>
            ) : courses.length === 0 ? (
              <p className="muted">No courses yet. Create the first one.</p>
            ) : (
              <div className="admin-course-list">
                {courses.map((course) => (
                  <article className="admin-course-row" key={course.id}>
                    <div className="admin-course-info">
                      <span className="eyebrow">{course.category}</span>
                      <h3>{course.title}</h3>
                      <p>{course.instructor} · {course.lessons} lessons</p>
                    </div>
                    <div className="course-row-actions">
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => editCourse(course)}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-text-button"
                        type="button"
                        onClick={() => deleteCourse(course)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </>
    );
  }

  function renderAuditLog() {
    const auditEntries = Object.entries(defaultCourseContent).flatMap(
      ([courseId, content]) =>
        (content.audit || []).map((entry) => ({
          ...entry,
          courseId: Number(courseId),
          courseTitle:
            courses.find((course) => Number(course.id) === Number(courseId))?.title ||
            `Course ${courseId}`,
        }))
    );

    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">SECURITY AND TRACKING</span>
            <h1>Audit log</h1>
            <p>Review the latest administrative actions across all courses.</p>
          </div>
        </div>

        <section className="panel audit-panel">
          {auditEntries.length === 0 ? (
            <p className="muted">No audit activity has been logged yet.</p>
          ) : (
            <div className="audit-log-list">
              {auditEntries.map((entry) => (
                <article className="audit-log-item" key={`${entry.courseId}-${entry.id}`}>
                  <div className="audit-log-icon">◫</div>
                  <div className="audit-log-copy">
                    <div className="audit-log-head">
                      <strong>{entry.courseTitle}</strong>
                      <span>{entry.timestamp}</span>
                    </div>
                    <p>{entry.action}</p>
                    <small>Actor: {entry.actor}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderDiscussion() {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">LEARN TOGETHER</span>
            <h1>Discussion Forum</h1>
            <p>Ask questions and share your learning journey.</p>
          </div>
        </div>

        <section className="panel">
          <h2>Start a discussion</h2>

          <form className="discussion-form" onSubmit={postQuestion}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What would you like to ask or share?"
              rows="4"
              required
            />

            <button className="primary-button" type="submit">
              Post question
            </button>
          </form>

          <div className="discussion-list">
            {discussion.length === 0 ? (
              <div className="empty-state">
                <span>☏</span>
                <h3>Start the conversation</h3>
                <p>Your posts will appear here.</p>
              </div>
            ) : (
              discussion.map((post) => (
                <article
                  className="discussion-post"
                  key={post.id}
                >
                  <div className="avatar small-avatar">
                    {post.author.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{post.author}</h3>
                    <p>{post.message}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </>
    );
  }
    function renderAnnouncements() {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">LATEST UPDATES</span>
            <h1>Announcements</h1>
            <p>Important learning updates in one place.</p>
          </div>
        </div>

        <section className="panel">
          {announcements.map((announcement) => (
            <article
              className="announcement"
              key={announcement.id}
            >
              <div className="announcement-icon">♧</div>
              <div>
                <h3>{announcement.title}</h3>
                <p>{announcement.message}</p>
              </div>
            </article>
          ))}
        </section>
      </>
    );
  }

  function renderProfile() {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">{isAdmin ? "ADMINISTRATION" : "YOUR ACCOUNT"}</span>
            <h1>{isAdmin ? "Admin Profile" : "My Profile"}</h1>
            <p>
              {isAdmin
                ? "Manage your administrator profile and access."
                : "View and edit your student details."}
            </p>
          </div>
        </div>

        <section className="panel profile-panel">
          <div className="profile-avatar">
            {profileName.charAt(0).toUpperCase()}
          </div>

          <h2>{isAdmin ? "Administrator Profile" : "Student Profile"}</h2>
          <span className={`profile-role-badge ${isAdmin ? "admin" : ""}`}>
            {isAdmin ? "ADMINISTRATOR" : "STUDENT"}
          </span>
          <p className="muted">
            {isAdmin
              ? "Administrator access lets you manage courses, learning materials, assignments, and quizzes."
              : "Update the details displayed in your demo."}
          </p>

          <form
            className="profile-form"
            onSubmit={(event) => {
              event.preventDefault();
              setProfileSaved(true);
              showNotice("Profile updated in this demo.");
            }}
          >
            <label>
              Full name
              <input
                value={profileName}
                onChange={(event) => {
                  setProfileName(event.target.value);
                  setProfileSaved(false);
                }}
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                value={profileEmail}
                onChange={(event) => {
                  setProfileEmail(event.target.value);
                  setProfileSaved(false);
                }}
                required
              />
            </label>

            <button className="primary-button" type="submit">
              Save changes
            </button>

            {profileSaved && (
              <p className="success-text">
                Changes saved locally.
              </p>
            )}
          </form>

          {isAdmin && (
            <div className="admin-profile-actions">
              <h3>Administrator tools</h3>
              <div className="button-row">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setActivePage("Manage Courses")}
                >
                  Manage courses
                </button>
                <button
                  className="small-button"
                  type="button"
                  onClick={() => setActivePage("Audit Log")}
                >
                  View audit log
                </button>
              </div>
            </div>
          )}
        </section>
      </>
    );
  }

  function renderDashboard() {
    return (
      <>
        <section className="welcome-banner">
          <div className="welcome-copy">
            <span className="welcome-label">
              YOUR LEARNING SPACE
            </span>

            <h1>Welcome back, {profileName || "Student"}! 👋</h1>

            <p>
              Every lesson brings you one step closer to your goals.
              Keep learning and make today count.
            </p>

            <button
              className="banner-button"
              onClick={() => setActivePage("My Courses")}
            >
              Explore my courses <span>→</span>
            </button>
          </div>

          <div className="welcome-art" aria-hidden="true">
            <div className="art-circle circle-one" />
            <div className="art-circle circle-two" />
            <div className="book-stack">
              <span>📚</span>
            </div>
            <div className="floating-star">✦</div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon blue-bg">▤</span>
              <span className="stat-tag">Enrolled</span>
            </div>
            <strong>{courses.length}</strong>
            <p>My courses</p>
            <span className="stat-caption">
              Your learning library
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon purple-bg">✓</span>
              <span className="stat-tag">Overall</span>
            </div>
            <strong>{averageProgress}%</strong>
            <p>Average progress</p>
            <span className="stat-caption">
              Across all demo courses
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon orange-bg">☷</span>
              <span className="stat-tag">To do</span>
            </div>
            <strong>
              {
                courseAssignments.filter(
                  (item) => item.status === "Pending"
                ).length
              }
            </strong>
            <p>Pending assignments</p>
            <span className="stat-caption">
              Keep an eye on deadlines
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon green-bg">★</span>
              <span className="stat-tag">Keep going</span>
            </div>
            <strong>
              {courses.reduce(
                (sum, course) => sum + course.completed,
                0
              )}
            </strong>
            <p>Lessons completed</p>
            <span className="stat-caption">
              Across your courses
            </span>
          </article>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                PICK UP WHERE YOU LEFT OFF
              </span>
              <h2>Continue learning</h2>
            </div>

            <button
              className="text-button"
              onClick={() => setActivePage("My Courses")}
            >
              View all courses →
            </button>
          </div>

          {coursesLoading ? (
            <p>Loading courses from database...</p>
          ) : coursesError ? (
            <p role="alert">{coursesError}</p>
          ) : (
            <div className="course-grid">
              {courses.slice(0, 3).map((course) => (
                <article className="course-card" key={course.id}>
                  <div className={`course-art ${course.color}`}>
                    <span className="course-emoji">
                      {course.icon}
                    </span>
                    <span className="art-label">
                      {course.category}
                    </span>
                  </div>

                  <div className="course-body">
                    <h3>{course.title}</h3>
                    <p className="instructor">
                      By {course.instructor}
                    </p>

                    <div className="course-meta">
                      <span>
                        {course.completed}/{course.lessons} lessons
                      </span>
                      <span>{course.progress}%</span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${course.progress}%`,
                        }}
                      />
                    </div>

                    <button
                      className="primary-button full-button"
                      onClick={() => openCourse(course)}
                    >
                      Continue Learning <span>→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">DON'T MISS OUT</span>
                <h2>Upcoming assignments</h2>
              </div>

              <button
                className="text-button"
                onClick={() => setActivePage("My Courses")}
              >
                View courses →
              </button>
            </div>

            <p className="muted">
              Open a course to view its assignments and submit your work.
            </p>
          </div>

          <div className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">STAY INFORMED</span>
                <h2>Announcements</h2>
              </div>

              <button
                className="text-button"
                onClick={() => setActivePage("Announcements")}
              >
                See all →
              </button>
            </div>

            {announcements.slice(0, 2).map((announcement) => (
              <div
                className="announcement compact-announcement"
                key={announcement.id}
              >
                <div className="announcement-icon">♧</div>
                <div>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }
    function renderContent() {
    switch (activePage) {
      case "My Courses":
        return renderCourses();

      case "Discussion Forum":
        return renderDiscussion();

      case "Announcements":
        return renderAnnouncements();

      case "My Profile":
        return renderProfile();

      case "Manage Courses":
        return isAdmin ? renderCourseManager() : renderDashboard();

      case "Audit Log":
        return isAdmin ? renderAuditLog() : renderDashboard();

      default:
        return renderDashboard();
    }
  }

  if (!authToken || !loggedInUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setActivePage("Dashboard")}
          aria-label="Go to dashboard"
        >
          <span className="brand-mark">L</span>
          <span>
            LearnSpace<span className="brand-dot">.</span>
          </span>
        </button>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>

            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">✦</span>
            <h3>Keep growing!</h3>
            <p>
              Small steps every day lead to big achievements.
            </p>
            <button
              onClick={() => setActivePage("My Courses")}
              className="help-link"
            >
              Find a lesson →
            </button>
          </div>

          <div className="sidebar-user">
            <div className="avatar">
              {profileName.charAt(0).toUpperCase()}
            </div>

            <div className="user-details">
              <strong>{profileName || "Student"}</strong>
              <span>{isAdmin ? "Administrator account" : "Student account"}</span>
            </div>

            <button
              className="more-button"
              aria-label="Open profile"
              onClick={() => setActivePage("My Profile")}
            >
              ⋯
            </button>
          </div>

        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <span className="today-label">
              LEARN AT YOUR OWN PACE
            </span>

            <button
              className="notification-button"
              aria-label="View announcements"
              onClick={() => setActivePage("Announcements")}
            >
              ♧
              <span className="notification-dot" />
            </button>

            <button
              className="topbar-profile"
              onClick={() => setActivePage("My Profile")}
            >
              <div className="avatar small-avatar">
                {profileName.charAt(0).toUpperCase()}
              </div>
              <span>{profileName}</span>
              <span>⌄</span>
            </button>
          </div>
        </header>

        <div className="page-content">{renderContent()}</div>

        <footer className="footer">
          <span>© 2026 LearnSpace LMS</span>
          <span>Learn something new every day.</span>
        </footer>
      </main>

      {selectedCourse && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCourse(null);
            }
          }}
        >
          <section
            className="course-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-modal-title"
          >
            <button
              className="modal-close"
              onClick={() => setSelectedCourse(null)}
              aria-label="Close course details"
            >
              ×
            </button>

            <div className={`modal-art ${selectedCourse.color}`}>
              <span>{selectedCourse.icon}</span>
            </div>

            <span className="eyebrow">
              {selectedCourse.category}
            </span>

            <h2 id="course-modal-title">
              {selectedCourse.title}
            </h2>

            <p className="muted">
              Instructor: {selectedCourse.instructor}
            </p>
            {selectedCourse.description && <p>{selectedCourse.description}</p>}
            {!isAdmin && selectedCourseTab !== "overview" && (
              <p className="admin-only-note">
                Only administrators can add or remove this course content.
              </p>
            )}

            <div className="course-modal-tabs">
              <button
                className={selectedCourseTab === "overview" ? "active" : ""}
                type="button"
                onClick={() => setSelectedCourseTab("overview")}
              >
                Overview
              </button>
              <button
                className={selectedCourseTab === "materials" ? "active" : ""}
                type="button"
                onClick={() => setSelectedCourseTab("materials")}
              >
                Materials
              </button>
              <button
                className={selectedCourseTab === "assignments" ? "active" : ""}
                type="button"
                onClick={() => setSelectedCourseTab("assignments")}
              >
                Assignments
              </button>
              <button
                className={selectedCourseTab === "quizzes" ? "active" : ""}
                type="button"
                onClick={() => setSelectedCourseTab("quizzes")}
              >
                Quizzes
              </button>
            </div>

            {courseActionError && (
              <p className="course-action-error" role="alert">
                {courseActionError}
              </p>
            )}

            {selectedCourseTab === "overview" && (
              <>
                <div className="course-meta">
                  <span>
                    {selectedCourse.completed}/{selectedCourse.lessons} lessons
                  </span>
                  <span>{selectedCourse.progress}% complete</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${selectedCourse.progress}%`,
                    }}
                  />
                </div>

                {courseActionError && (
                  <p className="course-action-error" role="alert">
                    {courseActionError}
                  </p>
                )}

                <div className="course-lesson-list">
                  <h3>Course lessons</h3>
                  {courseLessonsLoading ? (
                    <p className="muted">Loading lessons...</p>
                  ) : courseLessons.length === 0 ? (
                    <p className="muted">
                      No lessons have been added to this course yet.
                    </p>
                  ) : (
                    courseLessons.map((lesson) => (
                      <label className="course-lesson" key={lesson.id}>
                        <input
                          type="checkbox"
                          checked={Boolean(lesson.completed)}
                          disabled={Boolean(lesson.completed)}
                          onChange={() => completeLesson(lesson.id)}
                        />
                        <span>{lesson.title}</span>
                        {Boolean(lesson.completed) && (
                          <span className="lesson-complete-label">Complete</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </>
            )}

            {selectedCourseTab === "materials" && (
              <div className="course-accordion-list">
                {isAdmin && (
                  <form className="course-admin-form course-content-form" onSubmit={addCourseMaterial}>
                    <h3>Add learning material to {selectedCourse.title}</h3>
                    <label>
                      Material type
                      <select
                        value={materialType}
                        onChange={(event) => setMaterialType(event.target.value)}
                      >
                        <option value="text">Text</option>
                        <option value="pdf">PDF file</option>
                      </select>
                    </label>
                    <label>
                      Material title
                      <input
                        value={materialForm.title}
                        onChange={(event) =>
                          setMaterialForm({ ...materialForm, title: event.target.value })
                        }
                        maxLength={255}
                        required
                      />
                    </label>
                    {materialType === "text" ? (
                      <label>
                        Content
                        <textarea
                          value={materialForm.content}
                          onChange={(event) =>
                            setMaterialForm({ ...materialForm, content: event.target.value })
                          }
                          rows={4}
                          required
                        />
                      </label>
                    ) : (
                      <label>
                        PDF file (maximum 10 MB)
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(event) => setMaterialFile(event.target.files[0] || null)}
                          required
                        />
                      </label>
                    )}
                    <button className="primary-button" type="submit">Add material</button>
                  </form>
                )}
                {(selectedCourse.materials || []).length === 0 ? (
                  <p className="muted">No learning materials have been added to this course yet.</p>
                ) : (
                  selectedCourse.materials.map((material) => (
                    <article className="course-material-item" key={material.id}>
                      <h3>{material.title}</h3>
                      {material.hasPdf ? (
                        <button
                          className="text-button"
                          type="button"
                          onClick={() =>
                            downloadCoursePdf(
                              `/courses/${selectedCourse.id}/materials/${material.id}/pdf`,
                              material.fileName
                            )
                          }
                        >
                          Download PDF: {material.fileName}
                        </button>
                      ) : (
                        <p>{material.content}</p>
                      )}
                      {isAdmin && (
                        <button
                          className="danger-text-button"
                          type="button"
                          onClick={() => deleteCourseContent("materials", material.id)}
                        >
                          Delete material
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            )}

            {selectedCourseTab === "assignments" && (
              <div className="course-accordion-list">
                {isAdmin && (
                  <form className="course-admin-form course-content-form" onSubmit={addCourseAssignment}>
                    <h3>Add assignment to {selectedCourse.title}</h3>
                    <label>
                      Assignment title
                      <input
                        value={assignmentForm.title}
                        onChange={(event) =>
                          setAssignmentForm({ ...assignmentForm, title: event.target.value })
                        }
                        maxLength={255}
                        required
                      />
                    </label>
                    <label>
                      Instructions
                      <textarea
                        value={assignmentForm.description}
                        onChange={(event) =>
                          setAssignmentForm({
                            ...assignmentForm,
                            description: event.target.value,
                          })
                        }
                        rows={4}
                        required
                      />
                    </label>
                    <label>
                      Due date
                      <input
                        type="date"
                        value={assignmentForm.due_date}
                        onChange={(event) =>
                          setAssignmentForm({
                            ...assignmentForm,
                            due_date: event.target.value,
                          })
                        }
                        required
                      />
                    </label>
                    <button className="primary-button" type="submit">Add assignment</button>
                  </form>
                )}
                {(selectedCourse.assignments || []).length === 0 ? (
                  <p className="muted">No assignments have been added to this course yet.</p>
                ) : (
                  selectedCourse.assignments.map((assignment) => (
                    <article className="course-material-item" key={assignment.id}>
                      <h3>{assignment.title}</h3>
                      <p>{assignment.description}</p>
                      <div className="course-meta small-meta">
                        <span>Due: {assignment.due}</span>
                        <span className={`status ${assignment.status === "Submitted" ? "submitted" : "pending"}`}>
                          {assignment.status}
                        </span>
                      </div>
                      {!isAdmin && (
                        <form
                          className="assignment-upload-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitAssignment(assignment.id);
                          }}
                        >
                          <label>
                            {assignment.submission
                              ? "Replace your PDF submission"
                              : "Submit your work as a PDF (maximum 10 MB)"}
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={(event) =>
                                setAssignmentFiles((previous) => ({
                                  ...previous,
                                  [assignment.id]: event.target.files[0] || null,
                                }))
                              }
                              required
                            />
                          </label>
                          <button
                            className="small-button"
                            type="submit"
                            disabled={!assignmentFiles[assignment.id]}
                          >
                            {assignment.submission ? "Replace submission" : "Upload submission"}
                          </button>
                        </form>
                      )}
                      {assignment.submission && (
                        <div className="submission-details">
                          <span>
                            {isAdmin
                              ? `${assignment.submission.studentName} (${assignment.submission.studentEmail})`
                              : `Submitted: ${assignment.submission.fileName}`}
                          </span>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() =>
                              downloadCoursePdf(
                                `/courses/${selectedCourse.id}/assignments/${assignment.id}/submissions/${assignment.submission.id}/pdf`,
                                assignment.submission.fileName
                              )
                            }
                          >
                            {isAdmin ? "Download submission" : "Download my submission"}
                          </button>
                        </div>
                      )}
                      {(assignment.submissions || []).map((submission) => (
                        <div className="submission-details" key={submission.id}>
                          <span>
                            {submission.studentName} ({submission.studentEmail}) — {submission.fileName}
                          </span>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() =>
                              downloadCoursePdf(
                                `/courses/${selectedCourse.id}/assignments/${assignment.id}/submissions/${submission.id}/pdf`,
                                submission.fileName
                              )
                            }
                          >
                            Download submission
                          </button>
                        </div>
                      ))}
                      {isAdmin && (
                        <button
                          className="danger-text-button"
                          type="button"
                          onClick={() => deleteCourseContent("assignments", assignment.id)}
                        >
                          Delete assignment
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            )}

            {selectedCourseTab === "quizzes" && (
              <div className="course-accordion-list">
                {isAdmin && (
                  <form className="course-admin-form course-content-form" onSubmit={addCourseQuiz}>
                    <h3>Add quiz to {selectedCourse.title}</h3>
                    <label>
                      Quiz title
                      <input
                        value={quizForm.title}
                        onChange={(event) =>
                          setQuizForm({ ...quizForm, title: event.target.value })
                        }
                        maxLength={255}
                        required
                      />
                    </label>
                    <label>
                      Question
                      <textarea
                        value={quizForm.question}
                        onChange={(event) =>
                          setQuizForm({ ...quizForm, question: event.target.value })
                        }
                        rows={3}
                        required
                      />
                    </label>
                    {quizForm.options.map((option, index) => (
                      <label key={index}>
                        Answer option {index + 1}
                        <input
                          value={option}
                          onChange={(event) =>
                            setQuizForm((previous) => ({
                              ...previous,
                              options: previous.options.map((item, itemIndex) =>
                                itemIndex === index ? event.target.value : item
                              ),
                            }))
                          }
                          required
                        />
                      </label>
                    ))}
                    <label>
                      Correct answer
                      <select
                        value={quizForm.answer}
                        onChange={(event) =>
                          setQuizForm({ ...quizForm, answer: event.target.value })
                        }
                        required
                      >
                        <option value="">Choose correct answer</option>
                        {quizForm.options.filter(Boolean).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <button className="primary-button" type="submit">Add quiz</button>
                  </form>
                )}
                {(selectedCourse.quizzes || []).length === 0 ? (
                  <p className="muted">No quizzes have been added to this course yet.</p>
                ) : (
                  selectedCourse.quizzes.map((quiz) => {
                    const quizKey = `${selectedCourse.id}-${quiz.id}`;
                    const quizIsSubmitted = Boolean(submittedQuizzes[quizKey]);

                    return (
                      <article className="course-material-item" key={quizKey}>
                        <h3>{quiz.title}</h3>
                        {isAdmin && (
                          <button
                            className="danger-text-button"
                            type="button"
                            onClick={() => deleteCourseContent("quizzes", quiz.id)}
                          >
                            Delete quiz
                          </button>
                        )}
                        {quiz.questions.map((item, index) => (
                          <div className="quiz-question" key={item.id}>
                            <span className="question-number">QUESTION {index + 1}</span>
                            <h3>{item.question}</h3>
                            <div className="quiz-options">
                              {item.options.map((option) => {
                                const answerKey = `${quizKey}-${item.id}`;
                                const isCorrect = quizIsSubmitted && option === item.answer;
                                const isWrong =
                                  quizIsSubmitted &&
                                  quizAnswers[answerKey] === option &&
                                  option !== item.answer;

                                return (
                                  <label
                                    className={`quiz-option ${
                                      quizAnswers[answerKey] === option ? "selected" : ""
                                    } ${isCorrect ? "correct" : ""} ${isWrong ? "incorrect" : ""}`}
                                    key={option}
                                  >
                                    <input
                                      type="radio"
                                      name={`question-${quizKey}-${item.id}`}
                                      value={option}
                                      checked={quizAnswers[answerKey] === option}
                                      disabled={quizIsSubmitted}
                                      onChange={() =>
                                        setQuizAnswers((previous) => ({
                                          ...previous,
                                          [answerKey]: option,
                                        }))
                                      }
                                    />
                                    {option}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {quizIsSubmitted && (
                          <div className="quiz-result">
                            <h3>
                              Your score:{" "}
                              {quiz.questions.filter(
                                (item) =>
                                  quizAnswers[`${quizKey}-${item.id}`] === item.answer
                              ).length}
                              /{quiz.questions.length}
                            </h3>
                            <p>
                              {quiz.questions.every(
                                (item) =>
                                  quizAnswers[`${quizKey}-${item.id}`] === item.answer
                              )
                                ? "Excellent work!"
                                : "Review the highlighted answers and keep practicing."}
                            </p>
                          </div>
                        )}

                        <div className="button-row">
                          {quizIsSubmitted ? (
                            <button
                              className="primary-button"
                              type="button"
                              onClick={() => {
                                setQuizAnswers((previous) => {
                                  const next = { ...previous };
                                  quiz.questions.forEach((item) => {
                                    delete next[`${quizKey}-${item.id}`];
                                  });
                                  return next;
                                });
                                setSubmittedQuizzes((previous) => ({
                                  ...previous,
                                  [quizKey]: false,
                                }));
                              }}
                            >
                              Try again
                            </button>
                          ) : (
                            <button
                              className="primary-button"
                              type="button"
                              disabled={quiz.questions.some(
                                (item) => !quizAnswers[`${quizKey}-${item.id}`]
                              )}
                              onClick={() =>
                                setSubmittedQuizzes((previous) => ({
                                  ...previous,
                                  [quizKey]: true,
                                }))
                              }
                            >
                              Submit quiz
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}

export default App;