const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const jwt = require("jsonwebtoken"); // JWT for authentication
require("dotenv").config();
const app = express();
const session = require('express-session');
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// Middleware
// Update CORS configuration in server.js
app.use(cors({
    origin: 'http://localhost:3000', // Your React app's URL
    credentials: true // Allow credentials
}));
app.use(express.json());
// Add this before your routes
app.use(session({
    secret: 'samjoseph', // Use a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "reactproj"
});

db.connect(err => {
    if (err) {
        console.error("Database connection error:", err);
    } else {
        console.log("Connected to MySQL database.");
    }
});

// Helper function to execute SQL queries with promises
const executeQuery = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// JWT Secret Key
const SECRET_KEY = "samjoseph"; // Change this to a strong secret

// 🔹 Middleware to Verify Token
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    console.log("Received Token:", token); // ✅ Log the token

    if (!token) {
        return res.status(403).json({ message: "No token provided!" });
    }

    jwt.verify(token.replace("Bearer ", ""), SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("Token verification failed:", err); // ✅ Log token error
            return res.status(401).json({ message: "Unauthorized!" });
        }
        req.user = decoded;
        next();
    });
};


// 🔹 User Login with JWT Token
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("🔍 Login Attempt:", { username, password }); // ✅ Debugging

        const sql = "SELECT * FROM customer WHERE username = ?";
        const users = await executeQuery(sql, [username]);

        if (users.length === 0) {
            console.log("⚠ User not found:", username);
            return res.status(401).json({ detail: "Invalid username or password" });
        }

        const user = users[0];
        console.log("✅ User Found:", user); // ✅ Debugging log

        if (password !== user.password) {
            console.log("⚠ Incorrect Password for:", username);
            return res.status(401).json({ detail: "Invalid username or password" });
        }

        // Check if user is an employer with status 0
        if (user.user_type === "employer" && user.status === 0) {
            console.log("⚠ Employer account inactive:", username);
            return res.status(403).json({
                detail: "Your employer account is inactive. Please contact support.",
                redirectToError: true
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, user_type: user.user_type },
            SECRET_KEY,
            { expiresIn: "24h" }
        );

        console.log("✅ Login Success - Sending Response:", {
            message: "Login successful",
            token,
            user_id: user.user_id,
            username: user.username,
            user_type: user.user_type,
        });

        res.json({
            message: "Login successful",
            token,
            user_id: user.user_id,
            username: user.username,
            user_type: user.user_type,
        });
    } catch (error) {
        console.error("🚨 Server Error:", error);
        res.status(500).json({ detail: "Server error" });
    }
});



// 🔹 Register User (No Hashing)
app.post("/api/customer", async (req, res) => {
    const { username, password, user_type } = req.body;

    try {
        // Check if username already exists
        const checkUser = await executeQuery(
            "SELECT * FROM customer WHERE username = ?",
            [username]
        );

        if (checkUser.length > 0) {
            return res.status(400).json({ detail: "Username already exists" });
        }

        // Set status based on user_type
        const status = user_type === "employer" ? 0 : 1;

        // Store plain text password (not secure)
        const result = await executeQuery(
            "INSERT INTO customer (username, password, user_type, status) VALUES (?, ?, ?, ?)",
            [username, password, user_type, status]
        );

        res.status(201).json({
            user_id: result.insertId,
            username,
            user_type
        });
    } catch (error) {
        res.status(500).json({ detail: "Error creating customer" });
    }
});


// 🔹 Logout (Handled on Frontend - Just clear the token)
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: 'Logout successful' });
    });
});


// Employer creation endpoint
app.post("/api/employer", async (req, res) => {
    const { user_id, company_name, email, contact_number, address } = req.body;

    try {
        const result = await executeQuery(
            "INSERT INTO temp_employer (user_id, company_name, email, contact_number, address) VALUES (?, ?, ?, ?, ?)",
            [user_id, company_name, email, contact_number, address]
        );

        res.status(201).json({
            emp_id: result.insertId,
            user_id,
            company_name
        });
    } catch (error) {
        console.error("Employer Insert Error:", error);  // <-- Add this line to log the actual error
        res.status(500).json({ detail: "Error creating employer profile" });
    }
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept only pdf and doc/docx files
    if (
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file format. Please upload PDF or Word document."), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
    fileFilter: fileFilter
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Get all employers
app.get("/api/employers", verifyToken, async (req, res) => {
    try {
        const employers = await executeQuery(
            "SELECT e.*, c.status FROM temp_employer e JOIN customer c ON e.user_id = c.user_id WHERE e.status = 'pending'"
        );
        res.json(employers);
    } catch (error) {
        res.status(500).json({ detail: "Error fetching employers" });
    }
});

// Get all approved employers from employer table
app.get("/api/approved-employers", verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT e.*, c.username, c.status as user_status 
            FROM employer e 
            JOIN customer c ON e.user_id = c.user_id
        `;
        const employers = await executeQuery(sql);
        res.json(employers);
    } catch (error) {
        console.error("Error fetching approved employers:", error);
        res.status(500).json({ detail: "Error fetching approved employers" });
    }
});

// Approve/Reject employer
app.put("/api/employer/:empId/:action", verifyToken, async (req, res) => {
    const { empId, action } = req.params;

    try {
        // Start a transaction to ensure data consistency
        await executeQuery("START TRANSACTION");

        if (action === "approve") {
            // First, get the temp_employer record
            const [tempEmployer] = await executeQuery(
                "SELECT * FROM temp_employer WHERE emp_id = ? AND status = 'pending'",
                [empId]
            );

            if (!tempEmployer) {
                await executeQuery("ROLLBACK");
                return res.status(404).json({ detail: "Pending employer not found" });
            }

            // Update temp_employer status to approved
            await executeQuery(
                "UPDATE temp_employer SET status = 'approved' WHERE emp_id = ?",
                [empId]
            );

            // Update customer status to approved
            await executeQuery(
                "UPDATE customer SET status = 1 WHERE user_id = ?",
                [tempEmployer.user_id]
            );

            // Insert into employers table
            await executeQuery(
                "INSERT INTO employer (user_id, company_name, email, contact_number, address, reg_date) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    tempEmployer.user_id,
                    tempEmployer.company_name,
                    tempEmployer.email,
                    tempEmployer.contact_number,
                    tempEmployer.address,
                    tempEmployer.reg_date
                ]
            );

            // Update customer status to active (1)
            await executeQuery(
                "UPDATE customer SET status = 1 WHERE user_id = ?",
                [tempEmployer.user_id]
            );

            await executeQuery("COMMIT");
            res.json({ message: "Employer approved successfully" });
        } else if (action === "reject") {
            // Update temp_employer status to rejected
            await executeQuery(
                "UPDATE temp_employer SET status = 'rejected' WHERE emp_id = ?",
                [empId]
            );

            // Update customer status to inactive (0)
            await executeQuery(
                "UPDATE customer SET status = 0 WHERE user_id = (SELECT user_id FROM temp_employer WHERE emp_id = ?)",
                [empId]
            );

            await executeQuery("COMMIT");
            res.json({ message: "Employer rejected successfully" });
        } else {
            await executeQuery("ROLLBACK");
            res.status(400).json({ detail: "Invalid action" });
        }
    } catch (error) {
        await executeQuery("ROLLBACK");
        console.error(`Error ${action}ing employer:`, error);
        res.status(500).json({ detail: `Error ${action}ing employer` });
    }
});


// Get all applicants
app.get("/api/applicants", verifyToken, async (req, res) => {
    try {
        const applicants = await executeQuery("SELECT * FROM applicant");
        res.json(applicants);
    } catch (error) {
        res.status(500).json({ detail: "Error fetching applicants" });
    }
});

// Get all job applications (admin view)
app.get("/api/applications", verifyToken, async (req, res) => {
    try {
        const sql = `
        SELECT ja.application_id, jp.job_title, a.name AS applicant_name, 
               ja.application_status, ja.applied_at
        FROM job_applications ja
        JOIN job_posts jp ON ja.job_id = jp.job_id
        JOIN applicant a ON ja.applicant_id = a.applicant_id
        ORDER BY ja.applied_at DESC
      `;
        const applications = await executeQuery(sql);
        res.json(applications);
    } catch (error) {
        res.status(500).json({ detail: "Error fetching applications" });
    }
});

// Get all work executions (admin view)
app.get("/api/work-executions", verifyToken, async (req, res) => {
    try {
        const sql = `
        SELECT we.execution_id, jp.job_title, we.work_status, we.work_completed_date
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN job_posts jp ON ja.job_id = jp.job_id
      `;
        const workExecutions = await executeQuery(sql);
        res.json(workExecutions);
    } catch (error) {
        res.status(500).json({ detail: "Error fetching work executions" });
    }
});

// Get all remunerations
app.get("/api/remunerations", verifyToken, async (req, res) => {
    try {
        const remunerations = await executeQuery("SELECT * FROM remunerations");
        res.json(remunerations);
    } catch (error) {
        res.status(500).json({ detail: "Error fetching remunerations" });
    }
});

// Applicant creation endpoint
app.post("/api/applicant", upload.single('resume'), async (req, res) => {
    const { user_id, name, email, contact_number, skills, experience, preference } = req.body;

    // Construct the relative path for the resume (uploads/filename)
    const resume_path = req.file ? `uploads/${req.file.filename}` : null;

    try {
        const result = await executeQuery(
            "INSERT INTO applicant (user_id, name, email, contact_number, skills, experience, preference, resume_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [user_id, name, email, contact_number, skills, experience, preference, resume_path]
        );

        res.status(201).json({
            applicant_id: result.insertId,
            user_id,
            name,
            resume_path: resume_path // Return the relative path in the response
        });
    } catch (error) {
        console.error("Error creating applicant profile:", error);
        res.status(500).json({ detail: "Error creating applicant profile" });
    }
});


// Get employer profile
app.get("/api/employer/:userId", async (req, res) => {
    try {
        const sql = `
            SELECT e.*, c.username, c.status 
            FROM employer e
            JOIN customer c ON e.user_id = c.user_id
            WHERE e.user_id = ?
        `;
        const [employer] = await executeQuery(sql, [req.params.userId]);

        if (!employer) {
            return res.status(404).json({ detail: "Employer not found" });
        }

        res.json(employer);
    } catch (error) {
        res.status(500).json({ detail: "Error fetching employer profile" });
    }
});


// Get applicant profile
app.get("/api/applicant/:userId", async (req, res) => {
    try {
        const [applicant] = await executeQuery(
            "SELECT * FROM applicant WHERE user_id = ?",
            [req.params.userId]
        );

        if (!applicant) {
            return res.status(404).json({ detail: "Applicant not found" });
        }

        // Add the full URL to the resume if it exists
        if (applicant.resume_path) {
            applicant.resume_url = `http://localhost:8000/${applicant.resume_path}`;
        }

        res.json(applicant);
    } catch (error) {
        res.status(500).json({ detail: "Error fetching applicant profile" });
    }
});

// Get applicant resume
app.get("/api/applicant/resume/:applicantId", verifyToken, async (req, res) => {
    try {
        const [applicant] = await executeQuery(
            "SELECT resume_path FROM applicant WHERE applicant_id = ?",
            [req.params.applicantId]
        );

        if (!applicant || !applicant.resume_path) {
            return res.status(404).json({ detail: "Resume not found for this applicant" });
        }

        const filePath = path.join(__dirname, applicant.resume_path);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ detail: "Resume file not found on server" });
        }

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="resume-${req.params.applicantId}${path.extname(applicant.resume_path)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Send the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error("Error fetching resume:", error);
        res.status(500).json({ detail: "Error fetching resume" });
    }
});

app.get("/api/applicant/by-id/:applicantId", async (req, res) => {
    try {
        const [applicant] = await executeQuery(
            "SELECT * FROM applicant WHERE applicant_id = ?",
            [req.params.applicantId]
        );

        if (!applicant) {
            return res.status(404).json({ detail: "Applicant not found" });
        }

        if (applicant.resume_path) {
            applicant.resume_url = `http://localhost:8000/${applicant.resume_path}`;
        }

        res.json(applicant);
    } catch (error) {
        console.error("Error fetching applicant:", error);
        res.status(500).json({ detail: "Error fetching applicant profile" });
    }
});

// Update employer profile
app.put("/api/employer/:userId", async (req, res) => {
    const { company_name, email, contact_number, address } = req.body;

    try {
        await executeQuery(
            "UPDATE employer SET company_name = ?, email = ?, contact_number = ?, address = ? WHERE user_id = ?",
            [company_name, email, contact_number, address, req.params.userId]
        );

        res.json({ detail: "Employer profile updated successfully" });
    } catch (error) {
        res.status(500).json({ detail: "Error updating employer profile" });
    }
});

// Update applicant profile
app.put("/api/applicant/:userId", upload.single('resume'), async (req, res) => {
    const { name, email, contact_number, skills, experience, preference } = req.body;

    try {
        let resume_path = null;

        // If a new file was uploaded
        if (req.file) {
            resume_path = req.file.path.replace(/\\/g, '/');

            // Get the old resume path to delete it
            const [oldRecord] = await executeQuery(
                "SELECT resume_path FROM applicant WHERE user_id = ?",
                [req.params.userId]
            );

            // Delete the old file if it exists
            if (oldRecord && oldRecord.resume_path) {
                try {
                    fs.unlinkSync(oldRecord.resume_path);
                } catch (err) {
                    console.error("Error deleting old resume:", err);
                }
            }

            // Update with new resume
            await executeQuery(
                "UPDATE applicant SET name = ?, email = ?, contact_number = ?, skills = ?, experience = ?, preference = ?, resume_path = ? WHERE user_id = ?",
                [name, email, contact_number, skills, experience, preference, resumePath, req.params.userId]
            );
        } else {
            // Update without changing resume
            await executeQuery(
                "UPDATE applicant SET name = ?, email = ?, contact_number = ?, skills = ?, experience = ?, preference = ? WHERE user_id = ?",
                [name, email, contact_number, skills, experience, preference, req.params.userId]
            );
        }

        res.json({ detail: "Applicant profile updated successfully" });
    } catch (error) {
        console.error("Error updating applicant profile:", error);
        res.status(500).json({ detail: "Error updating applicant profile" });
    }
});

// Get job posts for a specific employer
app.get("/api/job-posts/employer/:empId", async (req, res) => {
    const { empId } = req.params;
    try {
        const sql = `
            SELECT 
                job_id,
                job_title,
                job_description,
                job_category,
                required_skills,
                salary,
                vacancies,
                work_deadline,
                status,
                posted_date
            FROM job_posts
            WHERE emp_id = ?
            ORDER BY posted_date DESC
        `;
        const jobPosts = await executeQuery(sql, [empId]);
        res.json(jobPosts);
    } catch (error) {
        console.error("Error fetching employer job posts:", error);
        res.status(500).json({ detail: "Error fetching job posts" });
    }
});

app.get("/api/job-posts", async (req, res) => {
    try {
        const jobPosts = await executeQuery("SELECT job_id, emp_id, emp_user_id, job_title, job_description, job_category, required_skills, salary, vacancies, application_deadline, work_deadline, status, posted_date FROM job_posts");  // Updated to include all fields explicitly
        res.json(jobPosts);
    } catch (error) {
        console.error("Error fetching job posts:", error);
        res.status(500).json({ detail: "Error fetching job posts" });
    }
});

app.post("/api/job-posts", async (req, res) => {
    const { emp_id, emp_user_id, job_title, job_description, job_category, required_skills, salary, vacancies, application_deadline, work_deadline, status } = req.body;

    if (!emp_id || !emp_user_id || !job_title || !job_description || !job_category || !required_skills || !salary || !vacancies || !application_deadline || !work_deadline) {
        return res.status(400).json({ detail: "All fields are required!" });
    }

    try {
        const result = await executeQuery(
            "INSERT INTO job_posts (emp_id, emp_user_id, job_title, job_description, job_category, required_skills, salary, vacancies, application_deadline, work_deadline, status, posted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [emp_id, emp_user_id, job_title, job_description, job_category, required_skills, salary, vacancies, application_deadline, work_deadline, status ?? "active"]
        );

        res.status(201).json({ job_id: result.insertId, message: "Job post added successfully!" });
    } catch (error) {
        console.error("Database Error:", error.sqlMessage || error);
        res.status(500).json({ detail: "Error adding job post!" });
    }
});

// Application-related endpoints
app.post("/api/applications", verifyToken, async (req, res) => {
    const { job_id } = req.body;
    const [applicant] = await executeQuery(
        "SELECT applicant_id FROM applicant WHERE user_id = ?",
        [req.user.user_id]
    );

    if (!applicant) {
        return res.status(400).json({ detail: "Applicant profile not found. Please complete your profile before applying for jobs." });
    }

    const applicant_id = applicant.applicant_id;

    if (!job_id) {
        return res.status(400).json({ detail: "Job ID is required!" });
    }

    try {
        // Check if job exists and is still active
        const [job] = await executeQuery(
            "SELECT * FROM job_posts WHERE job_id = ? AND status = 'active' AND application_deadline > NOW()",
            [job_id]
        );

        if (!job) {
            return res.status(400).json({ detail: "Job not found or application deadline passed" });
        }

        // Check if user has already applied
        const [existingApplication] = await executeQuery(
            "SELECT * FROM job_applications WHERE job_id = ? AND applicant_id = ?",
            [job_id, applicant_id]
        );

        if (existingApplication) {
            return res.status(400).json({ detail: "You have already applied for this job" });
        }

        // Submit application
        const result = await executeQuery(
            "INSERT INTO job_applications (job_id, applicant_id, application_status, applied_at) VALUES (?, ?, 'pending', NOW())",
            [job_id, applicant_id]
        );

        res.status(201).json({
            message: "Application submitted successfully!",
            application_id: result.insertId
        });
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).json({ detail: "Error submitting application" });
    }
});

// Get applications for a specific applicant
app.get("/api/applications/:empId", async (req, res) => {
    const empId = req.params.empId;

    try {
        const sql = `
            SELECT 
                ja.application_id,
                a.name AS applicant_name,
                jp.job_title,
                ja.application_status,
                ja.applied_at,
                ja.applicant_id  -- Add this line
            FROM job_applications ja
            JOIN applicant a ON ja.applicant_id = a.applicant_id
            JOIN job_posts jp ON ja.job_id = jp.job_id
            WHERE jp.emp_id = ? AND ja.application_status = 'pending'
            ORDER BY ja.applied_at DESC
        `;

        const applications = await executeQuery(sql, [empId]);
        res.json(applications);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ detail: "Error fetching applications" });
    }
});
//Get work executions for a specific applicant
app.get("/api/work-executions/:userId", verifyToken, async (req, res) => {
    const userId = req.params.userId;

    if (req.user.user_id !== parseInt(userId)) {
        return res.status(403).json({ detail: "Unauthorized access" });
    }

    try {
        const [applicant] = await executeQuery(
            "SELECT applicant_id FROM applicant WHERE user_id = ?",
            [userId]
        );

        if (!applicant) {
            return res.status(404).json({ detail: "Applicant not found" });
        }

        const sql = `
        SELECT 
        we.execution_id,
        jp.job_title,
        jp.job_description,
        we.work_status,
        we.app_work_status,
        we.deliverables_file_path,
        e.company_name,
        e.email,
        jp.emp_id  -- Added emp_id
      FROM work_execution we
      JOIN job_applications ja ON we.application_id = ja.application_id
      JOIN job_posts jp ON ja.job_id = jp.job_id
      JOIN employer e ON jp.emp_id = e.emp_id
      WHERE ja.applicant_id = ?
      `;
        const workExecutions = await executeQuery(sql, [applicant.applicant_id]);
        res.json(workExecutions);
    } catch (error) {
        console.error("Error fetching work executions:", error);
        res.status(500).json({ detail: "Error fetching work executions" });
    }
});

app.put("/api/work-executions/:executionId/applicant-status", verifyToken, async (req, res) => {
    const { executionId } = req.params;
    const { app_work_status } = req.body;

    const validStatuses = ["In Progress", "Completed"];
    if (!validStatuses.includes(app_work_status)) {
        return res.status(400).json({ detail: "Invalid applicant status" });
    }

    try {
        const [applicant] = await executeQuery(
            "SELECT a.user_id FROM applicant a JOIN job_applications ja ON a.applicant_id = ja.applicant_id JOIN work_execution we ON ja.application_id = we.application_id WHERE we.execution_id = ?",
            [executionId]
        );

        if (!applicant || req.user.user_id !== applicant.user_id) {
            return res.status(403).json({ detail: "Unauthorized access" });
        }

        await executeQuery(
            "UPDATE work_execution SET app_work_status = ? WHERE execution_id = ?",
            [app_work_status, executionId]
        );
        res.json({ message: "Applicant status updated successfully" });
    } catch (error) {
        console.error("Error updating applicant status:", error);
        res.status(500).json({ detail: "Error updating applicant status" });
    }
});

// Create files directory if it doesn't exist
const filesDir = path.join(__dirname, "files");
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}

// Configure multer for file storage
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, filesDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileUpload = multer({
    storage: fileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === "application/pdf" ||
            file.mimetype === "application/msword" ||
            file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file format. Please upload PDF or Word document."), false);
        }
    },
});

// Serve static files from files directory
app.use('/files', express.static(path.join(__dirname, 'files')));

// File upload endpoint
app.post("/api/work-executions/:executionId/upload", verifyToken, fileUpload.single('file'), async (req, res) => {
    const { executionId } = req.params;

    if (!req.file) {
        return res.status(400).json({ detail: "No file uploaded" });
    }

    try {
        const [applicant] = await executeQuery(
            "SELECT a.user_id FROM applicant a JOIN job_applications ja ON a.applicant_id = ja.applicant_id JOIN work_execution we ON ja.application_id = we.application_id WHERE we.execution_id = ?",
            [executionId]
        );

        if (!applicant || req.user.user_id !== applicant.user_id) {
            return res.status(403).json({ detail: "Unauthorized access" });
        }

        const filePath = `/files/${req.file.filename}`;
        await executeQuery(
            "UPDATE work_execution SET deliverables_file_path = ? WHERE execution_id = ?",
            [filePath, executionId]
        );

        res.json({ message: "File uploaded successfully", file_path: filePath });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ detail: "Error uploading file" });
    }
});

//employer work execution
app.get("/api/work-executions/employer/:empId", async (req, res) => {
    const { empId } = req.params;
    try {
        const sql = `
        SELECT 
          we.execution_id,
          a.name AS applicant_name,
          a.email,
          a.contact_number,
          we.work_status,
          we.app_work_status,
          we.deliverables_file_path,
          jp.job_title,
          ja.applicant_id,
          COALESCE(r.payment_status, 'Not Paid') AS payment_status,
          r.payment_amount,
          r.payment_date
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN applicant a ON ja.applicant_id = a.applicant_id
        JOIN job_posts jp ON ja.job_id = jp.job_id
        LEFT JOIN remunerations r ON we.execution_id = r.execution_id
        WHERE jp.emp_id = ?
      `;
        const workExecutions = await executeQuery(sql, [empId]);
        res.json(workExecutions);
    } catch (error) {
        console.error("Error fetching work executions:", error);
        res.status(500).json({ detail: "Error fetching work executions" });
    }
});
// Update work_execution status
app.put("/api/work-executions/:executionId/status", verifyToken, async (req, res) => {
    const { executionId } = req.params;
    const { work_status } = req.body;

    // Validate work_status
    const validStatuses = ["Assigned", "In Progress", "On Hold", "Completed", "Paid", "Cancelled"];
    if (!validStatuses.includes(work_status)) {
        return res.status(400).json({ detail: "Invalid work status" });
    }

    try {
        // Check if the work execution exists and belongs to the employer's job
        const sqlCheck = `
        SELECT we.execution_id
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN job_posts jp ON ja.job_id = jp.job_id
        JOIN employer e ON jp.emp_id = e.emp_id
        WHERE we.execution_id = ? AND e.user_id = ?
      `;
        const [execution] = await executeQuery(sqlCheck, [executionId, req.user.user_id]);

        if (!execution) {
            return res.status(404).json({ detail: "Work execution not found or unauthorized" });
        }

        // Update the work_status
        const sqlUpdate = "UPDATE work_execution SET work_status = ? WHERE execution_id = ?";
        await executeQuery(sqlUpdate, [work_status, executionId]);

        res.json({ message: "Work status updated successfully" });
    } catch (error) {
        console.error("Error updating work status:", error);
        res.status(500).json({ detail: "Error updating work status" });
    }
});


// Approve Application and Insert Work Execution
app.put("/api/applications/:applicationId/approve", async (req, res) => {
    const { applicationId } = req.params;

    try {
        // Start a transaction
        await executeQuery("START TRANSACTION");

        // Get the job_id from the job_applications table
        const [application] = await executeQuery(
            "SELECT job_id FROM job_applications WHERE application_id = ?",
            [applicationId]
        );

        if (!application) {
            await executeQuery("ROLLBACK");
            return res.status(404).json({ detail: "Application not found" });
        }

        const jobId = application.job_id;

        // Check current vacancies for the job
        const [job] = await executeQuery(
            "SELECT vacancies FROM job_posts WHERE job_id = ?",
            [jobId]
        );

        if (!job || job.vacancies <= 0) {
            await executeQuery("ROLLBACK");
            return res.status(400).json({ detail: "No vacancies available for this job" });
        }

        // Update application status to "approved"
        await executeQuery(
            "UPDATE job_applications SET application_status = 'approved' WHERE application_id = ?",
            [applicationId]
        );

        // Decrement vacancies in job_posts
        await executeQuery(
            "UPDATE job_posts SET vacancies = vacancies - 1 WHERE job_id = ?",
            [jobId]
        );

        // Insert record into work_execution table
        await executeQuery(
            "INSERT INTO work_execution (application_id, work_status) VALUES (?, 'assigned')",
            [applicationId]
        );

        // Commit the transaction
        await executeQuery("COMMIT");

        res.json({ message: "Application approved, vacancies updated, and work execution created" });
    } catch (error) {
        // Rollback the transaction on error
        await executeQuery("ROLLBACK");
        console.error("Error approving application:", error);
        res.status(500).json({ detail: "Error processing the request" });
    }
});

// Reject Application
app.put("/api/applications/:applicationId/reject", async (req, res) => {
    const { applicationId } = req.params;
    try {
        await executeQuery("UPDATE job_applications SET application_status = 'rejected' WHERE application_id = ?", [applicationId]);
        res.json({ message: "Application rejected" });
    } catch (error) {
        console.error("Error rejecting application:", error);
        res.status(500).json({ detail: "Error processing the request" });
    }
});

// Update the GET applications endpoint
app.get("/api/applications/user/:userId", verifyToken, async (req, res) => {
    const userId = req.params.userId;

    try {
        console.log("1. Received request for userId:", userId);

        // First get the applicant_id for this user_id
        const [applicant] = await executeQuery(
            "SELECT applicant_id FROM applicant WHERE user_id = ?",
            [userId]
        );

        console.log("2. Query result for applicant:", applicant);

        if (!applicant) {
            console.log("3. No applicant found for userId:", userId);
            return res.status(404).json({
                detail: "Applicant profile not found. Please complete your profile first."
            });
        }

        // Fetch applications with job post details
        const sql = `
            SELECT 
                ja.application_id,
                jp.job_title,
                jp.job_description,
                jp.job_category,
                jp.required_skills,
                jp.salary,
                jp.application_deadline,
                jp.work_deadline,
                jp.status AS job_status,
                ja.application_status,
                ja.applied_at
            FROM job_applications ja
            JOIN job_posts jp ON ja.job_id = jp.job_id
            WHERE ja.applicant_id = ?
            ORDER BY ja.applied_at DESC
        `;

        console.log("4. Searching applications for applicant_id:", applicant.applicant_id);
        const applications = await executeQuery(sql, [applicant.applicant_id]);
        console.log("5. Found applications:", applications);

        res.json(applications);
    } catch (error) {
        console.error("Server Error in applications:", error);
        res.status(500).json({ detail: "Error fetching applications" });
    }
});

// Add these chat-related routes to your server.js file

// Get all chat connections for an employer
app.get("/api/chat/employer/:employerId", verifyToken, async (req, res) => {
    const { employerId } = req.params;

    // Verify the user has access to this employer's data
    if (req.user.user_type !== 'employer' || req.user.user_id !== parseInt(employerId)) {
        return res.status(403).json({ detail: "Unauthorized access" });
    }

    try {
        const sql = `
            SELECT 
                cc.connection_id,
                cc.applicant_id,
                a.name AS applicant_name,
                a.email AS applicant_email,
                (SELECT COUNT(*) FROM chat_messages 
                 WHERE receiver_id = ? AND sender_id = cc.applicant_id 
                 AND is_read = FALSE) AS unread_count,
                (SELECT MAX(timestamp) FROM chat_messages 
                 WHERE (sender_id = ? AND receiver_id = cc.applicant_id) 
                 OR (sender_id = cc.applicant_id AND receiver_id = ?)) AS last_message_time
            FROM chat_connections cc
            JOIN applicant a ON cc.applicant_id = a.user_id
            WHERE cc.employer_id = ? AND cc.status = 'active'
            ORDER BY last_message_time DESC
        `;

        const connections = await executeQuery(sql, [employerId, employerId, employerId, employerId]);
        res.json(connections);
    } catch (error) {
        console.error("Error fetching chat connections:", error);
        res.status(500).json({ detail: "Error fetching chat connections" });
    }
});

// Get all chat connections for an applicant
app.get("/api/chat/applicant/:applicantId", verifyToken, async (req, res) => {
    const { applicantId } = req.params;

    // Verify the user has access to this applicant's data
    if (req.user.user_type !== 'applicant' || req.user.user_id !== parseInt(applicantId)) {
        return res.status(403).json({ detail: "Unauthorized access" });
    }

    try {
        const sql = `
            SELECT 
                cc.connection_id,
                cc.employer_id,
                e.company_name,
                e.email AS employer_email,
                (SELECT COUNT(*) FROM chat_messages 
                 WHERE receiver_id = ? AND sender_id = cc.employer_id 
                 AND is_read = FALSE) AS unread_count,
                (SELECT MAX(timestamp) FROM chat_messages 
                 WHERE (sender_id = ? AND receiver_id = cc.employer_id) 
                 OR (sender_id = cc.employer_id AND receiver_id = ?)) AS last_message_time
            FROM chat_connections cc
            JOIN employer e ON cc.employer_id = e.user_id
            WHERE cc.applicant_id = ? AND cc.status = 'active'
            ORDER BY last_message_time DESC
        `;

        const connections = await executeQuery(sql, [applicantId, applicantId, applicantId, applicantId]);
        res.json(connections);
    } catch (error) {
        console.error("Error fetching chat connections:", error);
        res.status(500).json({ detail: "Error fetching chat connections" });
    }
});

// Get chat history between employer and applicant
app.get("/api/chat/messages/:userId/:otherUserId", verifyToken, async (req, res) => {
    const { userId, otherUserId } = req.params;

    // Ensure the authenticated user is fetching their own messages
    if (req.user.user_id !== parseInt(userId)) {
        return res.status(403).json({ detail: "Unauthorized access" });
    }

    try {
        // Retrieve messages between the two users
        const sql = `
            SELECT message_id, sender_id, receiver_id, message_text, timestamp, is_read
            FROM chat_messages
            WHERE (sender_id = ? AND receiver_id = ?)
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY timestamp ASC
        `;

        const messages = await executeQuery(sql, [userId, otherUserId, otherUserId, userId]);

        // Mark messages as read when fetching
        await executeQuery(`
            UPDATE chat_messages SET is_read = TRUE 
            WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
        `, [otherUserId, userId]);

        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ detail: "Error fetching chat messages" });
    }
});

// Send a new message
app.post("/api/chat/messages", verifyToken, async (req, res) => {
    const { receiver_id, message_text, sender_type } = req.body;
    const sender_id = req.user.user_id;

    if (!receiver_id || !message_text || !sender_type) {
        return res.status(400).json({ detail: "Missing required fields" });
    }

    try {
        // Check if a connection exists between these users
        let connectionSQL;
        let connectionParams;

        if (sender_type === 'employer') {
            connectionSQL = "SELECT * FROM chat_connections WHERE employer_id = ? AND applicant_id = ?";
            connectionParams = [sender_id, receiver_id];
        } else {
            connectionSQL = "SELECT * FROM chat_connections WHERE employer_id = ? AND applicant_id = ?";
            connectionParams = [receiver_id, sender_id];
        }

        const connections = await executeQuery(connectionSQL, connectionParams);

        // If no connection exists, create one
        if (connections.length === 0) {
            if (sender_type === 'employer') {
                await executeQuery(
                    "INSERT INTO chat_connections (employer_id, applicant_id) VALUES (?, ?)",
                    [sender_id, receiver_id]
                );
            } else {
                await executeQuery(
                    "INSERT INTO chat_connections (employer_id, applicant_id) VALUES (?, ?)",
                    [receiver_id, sender_id]
                );
            }
        } else {
            // Update last activity time
            await executeQuery(
                "UPDATE chat_connections SET last_activity = NOW() WHERE connection_id = ?",
                [connections[0].connection_id]
            );
        }

        // Insert the message
        const result = await executeQuery(
            "INSERT INTO chat_messages (sender_id, receiver_id, message_text, sender_type) VALUES (?, ?, ?, ?)",
            [sender_id, receiver_id, message_text, sender_type]
        );

        res.status(201).json({
            message_id: result.insertId,
            sender_id,
            receiver_id,
            message_text,
            timestamp: new Date(),
            is_read: false,
            sender_type
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ detail: "Error sending message" });
    }
});

// Create a new chat connection
app.post("/api/chat/connections", verifyToken, async (req, res) => {
    const { employer_id, applicant_id } = req.body;

    // Validate the request
    if (!employer_id || !applicant_id) {
        return res.status(400).json({ detail: "Missing required fields" });
    }

    // Verify that the user is either the employer or applicant
    if (req.user.user_id !== parseInt(employer_id) && req.user.user_id !== parseInt(applicant_id)) {
        return res.status(403).json({ detail: "Unauthorized access" });
    }

    try {
        // Check if connection already exists
        const existingConnections = await executeQuery(
            "SELECT * FROM chat_connections WHERE employer_id = ? AND applicant_id = ?",
            [employer_id, applicant_id]
        );

        if (existingConnections.length > 0) {
            // If archived, reactivate it
            if (existingConnections[0].status === 'archived') {
                await executeQuery(
                    "UPDATE chat_connections SET status = 'active', last_activity = NOW() WHERE connection_id = ?",
                    [existingConnections[0].connection_id]
                );
            }

            return res.json({
                connection_id: existingConnections[0].connection_id,
                message: "Chat connection already exists"
            });
        }

        // Create new connection
        const result = await executeQuery(
            "INSERT INTO chat_connections (employer_id, applicant_id) VALUES (?, ?)",
            [employer_id, applicant_id]
        );

        res.status(201).json({
            connection_id: result.insertId,
            employer_id,
            applicant_id,
            message: "Chat connection created successfully"
        });
    } catch (error) {
        console.error("Error creating chat connection:", error);
        res.status(500).json({ detail: "Error creating chat connection" });
    }
});

// Get unread messages count
app.get("/api/chat/unread/:userId", verifyToken, async (req, res) => {
    const { userId } = req.params;

    // Verify user authorization
    if (req.user.user_id !== parseInt(userId)) {
        return res.status(403).json({ detail: "Unauthorized access" });
    }

    try {
        const sql = "SELECT COUNT(*) AS unread_count FROM chat_messages WHERE receiver_id = ? AND is_read = FALSE";
        const [result] = await executeQuery(sql, [userId]);

        res.json({ unread_count: result.unread_count });
    } catch (error) {
        console.error("Error getting unread count:", error);
        res.status(500).json({ detail: "Error getting unread messages count" });
    }
});

// Get work execution details for payment
app.get("/api/work-executions/employer/details/:executionId", verifyToken, async (req, res) => {
    const { executionId } = req.params;
    try {
        const sql = `
        SELECT 
          we.execution_id,
          jp.job_title,
          a.name AS applicant_name,
          ja.applicant_id,
          jp.salary,
          COALESCE(r.payment_status, 'Not Paid') AS payment_status,
          jp.emp_id  -- Add emp_id to the response
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN job_posts jp ON ja.job_id = jp.job_id
        JOIN applicant a ON ja.applicant_id = a.applicant_id
        JOIN employer e ON jp.emp_id = e.emp_id
        LEFT JOIN remunerations r ON we.execution_id = r.execution_id
        WHERE we.execution_id = ? AND e.user_id = ?
      `;
        const [workDetails] = await executeQuery(sql, [executionId, req.user.user_id]);
        if (!workDetails) {
            return res.status(404).json({ detail: "Work execution not found or unauthorized" });
        }
        res.json(workDetails);
    } catch (error) {
        console.error("Error fetching work details:", error);
        res.status(500).json({ detail: "Error fetching work details" });
    }
});

// Get user's cards
app.get("/api/cards/:userId", verifyToken, async (req, res) => {
    const { userId } = req.params;

    if (req.user.user_id !== parseInt(userId)) {
        return res.status(403).json({ detail: "Unauthorized access" });
    }

    try {
        const cards = await executeQuery(
            "SELECT card_id, card_number, expiry_date, card_holder_name FROM cards WHERE user_id = ?",
            [userId]
        );
        res.json(cards);
    } catch (error) {
        console.error("Error fetching cards:", error);
        res.status(500).json({ detail: "Error fetching cards" });
    }
});

// Add a new card
app.post("/api/cards", verifyToken, async (req, res) => {
    const { user_id, card_number, expiry_date, card_holder_name } = req.body;

    if (!user_id || !card_number || !expiry_date || !card_holder_name) {
        return res.status(400).json({ detail: "All fields are required" });
    }

    if (card_number.length !== 16 || !/^\d+$/.test(card_number)) {
        return res.status(400).json({ detail: "Invalid card number" });
    }

    try {
        const result = await executeQuery(
            "INSERT INTO cards (user_id, card_number, expiry_date, card_holder_name) VALUES (?, ?, ?, ?)",
            [user_id, card_number, expiry_date, card_holder_name]
        );

        res.status(201).json({
            card_id: result.insertId,
            user_id,
            card_number,
            expiry_date,
            card_holder_name,
        });
    } catch (error) {
        console.error("Error adding card:", error);
        res.status(500).json({ detail: "Error adding card" });
    }
});

// Process payment
app.post("/api/payments", verifyToken, async (req, res) => {
    const { execution_id, card_id, payment_amount } = req.body;

    if (!execution_id || !card_id || !payment_amount) {
        return res.status(400).json({ detail: "All fields are required" });
    }

    try {
        // Verify the work execution belongs to the employer
        const [work] = await executeQuery(
            `
        SELECT we.execution_id
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN job_posts jp ON ja.job_id = jp.job_id
        JOIN employer e ON jp.emp_id = e.emp_id
        WHERE we.execution_id = ? AND e.user_id = ?
      `,
            [execution_id, req.user.user_id]
        );

        if (!work) {
            return res.status(404).json({ detail: "Work execution not found or unauthorized" });
        }

        // Verify the card belongs to the user
        const [card] = await executeQuery(
            "SELECT card_id FROM cards WHERE card_id = ? AND user_id = ?",
            [card_id, req.user.user_id]
        );

        if (!card) {
            return res.status(404).json({ detail: "Card not found or unauthorized" });
        }

        // Insert payment record
        const result = await executeQuery(
            "INSERT INTO remunerations (card_id, execution_id, payment_amount, payment_status) VALUES (?, ?, ?, 'completed')",
            [card_id, execution_id, payment_amount]
        );

        res.status(201).json({
            payment_id: result.insertId,
            message: "Payment processed successfully",
        });
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ detail: "Error processing payment" });
    }
});

// Get payment details for an applicant
app.get("/api/payments/applicant/:executionId", verifyToken, async (req, res) => {
    const { executionId } = req.params;

    try {
        // Verify that the execution belongs to the applicant
        const sqlVerify = `
        SELECT we.execution_id
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN applicant a ON ja.applicant_id = a.applicant_id
        WHERE we.execution_id = ? AND a.user_id = ?
      `;
        const [execution] = await executeQuery(sqlVerify, [executionId, req.user.user_id]);

        if (!execution) {
            return res.status(404).json({ detail: "Work execution not found or unauthorized" });
        }

        // Fetch payment details along with job and employer info
        const sql = `
        SELECT 
          r.payment_id,
          r.payment_amount,
          r.payment_date,
          r.payment_status,
          jp.job_title,
          e.company_name AS employer_name
        FROM remunerations r
        JOIN work_execution we ON r.execution_id = we.execution_id
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN job_posts jp ON ja.job_id = jp.job_id
        JOIN employer e ON jp.emp_id = e.emp_id
        WHERE r.execution_id = ?
      `;
        const [payment] = await executeQuery(sql, [executionId]);

        if (!payment) {
            // If no payment record exists, return basic work details with "Not Paid" status
            const sqlNoPayment = `
          SELECT 
            jp.job_title,
            e.company_name AS employer_name
          FROM work_execution we
          JOIN job_applications ja ON we.application_id = ja.application_id
          JOIN job_posts jp ON ja.job_id = jp.job_id
          JOIN employer e ON jp.emp_id = e.emp_id
          WHERE we.execution_id = ?
        `;
            const [workDetails] = await executeQuery(sqlNoPayment, [executionId]);

            return res.json({
                ...workDetails,
                payment_status: "Not Paid",
            });
        }

        res.json(payment);
    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({ detail: "Error fetching payment details" });
    }
});

// New endpoint for fetching applicant feedback
app.get("/api/feedback/applicant/:applicantId", verifyToken, async (req, res) => {
    const { applicantId } = req.params;

    try {
        const sql = `
            SELECT 
                f.feedback_id,
                f.job_id,
                jp.job_title,
                e.company_name,
                f.rating,
                f.comments,
                f.created_at,
                f.is_anonymous
            FROM feedback f
            LEFT JOIN job_posts jp ON f.job_id = jp.job_id
            JOIN employer e ON f.emp_id = e.emp_id
            WHERE f.applicant_id = ? AND f.feedback_type = 'employer_to_applicant'
            ORDER BY f.created_at DESC
        `;
        const feedback = await executeQuery(sql, [applicantId]);
        res.json(feedback);
    } catch (error) {
        console.error("Error fetching applicant feedback:", error);
        res.status(500).json({ detail: "Error fetching feedback" });
    }
});

// Get feedback received by employer
app.get("/api/feedback/employer/:empId", verifyToken, async (req, res) => {
    const { empId } = req.params;

    try {
        const sql = `
            SELECT 
                f.feedback_id,
                f.job_id,
                jp.job_title,
                a.name AS applicant_name,
                f.rating,
                f.comments,
                f.created_at,
                f.is_anonymous
            FROM feedback f
            LEFT JOIN job_posts jp ON f.job_id = jp.job_id
            JOIN applicant a ON f.applicant_id = a.applicant_id
            WHERE f.emp_id = ? AND f.feedback_type = 'applicant_to_employer'
            ORDER BY f.created_at DESC
        `;
        const feedback = await executeQuery(sql, [empId]);
        res.json(feedback);
    } catch (error) {
        console.error("Error fetching employer feedback:", error);
        res.status(500).json({ detail: "Error fetching feedback" });
    }
});

// Get feedback given by employer for a specific work execution
app.get("/api/feedback/execution/:executionId", verifyToken, async (req, res) => {
    const { executionId } = req.params;

    try {
        const sql = `
            SELECT 
                f.feedback_id,
                f.rating,
                f.comments,
                f.created_at,
                f.is_anonymous
            FROM feedback f
            JOIN work_execution we ON f.applicant_id = (
                SELECT ja.applicant_id 
                FROM job_applications ja 
                WHERE ja.application_id = we.application_id
            )
            WHERE f.execution_id = ? AND f.feedback_type = 'employer_to_applicant'
        `;
        const [feedback] = await executeQuery(sql, [executionId]);
        res.json(feedback || {});
    } catch (error) {
        console.error("Error fetching execution feedback:", error);
        res.status(500).json({ detail: "Error fetching feedback" });
    }
});

// Submit feedback from employer to applicant
app.post("/api/empfeedback", verifyToken, async (req, res) => {
    const { execution_id, applicant_id, emp_id, rating, comments, is_anonymous } = req.body;

    if (!execution_id || !applicant_id || !emp_id || !rating) {
        return res.status(400).json({ detail: "Missing required fields" });
    }

    try {
        // Verify authorization
        const [execution] = await executeQuery(
            `
        SELECT we.execution_id
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        JOIN job_posts jp ON ja.job_id = jp.job_id
        JOIN employer e ON jp.emp_id = e.emp_id
        WHERE we.execution_id = ? AND e.user_id = ?
        `,
            [execution_id, req.user.user_id]
        );

        if (!execution) {
            return res.status(403).json({ detail: "Unauthorized or execution not found" });
        }

        // Fetch job_id
        const [application] = await executeQuery(
            `
        SELECT ja.job_id
        FROM job_applications ja
        JOIN work_execution we ON ja.application_id = we.application_id
        WHERE we.execution_id = ?
        `,
            [execution_id]
        );

        if (!application || !application.job_id) {
            return res.status(400).json({ detail: "No valid job associated with this execution" });
        }

        const job_id = application.job_id;

        // Insert feedback with execution_id
        const result = await executeQuery(
            `
        INSERT INTO feedback (job_id, applicant_id, emp_id, execution_id, feedback_type, rating, comments, is_anonymous, created_at)
        VALUES (?, ?, ?, ?, 'employer_to_applicant', ?, ?, ?, NOW())
        `,
            [job_id, applicant_id, emp_id, execution_id, rating, comments || null, is_anonymous ? 1 : 0]
        );

        res.status(201).json({
            feedback_id: result.insertId,
            message: "Feedback submitted successfully",
        });
    } catch (error) {
        console.error("Error submitting feedback:", error.sqlMessage || error.message);
        res.status(500).json({ detail: "Error submitting feedback: " + (error.sqlMessage || error.message) });
    }
});

// Submit feedback from applicant to employer
app.post("/api/appfeedback", verifyToken, async (req, res) => {
    const { execution_id, emp_id, applicant_id, rating, comments, is_anonymous, feedback_type } = req.body;

    if (!execution_id || !emp_id || !applicant_id || !rating || feedback_type !== "applicant_to_employer") {
        console.log("Missing or invalid fields:", { execution_id, emp_id, applicant_id, rating, feedback_type });
        return res.status(400).json({ detail: "Missing or invalid required fields" });
    }

    if (rating < 1 || rating > 5) {
        console.log("Invalid rating:", rating);
        return res.status(400).json({ detail: "Rating must be between 1 and 5" });
    }

    try {

        // Verify authorization: Check if the applicant is associated with the execution
        const [execution] = await executeQuery(
            `
        SELECT we.execution_id, ja.applicant_id
        FROM work_execution we
        JOIN job_applications ja ON we.application_id = ja.application_id
        WHERE we.execution_id = ? AND ja.applicant_id = ?
        `,
            [execution_id, applicant_id]
        );

        if (!execution) {
            console.log("Execution not found or unauthorized:", { execution_id, applicant_id });
            return res.status(403).json({ detail: "Unauthorized or execution not found" });
        }

        // Fetch job_id
        const [application] = await executeQuery(
            `
        SELECT ja.job_id
        FROM job_applications ja
        JOIN work_execution we ON ja.application_id = we.application_id
        WHERE we.execution_id = ?
        `,
            [execution_id]
        );

        if (!application || !application.job_id) {
            console.log("No valid job associated with execution:", execution_id);
            return res.status(400).json({ detail: "No valid job associated with this execution" });
        }

        const job_id = application.job_id;

        // Insert feedback
        const result = await executeQuery(
            `
        INSERT INTO feedback (job_id, emp_id, applicant_id, feedback_type, rating, comments, is_anonymous, created_at)
        VALUES (?, ?, ?, 'applicant_to_employer', ?, ?, ?, NOW())
        `,
            [
                job_id,
                emp_id,
                applicant_id,
                rating,
                comments || null,
                is_anonymous ? 1 : 0
            ]
        );

        res.status(201).json({
            feedback_id: result.insertId,
            message: "Feedback submitted successfully",
        });
    } catch (error) {
        console.error("Error submitting feedback:", error.sqlMessage || error.message);
        res.status(500).json({ detail: "Error submitting feedback: " + (error.sqlMessage || error.message) });
    }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});