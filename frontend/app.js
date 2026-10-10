

const API_BASE_URL = "https://attendly-1mn7.onrender.com/api";

// ======================================================
// AUTHENTICATION AND API HELPERS
// ======================================================

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.warn("Could not parse saved user:", error);
    return null;
  }
}

function saveAuth(token, user) {
  if (token) {
    localStorage.setItem("token", token);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function isAuthPage() {
  const path = window.location.pathname;

  return (
    document.body.classList.contains("auth-page") ||
    path.endsWith("index.html") ||
    path.endsWith("register.html") ||
    path === "/" ||
    path === ""
  );
}

function logout(showMessage = false) {
  clearAuth();

  if (showMessage) {
    alert("You have been logged out.");
  }

  window.location.href = "index.html";
}

// ======================================================
// API REQUEST
// ======================================================

async function apiFetch(endpoint, options = {}) {
  const isAuthRoute = [
    "/auth/login",
    "/auth/register",
    "/auth/signup"
  ].includes(endpoint.split("?")[0]);

  const headers = {
    ...(options.headers || {})
  };

  const token = getToken();

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  // Do not send a stale token to login or registration.
  if (token && !isAuthRoute) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch (error) {
    console.error("API connection error:", error);

    throw new Error(
      "Cannot connect to the server, Make sure you are connected to the interet."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let result = {};

  try {
    if (contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const responseText = await response.text();

      result = responseText
        ? { message: responseText }
        : {};
    }
  } catch (error) {
    console.warn("Could not parse API response:", error);
  }

  console.log(`API ${endpoint} [${response.status}]`, result);

  // A protected request rejected by the server means the
  // current session may be invalid or expired.
  if (response.status === 401 && !isAuthRoute) {
    clearAuth();

    if (!isAuthPage()) {
      alert(
        result.message ||
        "Your session is invalid or has expired. Please log in again."
      );

      window.location.href = "index.html";
    }

    return null;
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message ||
      result.error ||
      result.data?.message ||
      `Request failed (${response.status})`
    );
  }

  return result;
}

// ======================================================
// RESPONSE HELPERS
// ======================================================

function unwrap(result) {
  let value = result?.data ?? result;

  if (
    value &&
    !Array.isArray(value) &&
    typeof value === "object"
  ) {
    for (const key of [
      "students",
      "attendance",
      "records",
      "reports",
      "items",
      "results"
    ]) {
      if (Array.isArray(value[key])) {
        return value[key];
      }
    }

    if (
      value.data &&
      (
        Array.isArray(value.data) ||
        typeof value.data === "object"
      )
    ) {
      value = value.data;
    }
  }

  return value;
}

function asArray(result) {
  const value = unwrap(result);

  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    for (const key of [
      "students",
      "attendance",
      "records",
      "reports",
      "items",
      "results"
    ]) {
      if (Array.isArray(value[key])) {
        return value[key];
      }
    }
  }

  return [];
}

function extractToken(result) {
  return (
    result?.token ||
    result?.accessToken ||
    result?.data?.token ||
    result?.data?.accessToken ||
    result?.data?.data?.token ||
    null
  );
}

function extractUser(result) {
  return (
    result?.user ||
    result?.data?.user ||
    result?.data?.data?.user ||
    null
  );
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function todayLocalISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(
    now.getTime() - offset * 60000
  ).toISOString().slice(0, 10);
}

function showMessage(element, message, isError = false) {
  if (!element) {
    if (message) {
      alert(message);
    }

    return;
  }

  element.textContent = message || "";
  element.style.color = isError ? "#b42318" : "";
}

// ======================================================
// USER INFORMATION
// ======================================================

function getInitials(name) {
  const parts = String(name || "Admin User")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length < 2) {
    return (parts[0] || "AU")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    `${parts[0][0]}${parts[parts.length - 1][0]}`
  ).toUpperCase();
}

function loadUserInformation() {
  const user = getUser();

  if (!user) {
    return;
  }

  const name =
    user.name ||
    user.fullName ||
    user.username ||
    "Admin User";

  const role = user.role || "Lecturer";

  document.querySelectorAll("[data-user-name]")
    .forEach(element => {
      element.textContent = name;
    });

  document.querySelectorAll("[data-user-email]")
    .forEach(element => {
      element.textContent = user.email || "";
    });

  document.querySelectorAll("[data-user-role]")
    .forEach(element => {
      element.textContent = role;
    });

  document.querySelectorAll(
    "[data-user-initials], .profile-menu .avatar"
  ).forEach(element => {
    element.textContent = getInitials(name);
  });
}

// ======================================================
// LOGIN
// ======================================================

function initializeLogin() {
  const form = document.getElementById("loginForm");

  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const email =
      document.getElementById("email")?.value.trim() || "";

    const password =
      document.getElementById("password")?.value || "";

    const message =
      document.getElementById("loginMessage");

    const button =
      form.querySelector('button[type="submit"]');

    if (!email || !password) {
      showMessage(
        message,
        "Please enter your email and password.",
        true
      );

      return;
    }

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Logging in...";
      }

      showMessage(message, "");

      // Clear stale authentication before a fresh login.
      clearAuth();

      const result = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      const token = extractToken(result);

      if (!token) {
        throw new Error(
          "The server did not return a login token. Check your backend login response."
        );
      }

      const user = extractUser(result);

      saveAuth(token, user);

      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error);

      showMessage(
        message,
        error.message || "Login failed.",
        true
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Login";
      }
    }
  });
}

// ======================================================
// REGISTRATION
// ======================================================

function initializeRegister() {
  let form = document.getElementById("registerForm");

  // Support a registration page whose form does not have an ID.
  if (
    !form &&
    window.location.pathname.endsWith("register.html")
  ) {
    form = document.querySelector("form");
  }

  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const nameInput =
      document.getElementById("name") ||
      document.getElementById("fullName") ||
      document.getElementById("registerName") ||
      form.querySelector('[name="name"], [name="fullName"]');

    const emailInput =
      document.getElementById("email") ||
      document.getElementById("registerEmail") ||
      form.querySelector('[name="email"]');

    const passwordInput =
      document.getElementById("password") ||
      document.getElementById("registerPassword") ||
      form.querySelector('[name="password"]');

    const confirmInput =
      document.getElementById("confirmPassword") ||
      document.getElementById("passwordConfirm") ||
      document.getElementById("registerConfirmPassword") ||
      form.querySelector('[name="confirmPassword"]');

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmInput?.value || "";

    const message =
      document.getElementById("registerMessage") ||
      document.getElementById("signupMessage");

    const button =
      form.querySelector('button[type="submit"]');

    if (!name || !email || !password) {
      showMessage(
        message,
        "Please complete all required fields.",
        true
      );

      return;
    }

    if (confirmInput && password !== confirmPassword) {
      showMessage(
        message,
        "Passwords do not match.",
        true
      );

      return;
    }

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Creating account...";
      }

      showMessage(message, "");

      const result = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const token = extractToken(result);
      const user = extractUser(result) || {
        name,
        email,
        role: "lecturer"
      };

      if (token) {
        saveAuth(token, user);
        window.location.href = "dashboard.html";
      } else {
        alert(
          result.message ||
          "Account created successfully. Please log in."
        );

        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Registration error:", error);

      showMessage(
        message,
        error.message || "Registration failed.",
        true
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Register";
      }
    }
  });
}

// ======================================================
// PASSWORD VISIBILITY TOGGLES
// ======================================================

function initializePasswordToggles() {
  document.querySelectorAll(".password-toggle")
    .forEach(button => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener("click", () => {
        const input =
          button.parentElement?.querySelector("input");

        if (input) {
          input.type =
            input.type === "password"
              ? "text"
              : "password";
        }
      });
    });
}

// ======================================================
// MOBILE HAMBURGER MENU
// ======================================================

function initializeMobileMenu() {
  const menuButton = document.querySelector(".menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");

  if (
    !menuButton ||
    !sidebar ||
    menuButton.dataset.bound === "true"
  ) {
    return;
  }

  menuButton.dataset.bound = "true";

  const openMenu = () => {
    sidebar.classList.add("open");
    overlay?.classList.add("show");
    document.body.classList.add("menu-open");

    menuButton.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    sidebar.classList.remove("open");
    overlay?.classList.remove("show");
    document.body.classList.remove("menu-open");

    menuButton.setAttribute("aria-expanded", "false");
  };

  menuButton.addEventListener("click", event => {
    event.preventDefault();

    if (sidebar.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay?.addEventListener("click", closeMenu);

  sidebar.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

// ======================================================
// LOGOUT AND PROTECTED PAGES
// ======================================================

function initializeLogout() {
  document.querySelectorAll("[data-logout]")
    .forEach(button => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
          logout();
        }
      });
    });
}

function initializeProtectedPage() {
  if (!isAuthPage() && !getToken()) {
    window.location.href = "index.html";
  }
}

// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {
  if (!document.querySelector(".stat-grid")) {
    return;
  }

  try {
    const result = await apiFetch("/dashboard");

    if (!result) {
      return;
    }

    const data = result.data || result;

    const setText = (id, value) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = value ?? 0;
      }
    };

    setText("totalStudents", data.totalStudents);
    setText("totalPresent", data.totalPresent);
    setText("totalAbsent", data.totalAbsent);

    setText(
      "attendanceRate",
      `${data.attendanceRate ?? 0}%`
    );

    loadRecentAttendance(data.recentAttendance || []);
    loadAttendanceChart();
  } catch (error) {
    console.error("Dashboard error:", error);

    const target =
      document.getElementById("recentAttendanceBody");

    if (target) {
      target.innerHTML = `
                <tr>
                    <td colspan="3">
                        ${escapeHtml(error.message)}
                    </td>
                </tr>
            `;
    }
  }
}

function loadRecentAttendance(records) {
  const tbody =
    document.getElementById("recentAttendanceBody");

  if (!tbody) {
    return;
  }

  if (!Array.isArray(records) || !records.length) {
    tbody.innerHTML = `
            <tr>
                <td colspan="3">No attendance records yet.</td>
            </tr>
        `;

    return;
  }

  tbody.innerHTML = records.map(record => {
    const student =
      record.studentId ||
      record.student ||
      {};

    const name =
      student.name ||
      record.studentName ||
      "Unknown Student";

    const status = record.status || "Unknown";

    const badgeClass =
      String(status).toLowerCase() === "present"
        ? "present"
        : "absent";

    return `
            <tr>
                <td>${escapeHtml(name)}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${escapeHtml(status)}
                    </span>
                </td>
                <td>
                    ${escapeHtml(
      formatDate(record.date || record.createdAt)
    )}
                </td>
            </tr>
        `;
  }).join("");
}

// ======================================================
// STUDENTS
// ======================================================

function studentKey(student) {
  return (
    student.studentId ??
    student._id ??
    student.id ??
    ""
  );
}

function studentName(student) {
  return (
    student.name ||
    student.fullName ||
    `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
    "Unnamed student"
  );
}

async function loadStudents() {
  const tbody = document.getElementById("studentsTableBody");

  if (!tbody) {
    return [];
  }

  try {
    const result = await apiFetch("/students");

    if (!result) {
      return [];
    }

    let students = asArray(result);

    const search =
      new URLSearchParams(window.location.search)
        .get("search")
        ?.toLowerCase();

    if (search) {
      students = students.filter(student => {
        const values = [
          studentName(student),
          student.studentId,
          student.email,
          student.department,
          student.level
        ];

        return values.some(value =>
          String(value || "")
            .toLowerCase()
            .includes(search)
        );
      });
    }

    if (!students.length) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No students found. Use “Add Student” to add a student.
                    </td>
                </tr>
            `;

      return [];
    }

    tbody.innerHTML = students.map(student => {
      const key = studentKey(student);

      return `
                <tr>
                    <td>${escapeHtml(studentName(student))}</td>
                    <td>${escapeHtml(student.studentId || student._id || "—")}</td>
                    <td>${escapeHtml(student.email || "—")}</td>
                    <td>${escapeHtml(student.department || "—")}</td>
                    <td>${escapeHtml(student.level || "—")}</td>
                    <td>
                        <div class="student-actions">
                            <a
                                class="btn btn-outline"
                                href="add-student.html?studentId=${encodeURIComponent(key)}"
                            >
                                Edit
                            </a>

                            <button
                                type="button"
                                class="btn btn-outline"
                                data-delete-student="${escapeHtml(key)}"
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    }).join("");

    tbody.querySelectorAll("[data-delete-student]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          const key = button.dataset.deleteStudent;

          if (
            !key ||
            !confirm(
              "Delete this student? This may also affect their attendance records."
            )
          ) {
            return;
          }

          try {
            await apiFetch(
              `/students/${encodeURIComponent(key)}`,
              { method: "DELETE" }
            );

            await loadStudents();
          } catch (error) {
            console.error("Delete student error:", error);

            alert(
              error.message ||
              "Unable to delete student."
            );
          }
        });
      });

    return students;
  } catch (error) {
    console.error("Load students error:", error);

    tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    ${escapeHtml(
      error.message || "Unable to load students."
    )}
                </td>
            </tr>
        `;

    return [];
  }
}

// ======================================================
// ADD STUDENT
// ======================================================


function initializeAddStudent() {
  const form = document.getElementById("studentForm");

  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  const params = new URLSearchParams(window.location.search);

  // Supports both ?studentId=... and ?id=...
  const originalStudentId =
    params.get("studentId") ||
    params.get("id") ||
    "";

  const isEditing = Boolean(originalStudentId);

  const title = document.getElementById("studentPageTitle");
  const description = document.getElementById("studentPageDescription");
  const button = document.getElementById("addStudentButton");
  const message = document.getElementById("studentMessage");

  if (isEditing) {
    document.title = "Edit Student — Attendly";

    if (title) title.textContent = "Edit Student";

    if (description) {
      description.textContent =
        "Update the student's information.";
    }

    if (button) button.textContent = "Load Student";
  }

  function displayMessage(text, isError = false) {
    if (!message) {
      alert(text);
      return;
    }

    message.textContent = text;
    message.style.color = isError ? "#dc2626" : "#16a34a";
  }

  function setField(id, value) {
    const field = document.getElementById(id);

    if (field && value != null) {
      field.value = value;
    }
  }

  // Load existing student information when editing.
  async function loadStudentForEditing() {
    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Loading...";
      }

      const result = await apiFetch(
        `/students/${encodeURIComponent(originalStudentId)}`
      );

      const data = unwrap(result);
      const student = data?.student || data;

      if (!student || typeof student !== "object") {
        throw new Error("Student information was not returned.");
      }

      setField("studentId", student.studentId);
      setField("name", student.name || student.fullName);
      setField("email", student.email);
      setField("department", student.department);
      setField("level", student.level);

      displayMessage("Student information loaded successfully.");

      if (button) button.textContent = "Update Student";

    } catch (error) {
      console.error("Load student for editing error:", error);

      displayMessage(
        error.message || "Unable to load student information.",
        true
      );

      if (button) button.textContent = "Retry Update";
    } finally {
      if (button) button.disabled = false;
    }
  }

  if (isEditing) {
    loadStudentForEditing();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const studentId =
      document.getElementById("studentId")?.value.trim() || "";

    const name =
      document.getElementById("name")?.value.trim() || "";

    const email =
      document.getElementById("email")?.value.trim() || "";

    const department =
      document.getElementById("department")?.value || "";

    const level =
      document.getElementById("level")?.value || "";

    if (!studentId || !name || !email || !department || !level) {
      displayMessage("Please fill in all required fields.", true);
      return;
    }

    const submitButton =
      document.getElementById("addStudentButton") ||
      form.querySelector('button[type="submit"]');

    const payload = {
      studentId,
      name,
      email,
      department,
      level
    };

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = isEditing
          ? "Updating..."
          : "Adding...";
      }

      let result;

      if (isEditing) {
        // Use the ORIGINAL ID in the URL. The form may change it.
        result = await apiFetch(
          `/students/${encodeURIComponent(originalStudentId)}`,
          {
            method: "PUT",
            body: JSON.stringify(payload)
          }
        );
      } else {
        result = await apiFetch("/students", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      displayMessage(
        result?.message ||
        (isEditing
          ? "Student updated successfully."
          : "Student added successfully.")
      );

      setTimeout(() => {
        window.location.href = "students.html";
      }, 700);

    } catch (error) {
      console.error(
        isEditing ? "Update student error:" : "Add student error:",
        error
      );

      displayMessage(
        error.message ||
        (isEditing
          ? "Unable to update student."
          : "Unable to add student."),
        true
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = isEditing
          ? "Update Student"
          : "Add Student";
      }
    }
  });
}

// ======================================================
// EDIT STUDENT
// ======================================================

async function initializeEditStudent() {
  const form = document.getElementById("editStudentForm");

  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  const params = new URLSearchParams(window.location.search);

  const initialKey =
    params.get("id") ||
    params.get("studentId") ||
    "";

  const idInput = document.getElementById("studentId");

  if (idInput && initialKey && !idInput.value) {
    idInput.value = initialKey;
  }

  // Load the selected student's existing information.
  if (initialKey) {
    try {
      const result = await apiFetch(
        `/students/${encodeURIComponent(initialKey)}`
      );

      const value = unwrap(result);
      const student = value?.student || value;

      if (student && typeof student === "object") {
        const setValue = (id, value) => {
          const element = document.getElementById(id);

          if (element && value != null) {
            element.value = value;
          }
        };

        setValue("studentId", student.studentId || initialKey);
        setValue("name", student.name || student.fullName);
        setValue("email", student.email);
        setValue("department", student.department);
        setValue("level", student.level);
      }
    } catch (error) {
      console.warn(
        "Could not preload student details:",
        error
      );
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const studentId =
      document.getElementById("studentId")?.value.trim() ||
      initialKey;

    const name =
      document.getElementById("name")?.value.trim() || "";

    const email =
      document.getElementById("email")?.value.trim() || "";

    const department =
      document.getElementById("department")?.value || "";

    const level =
      document.getElementById("level")?.value || "";

    const button =
      form.querySelector('button[type="submit"]');

    if (!studentId) {
      alert("Student ID is required.");
      return;
    }

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
      }

      const result = await apiFetch(
        `/students/${encodeURIComponent(studentId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name,
            email,
            department,
            level
          })
        }
      );

      alert(
        result?.message ||
        "Student updated successfully."
      );

      window.location.href = "students.html";
    } catch (error) {
      console.error("Edit student error:", error);

      alert(
        error.message ||
        "Unable to update student."
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Save Changes";
      }
    }
  });
}

// ======================================================
// ATTENDANCE
// ======================================================

let attendanceStudentsCache = [];

async function initializeAttendancePage() {
  const tbody =
    document.getElementById("attendanceTableBody");

  if (!tbody) {
    return;
  }

  const dateInput =
    document.getElementById("attendanceDate");

  const saveButton =
    document.getElementById("saveAttendanceBtn");

  if (dateInput && !dateInput.value) {
    dateInput.value = todayLocalISO();
  }

  try {
    const result = await apiFetch("/students");

    if (!result) {
      return;
    }

    attendanceStudentsCache = asArray(result);

    if (!attendanceStudentsCache.length) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No students found. Add students before marking attendance.
                    </td>
                </tr>
            `;

      if (saveButton) {
        saveButton.disabled = true;
      }

      return;
    }

    tbody.innerHTML = attendanceStudentsCache.map(student => {
      const key = studentKey(student);

      return `
                <tr data-attendance-student="${escapeHtml(key)}">
                    <td>${escapeHtml(studentName(student))}</td>
                    <td>${escapeHtml(student.studentId || student._id || "—")}</td>
                    <td>${escapeHtml(student.department || "—")}</td>
                    <td>
                        <select
                            class="form-control attendance-status"
                            aria-label="Attendance for ${escapeHtml(studentName(student))}"
                        >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                        </select>
                    </td>
                </tr>
            `;
    }).join("");

    await preloadAttendanceStatuses();

    if (dateInput && !dateInput.dataset.bound) {
      dateInput.dataset.bound = "true";

      dateInput.addEventListener(
        "change",
        preloadAttendanceStatuses
      );
    }

    if (saveButton && !saveButton.dataset.bound) {
      saveButton.dataset.bound = "true";

      saveButton.addEventListener(
        "click",
        saveAttendance
      );
    }
  } catch (error) {
    console.error("Attendance page load error:", error);

    tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    ${escapeHtml(
      error.message || "Unable to load students."
    )}
                </td>
            </tr>
        `;
  }
}

async function preloadAttendanceStatuses() {
  const date =
    document.getElementById("attendanceDate")?.value ||
    todayLocalISO();

  const tbody =
    document.getElementById("attendanceTableBody");

  if (!tbody || !attendanceStudentsCache.length) {
    return;
  }

  try {
    const result = await apiFetch(
      `/attendance?date=${encodeURIComponent(date)}`
    );

    if (!result) {
      return;
    }

    const records = asArray(result);

    records.forEach(record => {
      const linked =
        record.studentId ||
        record.student ||
        {};

      const key = typeof linked === "object"
        ? (
          linked.studentId ??
          linked._id ??
          linked.id
        )
        : linked;

      const rows = [
        ...tbody.querySelectorAll(
          "tr[data-attendance-student]"
        )
      ];

      const row = rows.find(item => {
        const rowKey = item.dataset.attendanceStudent;

        return (
          rowKey === String(key) ||
          rowKey === String(record.studentCode || "") ||
          rowKey === String(record.studentRef || "")
        );
      });

      if (row) {
        const select =
          row.querySelector(".attendance-status");

        if (select && record.status) {
          const status = String(record.status);

          const normalized =
            status.charAt(0).toUpperCase() +
            status.slice(1).toLowerCase();

          if (
            [...select.options].some(
              option => option.value === normalized
            )
          ) {
            select.value = normalized;
          }
        }
      }
    });
  } catch (error) {
    // Keep the attendance table usable if date filtering
    // is not supported by the backend.
    console.warn(
      "Could not preload existing attendance:",
      error.message
    );
  }
}

async function saveAttendance() {
  const date =
    document.getElementById("attendanceDate")?.value ||
    todayLocalISO();

  const tbody =
    document.getElementById("attendanceTableBody");

  const button =
    document.getElementById("saveAttendanceBtn");

  if (!date) {
    alert("Please choose an attendance date.");
    return;
  }

  const rows = [
    ...(tbody?.querySelectorAll(
      "tr[data-attendance-student]"
    ) || [])
  ];

  if (!rows.length) {
    alert("There are no students to mark.");
    return;
  }

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Saving...";
    }

    for (const row of rows) {
      const status =
        row.querySelector(".attendance-status")?.value ||
        "Present";

      const studentId =
        row.dataset.attendanceStudent;

      await apiFetch("/attendance", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          date,
          status
        })
      });
    }

    alert("Attendance saved successfully.");
  } catch (error) {
    console.error("Save attendance error:", error);

    alert(
      `Could not save attendance: ${error.message}`
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Save Attendance";
    }
  }
}

// ======================================================
// ATTENDANCE HISTORY
// ======================================================


async function loadAttendanceHistory() {
  const historyPage = document.querySelector(".page");

  const pageHeading = historyPage
    ?.querySelector("h1")
    ?.textContent
    ?.trim()
    .toLowerCase();

  const isHistoryPage =
    pageHeading === "attendance records" ||
    window.location.pathname
      .toLowerCase()
      .endsWith("attendance-history.html") ||
    Boolean(document.getElementById("attendanceHistoryBody"));

  if (!isHistoryPage || document.getElementById("saveAttendanceBtn")) {
    return;
  }

  const tbody =
    document.getElementById("attendanceHistoryBody") ||
    historyPage?.querySelector(".card .table-wrap tbody") ||
    document.querySelector(".table-wrap tbody");

  if (!tbody) {
    console.warn("Attendance history table body was not found.");
    return;
  }

  const filters = historyPage?.querySelector(".filters");

  const filterInputs = filters
    ? [...filters.querySelectorAll("input, select")]
    : [];

  const startDateInput =
    document.getElementById("historyStartDate") ||
    filterInputs.find(input => input.type === "date");

  const endDateInput =
    document.getElementById("historyEndDate") ||
    filterInputs.filter(input => input.type === "date")[1];

  const studentSelect =
    document.getElementById("historyStudent") ||
    filters?.querySelector("select");

  const filterButton =
    document.getElementById("filterAttendanceHistoryBtn") ||
    filters?.querySelector(".filter-button");

  let allRecords = [];

  function getLinkedStudent(record) {
    return (
      record.studentId ||
      record.student ||
      record.studentRef ||
      {}
    );
  }

  function getStudentNameFromRecord(record) {
    const student = getLinkedStudent(record);

    if (student && typeof student === "object") {
      return (
        student.name ||
        student.fullName ||
        `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
        record.studentName ||
        "Unknown Student"
      );
    }

    return record.studentName || record.name || "Unknown Student";
  }

  function getStudentIdentifier(record) {
    const student = getLinkedStudent(record);

    if (student && typeof student === "object") {
      return String(
        student.studentId ??
        student._id ??
        student.id ??
        ""
      );
    }

    return String(student ?? record.studentCode ?? "");
  }

  function getRecordDate(record) {
    const value =
      record.date ||
      record.attendanceDate ||
      record.createdAt;

    if (!value) {
      return "";
    }

    const dateText = String(value);

    // Preserve date-only values without timezone changes.
    if (/^\d{4}-\d{2}-\d{2}/.test(dateText)) {
      return dateText.slice(0, 10);
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const localDate = new Date(
      parsedDate.getTime() -
      parsedDate.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 10);
  }

  function getMarkedBy(record) {
    const marker =
      record.markedBy ||
      record.markedByUser ||
      record.markedByName ||
      record.createdBy ||
      record.createdByName ||
      record.user ||
      record.admin ||
      null;

    if (marker && typeof marker === "object") {
      return (
        marker.name ||
        marker.fullName ||
        marker.username ||
        marker.email ||
        "Admin"
      );
    }

    return marker || "Admin";
  }

  function renderHistory(records) {
    if (!records.length) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No attendance records found for the selected filters.
                    </td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = records.map((record, index) => {
      const studentName = getStudentNameFromRecord(record);
      const date = getRecordDate(record);
      const status = String(record.status || "—");

      const normalizedStatus = status.toLowerCase();

      const badgeClass =
        normalizedStatus === "present"
          ? "present"
          : normalizedStatus === "absent"
            ? "absent"
            : normalizedStatus === "late"
              ? "late"
              : "";

      return `
                <tr>
                    <td>${index + 1}</td>

                    <td>${escapeHtml(studentName)}</td>

                    <td>
                        ${escapeHtml(date ? formatDate(date) : "—")}
                    </td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(status)}
                        </span>
                    </td>

                    <td>${escapeHtml(getMarkedBy(record))}</td>
                </tr>
            `;
    }).join("");
  }

  function applyHistoryFilters() {
    const startDate = startDateInput?.value || "";
    const endDate = endDateInput?.value || "";
    const selectedStudent = studentSelect?.value || "";

    const filteredRecords = allRecords.filter(record => {
      const recordDate = getRecordDate(record);
      const studentId = getStudentIdentifier(record);
      const studentName = getStudentNameFromRecord(record);

      if (startDate && (!recordDate || recordDate < startDate)) {
        return false;
      }

      if (endDate && (!recordDate || recordDate > endDate)) {
        return false;
      }

      if (
        selectedStudent &&
        selectedStudent !== "all" &&
        selectedStudent !== "All Students" &&
        selectedStudent !== studentId &&
        selectedStudent !== studentName
      ) {
        return false;
      }

      return true;
    });

    renderHistory(filteredRecords);
  }

  try {
    tbody.innerHTML = `
            <tr>
                <td colspan="5">Loading attendance history...</td>
            </tr>
        `;

    const [attendanceResult, studentsResult] = await Promise.all([
      apiFetch("/attendance"),

      studentSelect
        ? apiFetch("/students").catch(error => {
          console.warn(
            "Could not load students for history filter:",
            error
          );
          return null;
        })
        : Promise.resolve(null)
    ]);

    allRecords = asArray(attendanceResult);

    // Populate the student filter.
    if (studentSelect && studentsResult) {
      const students = asArray(studentsResult);
      const previousValue = studentSelect.value;

      studentSelect.innerHTML = `
                <option value="">All Students</option>
                ${students.map(student => `
                    <option value="${escapeHtml(studentKey(student))}">
                        ${escapeHtml(studentName(student))}
                    </option>
                `).join("")}
            `;

      const optionExists = [
        ...studentSelect.options
      ].some(option => option.value === previousValue);

      if (previousValue && optionExists) {
        studentSelect.value = previousValue;
      }
    }

    // Connect the Filter button once.
    if (
      filterButton &&
      filterButton.dataset.historyBound !== "true"
    ) {
      filterButton.dataset.historyBound = "true";

      filterButton.addEventListener("click", event => {
        event.preventDefault();
        applyHistoryFilters();
      });
    }

    // Apply filters when a filter value changes.
    [
      startDateInput,
      endDateInput,
      studentSelect
    ].filter(Boolean).forEach(input => {
      if (input.dataset.historyBound !== "true") {
        input.dataset.historyBound = "true";

        input.addEventListener("change", applyHistoryFilters);
      }
    });

    applyHistoryFilters();

  } catch (error) {
    console.error("Attendance history error:", error);

    tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    ${escapeHtml(
      error.message ||
      "Unable to load attendance history."
    )}
                </td>
            </tr>
        `;
  }
}


// ======================================================
// REPORTS
// ======================================================

async function initializeReportsPage() {
  const select = document.getElementById("studentSelect");

  const resultContainer =
    document.getElementById("reportResult");

  const loading =
    document.getElementById("reportLoading");

  if (!select) {
    return;
  }

  let students = [];

  try {
    const response = await apiFetch("/students");

    if (!response) {
      return;
    }

    students = asArray(response);

    select.innerHTML =
      '<option value="">Select a student</option>' +
      students.map(student => `
                <option value="${escapeHtml(studentKey(student))}">
                    ${escapeHtml(studentName(student))}
                    (${escapeHtml(student.studentId || student._id || "")})
                </option>
            `).join("");

    if (!students.length) {
      select.innerHTML =
        '<option value="">No students available</option>';
    }

    if (!select.dataset.bound) {
      select.dataset.bound = "true";

      select.addEventListener("change", () => {
        generateStudentReport(select.value);
      });
    }
  } catch (error) {
    console.error("Report student list error:", error);

    select.innerHTML =
      '<option value="">Could not load students</option>';

    if (resultContainer) {
      resultContainer.innerHTML = `
                <div class="card card-pad">
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
    }

    return;
  }

  async function generateStudentReport(studentId) {
    if (!studentId) {
      if (resultContainer) {
        resultContainer.innerHTML = `
                    <div class="card card-pad">
                        <p>Select a student to view their attendance report.</p>
                    </div>
                `;
      }

      return;
    }

    if (loading) {
      loading.style.display = "block";
    }

    try {
      const response = await apiFetch(
        `/reports/student/${encodeURIComponent(studentId)}`
      );

      if (!response) {
        return;
      }

      const data = unwrap(response);

      const student = data?.student || {};

      let records = Array.isArray(data)
        ? data
        : (
          data?.attendance ||
          data?.records ||
          data?.history ||
          data?.report ||
          []
        );

      if (!Array.isArray(records) && data?.data) {
        records = Array.isArray(data.data)
          ? data.data
          : (
            data.data.attendance ||
            data.data.records ||
            []
          );
      }

      if (!Array.isArray(records)) {
        records = [];
      }

      const present = records.filter(record =>
        String(record.status || "").toLowerCase() === "present"
      ).length;

      const absent = records.filter(record =>
        String(record.status || "").toLowerCase() === "absent"
      ).length;

      const total = records.length;

      const rate = total
        ? Math.round((present / total) * 100)
        : 0;

      const selectedStudent =
        students.find(item =>
          String(studentKey(item)) === String(studentId)
        ) || {};

      if (resultContainer) {
        resultContainer.innerHTML = `
                    <div class="card card-pad">

                        <div class="report-student">
                            <h2>
                                ${escapeHtml(
          student.name ||
          studentName(selectedStudent)
        )}
                            </h2>

                            <p>
                                Student ID:
                                ${escapeHtml(
          student.studentId || studentId
        )}
                            </p>

                            <p>
                                Email:
                                ${escapeHtml(student.email || selectedStudent.email || "—")}
                            </p>

                            <p>
                                Department:
                                ${escapeHtml(
          student.department ||
          selectedStudent.department ||
          "—"
        )}
                                · Level:
                                ${escapeHtml(
          student.level ||
          selectedStudent.level ||
          "—"
        )}
                            </p>
                        </div>

                        <div class="report-summary">

                            <div class="report-stat">
                                <span>Total Records</span>
                                <strong>${total}</strong>
                            </div>

                            <div class="report-stat">
                                <span>Present</span>
                                <strong>${present}</strong>
                            </div>

                            <div class="report-stat">
                                <span>Absent</span>
                                <strong>${absent}</strong>
                            </div>

                            <div class="report-stat">
                                <span>Attendance Rate</span>
                                <strong>${rate}%</strong>
                            </div>

                        </div>

                        <h3>Attendance History</h3>

                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${records.length
            ? records.map(record => `
                                                <tr>
                                                    <td>
                                                        ${escapeHtml(
              formatDate(
                record.date ||
                record.createdAt
              )
            )}
                                                    </td>

                                                    <td>
                                                        ${escapeHtml(
              record.status || "—"
            )}
                                                    </td>

                                                    <td>
                                                        ${escapeHtml(
              record.remarks || "—"
            )}
                                                    </td>
                                                </tr>
                                            `).join("")
            : `
                                                <tr>
                                                    <td colspan="3">
                                                        No attendance records for this student yet.
                                                    </td>
                                                </tr>
                                            `
          }
                                </tbody>
                            </table>
                        </div>

                    </div>
                `;
      }
    } catch (error) {
      console.error("Generate report error:", error);

      if (resultContainer) {
        resultContainer.innerHTML = `
                    <div class="card card-pad">
                        <p>
                            ${escapeHtml(
          error.message ||
          "Unable to generate report."
        )}
                        </p>
                    </div>
                `;
      }
    } finally {
      if (loading) {
        loading.style.display = "none";
      }
    }
  }

  // Allow the existing Generate Report button to work.
  window.generateStudentReport = generateStudentReport;
}

// ======================================================
// GLOBAL SEARCH
// ======================================================

function initializeSearch() {
  document.querySelectorAll(".global-search")
    .forEach(input => {
      if (input.dataset.bound === "true") {
        return;
      }

      input.dataset.bound = "true";

      input.addEventListener("keydown", event => {
        if (
          event.key === "Enter" &&
          input.value.trim()
        ) {
          window.location.href =
            `students.html?search=${encodeURIComponent(
              input.value.trim()
            )}`;
        }
      });
    });
}

// ======================================================
// PAGE INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  initializeLogin();
  initializeRegister();
  initializePasswordToggles();
  initializeMobileMenu();
  initializeLogout();
  initializeAddStudent();
  initializeSearch();
  initializeProtectedPage();
  loadUserInformation();

  await initializeEditStudent();

  if (document.getElementById("studentsTableBody")) {
    loadStudents();
  }

  if (document.getElementById("attendanceTableBody")) {
    initializeAttendancePage();
  }

  if (document.getElementById("attendanceHistoryBody")) {
    loadAttendanceHistory();
  }

  if (document.getElementById("studentSelect")) {
    initializeReportsPage();
  }

  if (document.querySelector(".stat-grid")) {
    loadDashboard();
  }
});

// Refresh dashboard data when returning to the tab.


const historyHeading = document
  .querySelector(".page h1")
  ?.textContent
  ?.trim()
  .toLowerCase();

if (
  document.getElementById("attendanceHistoryBody") ||
  historyHeading === "attendance records" ||
  window.location.pathname.toLowerCase().endsWith("attendance-history.html")
) {
  loadAttendanceHistory();
}

// ATTENDANCE PROGRESS LINE GRAPH

async function loadAttendanceChart() {
    const chart = document.getElementById("attendanceChart");

    if (!chart) return;

    const width = 600;
    const height = 300;

    const left = 48;
    const right = 12;
    const top = 18;
    const bottom = 248;

    const plotWidth = width - left - right;
    const plotHeight = bottom - top;

    const escapeHTML = value =>
        String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    try {
        // Get attendance records from your existing API
        const response = await apiFetch("/attendance");

        if (!response) {
            throw new Error("Attendance request failed");
        }

        const records = asArray(response);

        // Generate the last seven calendar days
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);

            date.setHours(12, 0, 0, 0);
            date.setDate(date.getDate() - i);

            const key =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, "0") + "-" +
                String(date.getDate()).padStart(2, "0");

            days.push({
                key,
                label: date.toLocaleDateString("en-US", {
                    weekday: "short"
                }),
                present: 0,
                absent: 0,
                total: 0,
                percentage: null
            });
        }

        const daysMap = new Map(
            days.map(day => [day.key, day])
        );

        // Organise records by day
        records.forEach(record => {
            if (!record.date || !record.status) return;

            const dateKey = String(record.date).slice(0, 10);
            const day = daysMap.get(dateKey);

            if (!day) return;

            const status = String(record.status).toLowerCase();

            if (status === "present") {
                day.present++;
                day.total++;
            } else if (status === "absent") {
                day.absent++;
                day.total++;
            }
        });

        // Calculate each day's attendance percentage
        days.forEach(day => {
            if (day.total > 0) {
                day.percentage = Math.round(
                    (day.present / day.total) * 100
                );
            }
        });

        // Convert graph values into coordinates
        const getX = index =>
            left + (index / (days.length - 1)) * plotWidth;

        const getY = percentage =>
            bottom - (percentage / 100) * plotHeight;

        // Draw horizontal grid lines and Y-axis labels
        const grid = [];

        for (let percentage = 0; percentage <= 100; percentage += 10) {
            const y = getY(percentage);

            grid.push(`
                <line
                    class="chart-grid"
                    x1="${left}"
                    y1="${y}"
                    x2="${width - right}"
                    y2="${y}"
                />

                <text
                    class="chart-label"
                    x="${left - 10}"
                    y="${y + 4}"
                    text-anchor="end"
                >${percentage}</text>
            `);
        }

        // Draw left and bottom axes
        const axes = `
            <line
                class="chart-axis"
                x1="${left}"
                y1="${top}"
                x2="${left}"
                y2="${bottom}"
            />

            <line
                class="chart-axis"
                x1="${left}"
                y1="${bottom}"
                x2="${width - right}"
                y2="${bottom}"
            />
        `;

        // Build a continuous line through days with records.
        // Missing days are skipped rather than treated as 0%.
        let linePath = "";
        let penDown = false;

        days.forEach((day, index) => {
            if (day.percentage === null) {
                penDown = false;
                return;
            }

            const command = penDown ? "L" : "M";

            linePath +=
                `${command} ${getX(index)} ${getY(day.percentage)} `;

            penDown = true;
        });

        // Draw the circular points and weekday labels
        const plottedDays = days.map((day, index) => {
            const x = getX(index);

            const weekday = `
                <text
                    class="chart-label"
                    x="${x}"
                    y="${bottom + 19}"
                    text-anchor="middle"
                >${escapeHTML(day.label)}</text>
            `;

            if (day.percentage === null) {
                return weekday;
            }

            const y = getY(day.percentage);

            return `
                ${weekday}

                <circle
                    class="chart-point"
                    cx="${x}"
                    cy="${y}"
                    r="5"
                >
                    <title>
                        ${day.label}: ${day.percentage}% attendance.
                        ${day.present} present, ${day.absent} absent.
                    </title>
                </circle>

                <text
                    class="chart-value"
                    x="${x}"
                    y="${Math.max(top + 12, y - 10)}"
                    text-anchor="middle"
                >${day.percentage}%</text>
            `;
        }).join("");

        const hasRecords = days.some(
            day => day.percentage !== null
        );

        chart.setAttribute("viewBox", `0 0 ${width} ${height}`);

        chart.innerHTML = `
            ${grid.join("")}
            ${axes}

            ${
                hasRecords
                    ? `<path class="chart-line" d="${linePath}" />`
                    : `<text
                           class="chart-message"
                           x="${width / 2}"
                           y="${height / 2}"
                           text-anchor="middle"
                       >No attendance records for the last 7 days</text>`
            }

            ${plottedDays}
        `;

    } catch (error) {
        console.error("Attendance chart error:", error);

        chart.innerHTML = `
            <text
                class="chart-message"
                x="300"
                y="145"
                text-anchor="middle"
            >Unable to load attendance data</text>
        `;
    }
}
