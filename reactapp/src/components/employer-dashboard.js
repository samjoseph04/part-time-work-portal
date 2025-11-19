"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  Users,
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
  Building,
  Mail,
  Phone,
  MapPin,
  Plus,
  Download,
  MessageSquare,
  Calendar,
  Clock,
  Filter,
  Star,
} from "lucide-react"
import "./employer-dashboard.css"

const EmployerDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [jobPosts, setJobPosts] = useState([])
  const [applications, setApplications] = useState([])
  const [workExecutions, setWorkExecutions] = useState([])
  const [feedbackReceived, setFeedbackReceived] = useState([])
  const [empId, setEmpId] = useState(null)
  const [myJobPosts, setMyJobPosts] = useState([])
  const [employer, setEmployer] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [errorProfile, setErrorProfile] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newJobPost, setNewJobPost] = useState({
    emp_id: null,
    emp_user_id: null,
    job_title: "",
    job_description: "",
    job_category: "",
    required_skills: "",
    salary: "",
    vacancies: "",
    application_deadline: "",
    work_deadline: "",
    status: "active",
  })
  const [feedbackForm, setFeedbackForm] = useState({
    executionId: null,
    applicantId: null,
    rating: 0,
    comments: "",
    isAnonymous: false,
  })
  const [existingFeedbacks, setExistingFeedbacks] = useState({})

  const jobCategories = [
    "Digital Marketing",
    "IT",
    "Social Media Marketing",
    "Content Creation",
    "Data Entry",
    "Design",
    "Customer Service",
  ]
  const workStatusOptions = ["Assigned", "In Progress", "On Hold", "Completed", "Cancelled"]

  useEffect(() => {
    fetchEmpIdAndProfile()
  }, [])

  useEffect(() => {
    if (empId) {
      fetchJobPosts()
      fetchApplications()
      fetchWorkExecutions()
      fetchMyJobPosts()
      fetchFeedbackReceived()
    }
  }, [empId])

  useEffect(() => {
    const fetchAllFeedback = async () => {
      const feedbackData = {}
      await Promise.all(
        workExecutions.map(async (execution) => {
          try {
            const token = localStorage.getItem("token")
            const response = await axios.get(`http://localhost:8000/api/feedback/execution/${execution.execution_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            feedbackData[execution.execution_id] = response.data
          } catch (error) {
            console.error(`Error fetching feedback for execution ${execution.execution_id}:`, error)
            feedbackData[execution.execution_id] = null
          }
        })
      )
      setExistingFeedbacks(feedbackData)
    }

    if (workExecutions.length > 0) {
      fetchAllFeedback()
    }
  }, [workExecutions])

  const fetchEmpIdAndProfile = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found")
        navigate("/login")
        return
      }

      const decoded = jwtDecode(token)
      const userId = decoded.user_id

      const response = await axios.get(`http://localhost:8000/api/employer/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 200) {
        setEmpId(response.data.emp_id)
        setEmployer(response.data)
        setNewJobPost((prev) => ({
          ...prev,
          emp_id: response.data.emp_id,
          emp_user_id: userId,
        }))
        setLoadingProfile(false)
      } else {
        console.error("Failed to fetch employer data")
        setErrorProfile("Failed to fetch employer data")
        setLoadingProfile(false)
      }
    } catch (error) {
      console.error("Error fetching employer data:", error)
      setErrorProfile("Error fetching employer profile")
      setLoadingProfile(false)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJobPosts = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/job-posts/")
      if (response.ok) {
        const data = await response.json()
        setJobPosts(data)
      }
    } catch (error) {
      console.error("Error fetching job posts:", error)
    }
  }

  const fetchMyJobPosts = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/job-posts/employer/${empId}`)
      if (response.ok) {
        const data = await response.json()
        setMyJobPosts(data)
      }
    } catch (error) {
      console.error("Error fetching employer's job posts:", error)
    }
  }

  const fetchApplications = async () => {
    try {
      if (!empId) return
      const response = await fetch(`http://localhost:8000/api/applications/${empId}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  const fetchWorkExecutions = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const response = await axios.get(`http://localhost:8000/api/work-executions/employer/${empId}`, {
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
      const response = await axios.get(`http://localhost:8000/api/feedback/employer/${empId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFeedbackReceived(response.data)
    } catch (error) {
      console.error("Error fetching feedback:", error)
    }
  }

  const handleViewResume = async (applicantId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const response = await axios.get(`http://localhost:8000/api/applicant/resume/${applicantId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      const filename =
        response.headers["content-disposition"]?.match(/filename="(.+)"/)?.[1] || `resume-${applicantId}.pdf`
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading resume:", error)
      alert("Failed to download resume.")
    }
  }

  const handleDownloadFile = async (executionId, filePath) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      if (!filePath) {
        alert("No file available for download.")
        return
      }
      const response = await axios.get(`http://localhost:8000${filePath}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      const filename = filePath.split("/").pop()
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
      alert("Failed to download file.")
    }
  }

  const handleAddJobPost = async (e) => {
    e.preventDefault()
    if (!empId || !newJobPost.emp_user_id) {
      alert("Employer ID or User ID not found.")
      return
    }
    try {
      const jobPostData = { ...newJobPost, emp_id: empId, emp_user_id: newJobPost.emp_user_id }
      const response = await fetch("http://localhost:8000/api/job-posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobPostData),
      })
      const responseData = await response.json()
      if (response.ok) {
        alert("Job post added successfully!")
        fetchJobPosts()
        fetchMyJobPosts()
        setNewJobPost({
          emp_id: empId,
          emp_user_id: newJobPost.emp_user_id,
          job_title: "",
          job_description: "",
          job_category: "",
          required_skills: "",
          salary: "",
          vacancies: "",
          application_deadline: "",
          work_deadline: "",
          status: "active",
        })
      } else {
        alert(`Error: ${responseData.detail || "Failed to add job post."}`)
      }
    } catch (error) {
      console.error("Error adding job post:", error)
      alert("Error adding job post.")
    }
  }

  const handleApproveApplication = async (applicationId, jobId, applicantId) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/applications/${applicationId}/approve`)
      if (response.status === 200) {
        alert("Application approved!")
        fetchApplications()
        fetchWorkExecutions()
        fetchMyJobPosts()
      } else {
        alert("Failed to approve application.")
      }
    } catch (error) {
      console.error("Error approving application:", error)
      alert("Error processing the request.")
    }
  }

  const handleRejectApplication = async (applicationId) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/applications/${applicationId}/reject`)
      if (response.status === 200) {
        alert("Application rejected.")
        fetchApplications()
      } else {
        alert("Failed to reject application.")
      }
    } catch (error) {
      console.error("Error rejecting application:", error)
      alert("Error processing the request.")
    }
  }

  const handleChangeStatus = async (executionId, newStatus) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const response = await axios.put(
        `http://localhost:8000/api/work-executions/${executionId}/status`,
        { work_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200) {
        alert("Work status updated successfully!")
        fetchWorkExecutions()
      } else {
        alert("Failed to update work status.")
      }
    } catch (error) {
      console.error("Error updating work status:", error)
      alert("Error processing the request.")
    }
  }

  const handleChat = async (applicantId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const decoded = jwtDecode(token)
      const employerUserId = decoded.user_id
      const applicantResponse = await axios.get(`http://localhost:8000/api/applicant/by-id/${applicantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const applicantUserId = applicantResponse.data.user_id
      const checkConnectionResponse = await axios.get(`http://localhost:8000/api/chat/employer/${employerUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const existingConnection = checkConnectionResponse.data.find((conn) => conn.applicant_id === applicantUserId)
      if (!existingConnection) {
        await axios.post(
          "http://localhost:8000/api/chat/connections",
          { employer_id: employerUserId, applicant_id: applicantUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      navigate(`/chat/EmployerChat?applicantId=${applicantUserId}`)
    } catch (error) {
      console.error("Error handling chat:", error)
      alert("Failed to initialize chat.")
    }
  }

  const handleSubmitFeedback = async (executionId, applicantId, rating, comments, isAnonymous) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:8000/api/empfeedback",
        {
          execution_id: executionId,
          applicant_id: applicantId,
          emp_id: empId,
          rating,
          comments,
          is_anonymous: isAnonymous,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 201) {
        alert("Feedback submitted successfully!")
        fetchWorkExecutions()
        setExistingFeedbacks((prev) => ({
          ...prev,
          [executionId]: response.data,
        }))
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("Failed to submit feedback.")
    }
  }

  const handleLogout = async () => {
    try {
      const response = await axios.post("http://localhost:8000/logout", {}, { withCredentials: true })
      if (response.data.message === "Logout successful") {
        localStorage.removeItem("token")
        navigate("/login")
      }
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message)
    }
  }

  const handleDisableAccount = async () => {
    try {
      const newStatus = employer.status === 1 ? 0 : 1
      await axios.put(`http://localhost:8000/api/employer/${employer.user_id}`, { status: newStatus })
      setEmployer({ ...employer, status: newStatus })
      alert(`Account ${newStatus === 1 ? "enabled" : "disabled"} successfully!`)
    } catch (error) {
      console.error("Error updating account status:", error)
      alert("Error updating account status.")
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleFeedbackChange = (field, value) => {
    setFeedbackForm({ ...feedbackForm, [field]: value })
  }

  const submitFeedback = () => {
    handleSubmitFeedback(
      feedbackForm.executionId,
      feedbackForm.applicantId,
      feedbackForm.rating,
      feedbackForm.comments,
      feedbackForm.isAnonymous
    )
    setFeedbackForm({ executionId: null, applicantId: null, rating: 0, comments: "", isAnonymous: false })
  }


  const dashboardStats = [
    {
      title: "Active Jobs",
      value: myJobPosts.filter((job) => job.status === "active").length,
      icon: <Briefcase />,
      color: "blue",
    },
    {
      title: "Pending Applications",
      value: applications.length,
      icon: <FileText />,
      color: "green",
    },
    {
      title: "Work Executions",
      value: workExecutions.length,
      icon: <CheckSquare />,
      color: "purple",
    },
    {
      title: "Completed Payments",
      value: workExecutions.filter((exec) => exec.payment_status === "completed").length,
      icon: <DollarSign />,
      color: "orange",
    },
  ]

  const renderDashboard = () => (
    <div className="dashboard-overview">
      <div className="welcome-section">
        <div className="welcome-text">
          <h2>Welcome to JobEasy Employer Dashboard</h2>
          <p>Manage your job posts, applications, and work executions from one place</p>
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
                  <User size={18} />
                </div>
                <div className="activity-details">
                  <p>
                    <strong>{app.applicant_name}</strong> applied for <strong>{app.job_title}</strong>
                  </p>
                  <span className="activity-time">{new Date(app.applied_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="no-data">No recent applications</p>}
          </div>
        </div>
        <div className="chart-container">
          <h3>Work Summary</h3>
          <div className="payment-summary">
            <div className="summary-item">
              <span>Total Work Executions</span>
              <span className="summary-value">{workExecutions.length}</span>
            </div>
            <div className="summary-item">
              <span>Completed</span>
              <span className="summary-value">
                {workExecutions.filter((r) => r.work_status === "Completed").length}
              </span>
            </div>
            <div className="summary-item">
              <span>In Progress</span>
              <span className="summary-value">
                {workExecutions.filter((r) => r.work_status === "In Progress").length}
              </span>
            </div>
            <div className="summary-item total">
              <span>Total Payments</span>
              <span className="summary-value">
                ₹
                {workExecutions
                  .filter((exec) => exec.payment_status === "completed")
                  .reduce((sum, r) => sum + Number.parseFloat(r.payment_amount || 0), 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderJobPosts = () => (
    <div className="job-posts-section">
      <h2>Create New Job Post</h2>
      <form onSubmit={handleAddJobPost} className="job-post-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="job-title">Job Title</label>
            <input
              id="job-title"
              type="text"
              placeholder="Enter job title"
              value={newJobPost.job_title}
              onChange={(e) => setNewJobPost({ ...newJobPost, job_title: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="job-category">Job Category</label>
            <select
              id="job-category"
              value={newJobPost.job_category}
              onChange={(e) => setNewJobPost({ ...newJobPost, job_category: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select Category</option>
              {jobCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="salary">Salary (₹)</label>
            <input
              id="salary"
              type="number"
              placeholder="Enter salary amount"
              value={newJobPost.salary}
              onChange={(e) => setNewJobPost({ ...newJobPost, salary: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vacancies">Vacancies</label>
            <input
              id="vacancies"
              type="number"
              placeholder="Number of positions"
              value={newJobPost.vacancies}
              onChange={(e) => setNewJobPost({ ...newJobPost, vacancies: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="app-deadline">Application Deadline</label>
            <input
              id="app-deadline"
              type="datetime-local"
              value={newJobPost.application_deadline}
              onChange={(e) => setNewJobPost({ ...newJobPost, application_deadline: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="work-deadline">Work Deadline</label>
            <input
              id="work-deadline"
              type="date"
              value={newJobPost.work_deadline}
              onChange={(e) => setNewJobPost({ ...newJobPost, work_deadline: e.target.value })}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="job-description">Job Description</label>
          <textarea
            id="job-description"
            placeholder="Describe the job responsibilities and requirements"
            value={newJobPost.job_description}
            onChange={(e) => setNewJobPost({ ...newJobPost, job_description: e.target.value })}
            required
            className="form-input"
            rows={4}
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="required-skills">Required Skills</label>
          <textarea
            id="required-skills"
            placeholder="List the skills required for this job"
            value={newJobPost.required_skills}
            onChange={(e) => setNewJobPost({ ...newJobPost, required_skills: e.target.value })}
            required
            className="form-input"
            rows={4}
          />
        </div>

        <button type="submit" className="submit-button">
          <Plus size={16} /> Create Job Post
        </button>
      </form>
    </div>
  )

  const renderMyPosts = () => (
    <div className="my-posts-section">
      <div className="section-header">
        <h2>My Job Posts</h2>
        <div className="search-filter">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search job posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-button">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {myJobPosts.length > 0 ? (
        <div className="job-cards-grid">
          {myJobPosts
            .filter(
              (post) =>
                post.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.job_category.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((post) => (
              <div key={post.job_id} className="job-card">
                <div className="job-card-header">
                  <h3>{post.job_title}</h3>
                  <span className={`status-badge ${post.status}`}>{post.status}</span>
                </div>
                <div className="job-card-body">
                  <div className="job-detail">
                    <Briefcase size={16} />
                    <span>{post.job_category}</span>
                  </div>
                  <div className="job-detail">
                    <DollarSign size={16} />
                    <span>₹{post.salary}</span>
                  </div>
                  <div className="job-detail">
                    <Users size={16} />
                    <span>{post.vacancies} vacancies</span>
                  </div>
                  <div className="job-detail">
                    <Calendar size={16} />
                    <span>Deadline: {new Date(post.work_deadline).toLocaleDateString()}</span>
                  </div>
                  <p className="job-description">{post.job_description}</p>
                </div>
                <div className="job-card-footer">
                  <div className="job-skills">
                    <strong>Skills:</strong> {post.required_skills}
                  </div>
                  <div className="job-posted">
                    <Clock size={14} />
                    <span>Posted: {new Date(post.posted_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="no-data-container">
          <img src="/place.svg?height=150&width=150" alt="No jobs" />
          <p>No job posts found. Create your first job post!</p>
          <button className="action-button" onClick={() => setActiveTab("jobPosts")}>
            <Plus size={16} /> Create Job Post
          </button>
        </div>
      )}
    </div>
  )

  const renderApplications = () => (
    <div className="applications-section">
      <div className="section-header">
        <h2>Applications</h2>
        <div className="search-filter">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {applications.length > 0 ? (
        <div className="applications-grid">
          {applications
            .filter(
              (app) =>
                app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.job_title.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((app) => (
              <div key={app.application_id} className="application-card">
                <div className="application-header">
                  <div className="applicant-avatar">{app.applicant_name.charAt(0).toUpperCase()}</div>
                  <div className="applicant-info">
                    <h3>{app.applicant_name}</h3>
                    <span className={`status-badge ${app.application_status}`}>{app.application_status}</span>
                  </div>
                </div>
                <div className="application-body">
                  <div className="application-detail">
                    <Briefcase size={16} />
                    <span>
                      <strong>Job:</strong> {app.job_title}
                    </span>
                  </div>
                  <div className="application-detail">
                    <Calendar size={16} />
                    <span>
                      <strong>Applied:</strong> {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="application-actions">
                  <button
                    onClick={() => handleApproveApplication(app.application_id, app.job_id, app.applicant_id)}
                    className="action-button approve"
                  >
                    <CheckSquare size={16} /> Approve
                  </button>
                  <button onClick={() => handleRejectApplication(app.application_id)} className="action-button reject">
                    <X size={16} /> Reject
                  </button>
                  <button onClick={() => handleViewResume(app.applicant_id)} className="action-button view">
                    <Download size={16} /> Resume
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="no-data-container">
          <img src="/place.svg?height=150&width=150" alt="No applications" />
          <p>No pending applications found.</p>
        </div>
      )}
    </div>
  )

  const renderWorkExecutions = () => {
    return (
      <div className="work-executions-section">
        <div className="section-header">
          <h2>Work Dashboard</h2>
          <div className="search-filter">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search work executions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="filter-button">
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {workExecutions.length > 0 ? (
          <div className="work-executions-grid">
            {workExecutions
              .filter(
                (execution) =>
                  execution.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  execution.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  execution.work_status.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((execution) => {
                const existingFeedback = existingFeedbacks[execution.execution_id]

                return (
                  <div key={execution.execution_id} className="work-card">
                    <div className="work-card-header">
                      <h3>{execution.job_title}</h3>
                      <div className="status-dropdown-container">
                        <select
                          value={execution.work_status}
                          onChange={(e) => handleChangeStatus(execution.execution_id, e.target.value)}
                          className={`status-dropdown ${execution.work_status.toLowerCase().replace(" ", "-")}`}
                        >
                          {workStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="work-card-body">
                      <div className="work-detail">
                        <User size={16} />
                        <span>
                          <strong>Applicant:</strong> {execution.applicant_name}
                        </span>
                      </div>
                      <div className="work-detail">
                        <Mail size={16} />
                        <span>
                          <strong>Email:</strong> {execution.email}
                        </span>
                      </div>
                      <div className="work-detail">
                        <Phone size={16} />
                        <span>
                          <strong>Contact:</strong> {execution.contact_number}
                        </span>
                      </div>
                      <div className="work-detail">
                        <DollarSign size={16} />
                        <span>
                          <strong>Payment:</strong>
                          <span className={`payment-status ${execution.payment_status.toLowerCase().replace(" ", "-")}`}>
                            {execution.payment_status}
                          </span>
                          {execution.payment_status === "completed" &&
                            ` - ₹${execution.payment_amount} on ${new Date(execution.payment_date).toLocaleDateString()}`}
                        </span>
                      </div>
                      {existingFeedback ? (
                        <div className="feedback-display">
                          <p>
                            <strong>Your Feedback:</strong>
                          </p>
                          <div className="feedback-detail">
                            <Star size={16} />
                            <span>{existingFeedback.rating}/5</span>
                          </div>
                          <p>{existingFeedback.comments || "No comments provided"}</p>
                        </div>
                      ) : (
                        <div className="feedback-form">
                          <p>
                            <strong>Submit Feedback:</strong>
                          </p>
                          <div className="form-group">
                            <label>Rating (1-5):</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={feedbackForm.executionId === execution.execution_id ? feedbackForm.rating : ""}
                              onChange={(e) => handleFeedbackChange("rating", parseInt(e.target.value))}
                              onFocus={() =>
                                setFeedbackForm({
                                  ...feedbackForm,
                                  executionId: execution.execution_id,
                                  applicantId: execution.applicant_id,
                                })
                              }
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Comments:</label>
                            <textarea
                              value={feedbackForm.executionId === execution.execution_id ? feedbackForm.comments : ""}
                              onChange={(e) => handleFeedbackChange("comments", e.target.value)}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={
                                  feedbackForm.executionId === execution.execution_id && feedbackForm.isAnonymous
                                }
                                onChange={(e) => handleFeedbackChange("isAnonymous", e.target.checked)}
                              />
                              Submit Anonymously
                            </label>
                          </div>
                          <button onClick={submitFeedback} className="action-button submit-feedback">
                            Submit Feedback
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="work-card-actions">
                      <button onClick={() => handleChat(execution.applicant_id)} className="action-button chat">
                        <MessageSquare size={16} /> Chat
                      </button>
                      <button
                        onClick={() => handleDownloadFile(execution.execution_id, execution.deliverables_file_path)}
                        className="action-button download"
                        disabled={!execution.deliverables_file_path}
                      >
                        <Download size={16} /> Files
                      </button>
                      <button
                        onClick={() => navigate(`/payment/EmployerPayment?executionId=${execution.execution_id}`)}
                        className="action-button payment"
                        //disabled={execution.payment_status === "completed"}
                      >
                        <DollarSign size={16} /> Payment
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/feedback/employer-feedback?executionId=${execution.execution_id}`, {
                            state: { empId: empId },
                          })
                        }
                        className="action-button feedback"
                      >
                        <Star size={16} /> Feedback
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="no-data-container">
            <img src="/place.svg" alt="No work executions" />
            <p>No work executions found.</p>
          </div>
        )}
      </div>
    )
  }

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {feedbackReceived.length > 0 ? (
        <div className="feedback-grid">
          {feedbackReceived
            .filter(
              (fb) =>
                fb.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (fb.job_title && fb.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                fb.comments.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((fb) => (
              <div key={fb.feedback_id} className="feedback-card">
                <div className="feedback-header">
                  <div className="applicant-avatar">
                    {fb.is_anonymous ? "?" : fb.applicant_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="feedback-info">
                    <h3>{fb.is_anonymous ? "Anonymous" : fb.applicant_name}</h3>
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
      <h2>Employer Profile</h2>
      {loadingProfile ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile data...</p>
        </div>
      ) : errorProfile ? (
        <div className="error-message">{errorProfile}</div>
      ) : employer ? (
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <Building size={40} />
            </div>
            <div className="profile-title">
              <h3>{employer.company_name}</h3>
              <span className={`status-badge ${employer.status === 1 ? "active" : "inactive"}`}>
                {employer.status === 1 ? "Active" : "Disabled"}
              </span>
            </div>
          </div>

          <div className="profile-body">
            <div className="profile-field">
              <Building size={18} />
              <div>
                <label>Company Name</label>
                <span>{employer.company_name}</span>
              </div>
            </div>

            <div className="profile-field">
              <User size={18} />
              <div>
                <label>Username</label>
                <span>{employer.username}</span>
              </div>
            </div>

            <div className="profile-field">
              <Mail size={18} />
              <div>
                <label>Email</label>
                <span>{employer.email}</span>
              </div>
            </div>

            <div className="profile-field">
              <Phone size={18} />
              <div>
                <label>Contact Number</label>
                <span>{employer.contact_number}</span>
              </div>
            </div>

            <div className="profile-field">
              <MapPin size={18} />
              <div>
                <label>Address</label>
                <span>{employer.address}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button
              onClick={handleDisableAccount}
              className={`action-button ${employer.status === 1 ? "disable" : "enable"}`}
            >
              {employer.status === 1 ? "Disable Account" : "Enable Account"}
            </button>
          </div>
        </div>
      ) : (
        <div className="no-data-container">
          <p>No employer data found</p>
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
      case "jobPosts":
        return renderJobPosts()
      case "myPosts":
        return renderMyPosts()
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
    <div className={`employer-dashboard ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
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
            <li className={activeTab === "jobPosts" ? "active" : ""}>
              <button onClick={() => setActiveTab("jobPosts")}>
                <Plus />
                <span>Create Job</span>
              </button>
            </li>
            <li className={activeTab === "myPosts" ? "active" : ""}>
              <button onClick={() => setActiveTab("myPosts")}>
                <Briefcase />
                <span>My Job Posts</span>
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
            <div className="employer-profile">
              <span>{employer?.company_name || "Employer"}</span>
              <div className="profile-avatar">
                <Building size={20} />
              </div>
            </div>
          </div>
        </header>

        <div className="content-container">{renderContent()}</div>
      </main>
    </div>
  )
}

export default EmployerDashboard