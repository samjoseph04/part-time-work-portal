"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  Briefcase,
  FileText,
  CheckSquare,
  DollarSign,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Grid,
  Mail,
  Phone,
  Award,
  Calendar,
  Clock,
  Filter,
  Upload,
  Download,
  MessageSquare,
  Edit,
  AlertTriangle,
  BookOpen,
  Heart,
  Star
} from "lucide-react"
import "./applicant-dashboard.css"

const ApplicantDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [workExecutions, setWorkExecutions] = useState([])
  const [feedbackReceived, setFeedbackReceived] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userId, setUserId] = useState(null)
  const [applicantId, setApplicantId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState({})
  const [applicant, setApplicant] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [errorProfile, setErrorProfile] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [savedJobs, setSavedJobs] = useState([])
  const [categoryFilter, setCategoryFilter] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        console.log("No token found")
        navigate("/login")
        return
      }

      try {
        const decoded = jwtDecode(token)
        if (decoded.user_type !== "applicant") {
          console.log("User is not an applicant")
          navigate("/login")
          return
        }

        setUserId(decoded.user_id)
        await fetchApplicantIdAndProfile(decoded.user_id, token)

        if (applicantId) {
          await fetchData(token, decoded.user_id)
        }
      } catch (error) {
        console.error("Token decode error:", error)
        localStorage.removeItem("token")
        navigate("/login")
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()
  }, [navigate, applicantId])

  useEffect(() => {
    if (applicantId) {
      fetchFeedbackReceived()
    }
  }, [applicantId])

  const fetchApplicantIdAndProfile = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/applicant/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 200) {
        setApplicantId(response.data.applicant_id)
        setApplicant(response.data)
        setLoadingProfile(false)
      } else {
        console.error("Failed to fetch applicant data")
        setErrorProfile("Failed to fetch applicant data")
        setLoadingProfile(false)
      }
    } catch (error) {
      console.error("Error fetching applicant data:", error)
      setErrorProfile("Error fetching applicant profile")
      setLoadingProfile(false)
    }
  }

  const fetchData = async (token, currentUserId) => {
    try {
      await Promise.all([
        fetchJobs(token),
        fetchApplications(token, currentUserId),
        fetchWorkExecutions(token, currentUserId),
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const fetchJobs = async (token) => {
    try {
      const response = await axios.get("http://localhost:8000/api/job-posts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setJobs(response.data)
      setSavedJobs(response.data.slice(0, 3).map((job) => job.job_id))
    } catch (error) {
      console.error("Error fetching jobs:", error)
    }
  }

  const fetchApplications = async (token, currentUserId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/applications/user/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      if (Array.isArray(response.data)) {
        setApplications(response.data)
      } else {
        console.error("Unexpected response format:", response.data)
        setApplications([])
      }
    } catch (error) {
      console.error("Error fetching applications:", error.response?.data)
      setApplications([])
      if (error.response?.status === 401) {
        alert("Session expired. Please log in again.")
        navigate("/login")
      } else if (error.response?.status === 404) {
        alert("Please complete your applicant profile first.")
      }
    }
  }

  const fetchWorkExecutions = async (token, currentUserId) => {
    if (!currentUserId) return
    try {
      const response = await axios.get(`http://localhost:8000/api/work-executions/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWorkExecutions(response.data)
    } catch (error) {
      console.error("Error fetching work executions:", error)
    }
  }

  const fetchFeedbackReceived = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:8000/api/feedback/applicant/${applicantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFeedbackReceived(response.data)
    } catch (error) {
      console.error("Error fetching feedback:", error)
    }
  }

  const handleStatusChange = async (executionId, newStatus) => {
    const token = localStorage.getItem("token")
    try {
      await axios.put(
        `http://localhost:8000/api/work-executions/${executionId}/applicant-status`,
        { app_work_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setWorkExecutions((prev) =>
        prev.map((exec) => (exec.execution_id === executionId ? { ...exec, app_work_status: newStatus } : exec)),
      )
      alert("Status updated successfully!")
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status.")
    }
  }

  const handleFileUpload = async (executionId) => {
    const token = localStorage.getItem("token")
    const file = selectedFiles[executionId]
    if (!file) {
      alert("Please select a file to upload.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await axios.post(`http://localhost:8000/api/work-executions/${executionId}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      })
      setWorkExecutions((prev) =>
        prev.map((exec) =>
          exec.execution_id === executionId ? { ...exec, deliverables_file_path: response.data.file_path } : exec,
        ),
      )
      alert("File uploaded successfully!")
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file.")
    }
  }

  const handleApplyJob = async (jobId) => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Authorization error: Please log in again.")
      navigate("/login")
      return
    }
    try {
      const response = await axios.post(
        "http://localhost:8000/api/applications",
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
      )
      if (response.status === 201) {
        alert("Application submitted successfully!")
        await fetchApplications(token, userId)
      }
    } catch (error) {
      console.error("Application error:", error.response?.data)
      if (error.response?.status === 401) {
        alert("Session expired. Please log in again.")
        navigate("/login")
      } else if (error.response?.status === 400) {
        alert(error.response.data?.detail || "You have already applied for this job.")
      } else {
        alert("Error applying for job. Please try again later.")
      }
    }
  }

  const handleChat = async (executionId) => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
      return
    }
    try {
      const execution = workExecutions.find((exec) => exec.execution_id === executionId)
      if (!execution) {
        console.error("Work execution not found for ID:", executionId)
        return
      }
      const jobResponse = await axios.get("http://localhost:8000/api/job-posts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const job = jobResponse.data.find((j) => j.job_title === execution.job_title)
      if (!job) {
        console.error("Job not found for title:", execution.job_title)
        return
      }
      const employerUserId = job.emp_user_id
      navigate(`/chat/ApplicantChat?employerId=${employerUserId}`)
    } catch (error) {
      console.error("Error handling chat:", error)
      alert("Failed to initialize chat. Please try again.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const handleDisableAccount = async () => {
    try {
      const newStatus = applicant.status === 1 ? 0 : 1
      await axios.put(
        `http://localhost:8000/api/applicant/${applicant.user_id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      )
      setApplicant({ ...applicant, status: newStatus })
      alert(`Account ${newStatus === 1 ? "enabled" : "disabled"} successfully!`)
    } catch (error) {
      console.error("Error updating account status:", error)
      alert("Error updating account status.")
    }
  }

  const downloadResume = () => {
    if (applicant?.resume_url) {
      window.open(applicant.resume_url, "_blank")
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter((id) => id !== jobId))
    } else {
      setSavedJobs([...savedJobs, jobId])
    }
  }

  const toggleFilter = () => {
    setFilterOpen(!filterOpen)
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter ? job.job_category === categoryFilter : true
    return matchesSearch && matchesCategory
  })

  const jobCategories = [...new Set(jobs.map((job) => job.job_category))].filter(Boolean)

  const dashboardStats = [
    {
      title: "Applied Jobs",
      value: applications.length,
      icon: <Briefcase />,
      color: "blue",
    },
    {
      title: "Active Work",
      value: workExecutions.filter((exec) => exec.work_status === "In Progress").length,
      icon: <CheckSquare />,
      color: "green",
    },
    {
      title: "Completed Work",
      value: workExecutions.filter((exec) => exec.work_status === "Completed").length,
      icon: <Award />,
      color: "purple",
    },
    {
      title: "Saved Jobs",
      value: savedJobs.length,
      icon: <Heart />,
      color: "orange",
    },
  ]

  const renderDashboard = () => (
    <div className="dashboard-overview">
      <div className="welcome-section">
        <div className="welcome-text">
          <h2>Welcome to JobEasy Applicant Dashboard</h2>
          <p>Find and apply for jobs, manage your applications, and track your work all in one place</p>
        </div>
      </div>

      <div className="stats-grid">
        {dashboardStats.map((stat, index) => (
          <div className={`stat-card ${stat.color}`} key={index}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Recent Applications</h3>
          <div className="activity-list">
            {applications.slice(0, 5).map((app, index) => (
              <div className="activity-item" key={index}>
                <div className="activity-icon">
                  <Briefcase size={18} />
                </div>
                <div className="activity-details">
                  <p>
                    <strong>{app.job_title}</strong>
                  </p>
                  <span className="activity-time">Applied on: {new Date(app.applied_at).toLocaleDateString()}</span>
                  <span className={`status-badge ${app.application_status.toLowerCase()}`}>
                    {app.application_status}
                  </span>
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="no-data">No recent applications</p>}
          </div>
        </div>
        <div className="chart-container">
          <h3>Recommended Jobs</h3>
          <div className="recommended-jobs">
            {jobs.slice(0, 3).map((job) => (
              <div className="recommended-job-item" key={job.job_id}>
                <h4>{job.job_title}</h4>
                <div className="job-details">
                  <span className="job-category">{job.job_category}</span>
                  <span className="job-salary">₹{job.salary}</span>
                </div>
                <button onClick={() => setActiveTab("jobSearch")} className="view-job-button">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderJobSearch = () => (
    <div className="job-search-section">
      <div className="section-header">
        <h2>Available Jobs</h2>
        <div className="search-filter">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search job title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="filter-button" onClick={toggleFilter}>
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Job Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {jobCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <button
            className="clear-filter-button"
            onClick={() => {
              setCategoryFilter("")
              setSearchQuery("")
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {filteredJobs.length > 0 ? (
        <div className="job-cards-grid">
          {filteredJobs.map((job) => (
            <div className="job-card" key={job.job_id}>
              <div className="job-card-header">
                <h3>{job.job_title}</h3>
                <button
                  className={`save-job-button ${savedJobs.includes(job.job_id) ? "saved" : ""}`}
                  onClick={() => toggleSaveJob(job.job_id)}
                >
                  <Heart size={18} />
                </button>
              </div>
              <div className="job-card-body">
                <div className="job-detail">
                  <Briefcase size={16} />
                  <span>{job.job_category}</span>
                </div>
                <div className="job-detail">
                  <DollarSign size={16} />
                  <span>₹{job.salary}</span>
                </div>
                <div className="job-detail">
                  <Calendar size={16} />
                  <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                </div>
                <p className="job-description">{job.job_description}</p>
                <div className="job-skills">
                  <strong>Required Skills:</strong> {job.required_skills}
                </div>
              </div>
              <div className="job-card-footer">
                <button onClick={() => handleApplyJob(job.job_id)} className="apply-button">
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data-container">
          <img src="/place.svg" alt="No jobs" />
          <p>No jobs found matching your criteria.</p>
          <button
            className="action-button"
            onClick={() => {
              setCategoryFilter("")
              setSearchQuery("")
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )

  const renderApplications = () => (
    <div className="applications-section">
      <div className="section-header">
        <h2>My Applications</h2>
        <div className="search-filter">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {applications.length > 0 ? (
        <div className="applications-grid">
          {applications
            .filter((app) => app.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((app) => (
              <div key={app.application_id} className="application-card">
                <div className="application-header">
                  <h3>{app.job_title}</h3>
                  <span className={`status-badge ${app.application_status.toLowerCase()}`}>
                    {app.application_status}
                  </span>
                </div>
                <div className="application-body">
                  <div className="application-detail">
                    <Briefcase size={16} />
                    <span>
                      <strong>Category:</strong> {app.job_category}
                    </span>
                  </div>
                  <div className="application-detail">
                    <DollarSign size={16} />
                    <span>
                      <strong>Salary:</strong> ₹{app.salary}
                    </span>
                  </div>
                  <div className="application-detail">
                    <Calendar size={16} />
                    <span>
                      <strong>Deadline:</strong> {new Date(app.application_deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="application-detail">
                    <Clock size={16} />
                    <span>
                      <strong>Applied:</strong> {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="application-description">{app.job_description}</p>
                </div>
                <div className="application-footer">
                  <div className="application-skills">
                    <strong>Required Skills:</strong> {app.required_skills}
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="no-data-container">
          <img src="/place.svg" alt="No applications" />
          <p>You haven't applied to any jobs yet.</p>
          <button className="action-button" onClick={() => setActiveTab("jobSearch")}>
            Browse Jobs
          </button>
        </div>
      )}
    </div>
  )

  const renderWorkExecutions = () => (
    <div className="work-executions-section">
      <div className="section-header">
        <h2>Work Dashboard</h2>
        <div className="search-filter">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search work executions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {workExecutions.length > 0 ? (
        <div className="work-executions-grid">
          {workExecutions
            .filter((execution) => execution.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((execution) => (
              <div key={execution.execution_id} className="work-card">
                <div className="work-card-header">
                  <h3>{execution.job_title}</h3>
                  <div className="status-dropdown-container">
                    <select
                      value={execution.app_work_status || "In Progress"}
                      onChange={(e) => handleStatusChange(execution.execution_id, e.target.value)}
                      className={`status-dropdown ${(execution.app_work_status || "in-progress").toLowerCase().replace(" ", "-")}`}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="work-card-body">
                  <div className="work-detail">
                    <Briefcase size={16} />
                    <span>
                      <strong>Employer:</strong> {execution.company_name}
                    </span>
                  </div>
                  <div className="work-detail">
                    <Mail size={16} />
                    <span>
                      <strong>Email:</strong> {execution.email}
                    </span>
                  </div>
                  <div className="work-detail">
                    <CheckSquare size={16} />
                    <span>
                      <strong>Employer Status:</strong> {execution.work_status}
                    </span>
                  </div>
                  <p className="work-description">{execution.job_description}</p>
                </div>
                <div className="work-card-actions">
                  <div className="file-upload-container">
                    <label className="file-upload-label">
                      <input
                        type="file"
                        className="file-input"
                        onChange={(e) =>
                          setSelectedFiles({
                            ...selectedFiles,
                            [execution.execution_id]: e.target.files[0],
                          })
                        }
                      />
                      <Upload size={16} /> Choose File
                    </label>
                    <button
                      onClick={() => handleFileUpload(execution.execution_id)}
                      className="action-button upload"
                      disabled={!selectedFiles[execution.execution_id]}
                    >
                      <Upload size={16} /> Upload
                    </button>
                  </div>

                  {execution.deliverables_file_path && (
                    <button
                      onClick={() => window.open(`http://localhost:8000${execution.deliverables_file_path}`, "_blank")}
                      className="action-button download"
                    >
                      <Download size={16} /> Download
                    </button>
                  )}

                  <button onClick={() => handleChat(execution.execution_id)} className="action-button chat">
                    <MessageSquare size={16} /> Chat
                  </button>

                  <button
                    onClick={() => navigate(`/payment/ApplicantPayment?executionId=${execution.execution_id}`)}
                    className="action-button payment"
                  >
                    <DollarSign size={16} /> Payment
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/feedback/applicant-feedback?executionId=${execution.execution_id}`, {
                        state: {
                          empId: execution.emp_id,
                          jobTitle: execution.job_title,
                          companyName: execution.company_name,
                        },
                      })
                    }
                    className="action-button feedback"
                  >
                    <Star size={16} /> Feedback
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="no-data-container">
          <img src="/place.svg" alt="No work executions" />
          <p>You don't have any active work executions.</p>
          <p className="no-data-subtext">Apply for jobs to get started!</p>
        </div>
      )}
    </div>
  )

  const renderFeedback = () => (
    <div className="feedback-section">
      <div className="section-header">
        <h2>Feedback Received</h2>
        <div className="search-filter">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {feedbackReceived.length > 0 ? (
        <div className="feedback-grid">
          {feedbackReceived
            .filter(
              (fb) =>
                fb.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (fb.job_title && fb.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (fb.comments && fb.comments.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map((fb) => (
              <div key={fb.feedback_id} className="feedback-card">
                <div className="feedback-header">
                  <div className="applicant-avatar">
                    {fb.is_anonymous ? "?" : fb.company_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="feedback-info">
                    <h3>{fb.is_anonymous ? "Anonymous" : fb.company_name}</h3>
                    {fb.job_title && (
                      <p>
                        <strong>Job:</strong> {fb.job_title}
                      </p>
                    )}
                  </div>
                </div>
                <div className="feedback-body">
                  <div className="feedback-detail">
                    <Star size={16} />
                    <span>
                      <strong>Rating:</strong> {fb.rating}/5
                    </span>
                  </div>
                  <p>
                    <strong>Comments:</strong> {fb.comments || "No comments provided"}
                  </p>
                  <div className="feedback-detail">
                    <Calendar size={16} />
                    <span>{new Date(fb.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="no-data-container">
          <img src="/place.svg?height=150&width=150" alt="No feedback" />
          <p>No feedback received yet.</p>
        </div>
      )}
    </div>
  )

  const renderProfile = () => (
    <div className="profile-section">
      <h2>Applicant Profile</h2>
      {loadingProfile ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      ) : errorProfile ? (
        <div className="error-message">{errorProfile}</div>
      ) : applicant ? (
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{applicant.name ? applicant.name.charAt(0).toUpperCase() : "A"}</div>
            <div className="profile-title">
              <h3>{applicant.name}</h3>
            </div>
          </div>

          <div className="profile-body">
            <div className="profile-field">
              <User size={18} />
              <div>
                <label>Name</label>
                <span>{applicant.name}</span>
              </div>
            </div>

            <div className="profile-field">
              <Mail size={18} />
              <div>
                <label>Email</label>
                <span>{applicant.email}</span>
              </div>
            </div>

            <div className="profile-field">
              <Phone size={18} />
              <div>
                <label>Contact Number</label>
                <span>{applicant.contact_number}</span>
              </div>
            </div>

            <div className="profile-field">
              <Award size={18} />
              <div>
                <label>Skills</label>
                <span>{applicant.skills}</span>
              </div>
            </div>

            <div className="profile-field">
              <Briefcase size={18} />
              <div>
                <label>Experience</label>
                <span>{applicant.experience}</span>
              </div>
            </div>

            <div className="profile-field">
              <BookOpen size={18} />
              <div>
                <label>Job Preference</label>
                <span>{applicant.preference}</span>
              </div>
            </div>

            <div className="profile-field">
              <FileText size={18} />
              <div>
                <label>Resume</label>
                {applicant.resume_path ? (
                  <button onClick={downloadResume} className="resume-button">
                    <Download size={16} /> Download Resume
                  </button>
                ) : (
                  <span className="no-resume">No resume uploaded</span>
                )}
              </div>
            </div>

            <div className="profile-field">
              <Calendar size={18} />
              <div>
                <label>Registration Date</label>
                <span>{new Date(applicant.reg_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button
              onClick={handleDisableAccount}
              className={`action-button ${applicant.status === 1 ? "disable" : "enable"}`}
            >
              {applicant.status === 1 ? (
                <>
                  <AlertTriangle size={16} /> Disable Account
                </>
              ) : (
                <>
                  <CheckSquare size={16} /> Enable Account
                </>
              )}
            </button>

            <Link to="/edit-applicant-profile" className="action-button edit">
              <Edit size={16} /> Edit Profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="no-data-container">
          <p>No applicant data found</p>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      )
    }

    switch (activeTab) {
      case "dashboard":
        return renderDashboard()
      case "jobSearch":
        return renderJobSearch()
      case "applications":
        return renderApplications()
      case "workExecutions":
        return renderWorkExecutions()
      case "feedback":
        return renderFeedback()
      case "profile":
        return renderProfile()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className={`applicant-dashboard ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <h1>JobEasy</h1>
          </Link>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === "dashboard" ? "active" : ""}>
              <button onClick={() => setActiveTab("dashboard")}>
                <Grid />
                <span>Dashboard</span>
              </button>
            </li>
            <li className={activeTab === "jobSearch" ? "active" : ""}>
              <button onClick={() => setActiveTab("jobSearch")}>
                <Briefcase />
                <span>Find Jobs</span>
              </button>
            </li>
            <li className={activeTab === "applications" ? "active" : ""}>
              <button onClick={() => setActiveTab("applications")}>
                <FileText />
                <span>Applications</span>
              </button>
            </li>
            <li className={activeTab === "workExecutions" ? "active" : ""}>
              <button onClick={() => setActiveTab("workExecutions")}>
                <CheckSquare />
                <span>Work Dashboard</span>
              </button>
            </li>
            <li className={activeTab === "feedback" ? "active" : ""}>
              <button onClick={() => setActiveTab("feedback")}>
                <Star />
                <span>Feedback</span>
              </button>
            </li>
            <li className={activeTab === "profile" ? "active" : ""}>
              <button onClick={() => setActiveTab("profile")}>
                <User />
                <span>Profile</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="log-button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, " $1")}</h2>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => setActiveTab("jobSearch")}
              />
            </div>
            <div className="applicant-profile">
              <span>{applicant?.name || "Applicant"}</span>
              <div className="profile-avatar">{applicant?.name ? applicant.name.charAt(0).toUpperCase() : "A"}</div>
            </div>
          </div>
        </header>

        <div className="content-container">{renderContent()}</div>
      </main>
    </div>
  )
}

export default ApplicantDashboard