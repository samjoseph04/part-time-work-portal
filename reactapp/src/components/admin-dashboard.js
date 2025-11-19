"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import {
  Users,
  Briefcase,
  FileText,
  CheckSquare,
  DollarSign,
  Bell,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Grid,
  Filter,
  Printer,
} from "lucide-react"
import "./admin-dashboard.css"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [employers, setEmployers] = useState([])
  const [applicants, setApplicants] = useState([])
  const [jobPosts, setJobPosts] = useState([])
  const [jobApplications, setJobApplications] = useState([])
  const [workExecutions, setWorkExecutions] = useState([])
  const [remunerations, setRemunerations] = useState([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [approvedEmployers, setApprovedEmployers] = useState([])
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filteredData, setFilteredData] = useState(null)

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchEmployers(),
          fetchApplicants(),
          fetchJobPosts(),
          fetchJobApplications(),
          fetchWorkExecutions(),
          fetchRemunerations(),
          fetchApprovedEmployers(),
        ])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const fetchEmployers = async () => {
    const response = await fetch("http://localhost:8000/api/employers", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    setEmployers(data)
    setFilteredData(null) // Reset filtered data
  }

  const fetchApprovedEmployers = async () => {
    const response = await fetch("http://localhost:8000/api/approved-employers", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    setApprovedEmployers(data)
  }

  const fetchApplicants = async () => {
    const response = await fetch("http://localhost:8000/api/applicants", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    setApplicants(data)
    setFilteredData(null)
  }

  const fetchJobPosts = async () => {
    const response = await fetch("http://localhost:8000/api/job-posts", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    setJobPosts(data)
    setFilteredData(null)
  }

  const fetchJobApplications = async () => {
    const response = await fetch("http://localhost:8000/api/applications", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    setJobApplications(data)
    setFilteredData(null)
  }

  const fetchWorkExecutions = async () => {
    const response = await fetch("http://localhost:8000/api/work-executions", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    setWorkExecutions(data)
    setFilteredData(null)
  }

  const fetchRemunerations = async () => {
    const response = await fetch("http://localhost:8000/api/remunerations", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    const data = await response.json()
    setRemunerations(data)
    setFilteredData(null)
  }

  const handleEmployerAction = async (empId, action) => {
    try {
      const endpoint = action === "approve" ? "approve" : "reject"
      await fetch(`http://localhost:8000/api/employer/${empId}/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      fetchEmployers()
    } catch (error) {
      console.error(`Error ${action}ing employer:`, error)
    }
  }

  const printPaymentDetails = (paymentId) => {
    const payment = remunerations.find((r) => r.payment_id === paymentId)
    if (payment) {
      const printWindow = window.open("", "_blank")
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #FF6B6B; text-align: center; margin-bottom: 30px; }
              .receipt { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
              .receipt-header { text-align: center; margin-bottom: 20px; }
              .receipt-details { margin-bottom: 30px; }
              .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .receipt-footer { margin-top: 30px; text-align: center; font-size: 14px; color: #666; }
              .amount { font-size: 24px; font-weight: bold; color: #2D4059; }
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="receipt-header">
                <h1>Payment Receipt</h1>
                <p>JobEasy Platform</p>
              </div>
              <div class="receipt-details">
                <div class="receipt-row">
                  <span>Payment ID:</span>
                  <span>${payment.payment_id}</span>
                </div>
                <div class="receipt-row">
                  <span>Card ID:</span>
                  <span>${payment.card_id}</span>
                </div>
                <div class="receipt-row">
                  <span>Execution ID:</span>
                  <span>${payment.execution_id}</span>
                </div>
                <div class="receipt-row">
                  <span>Date:</span>
                  <span>${new Date(payment.payment_date).toLocaleString()}</span>
                </div>
                <div class="receipt-row">
                  <span>Status:</span>
                  <span>${payment.payment_status}</span>
                </div>
                <div class="receipt-row">
                  <span>Amount:</span>
                  <span class="amount">$${payment.payment_amount}</span>
                </div>
              </div>
              <div class="receipt-footer">
                <p>Thank you for using JobEasy!</p>
                <p>For any questions, please contact support@jobeasy.com</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Filter functions
  const applyFilter = () => {
    if (!filterStartDate || !filterEndDate) return

    const start = new Date(filterStartDate)
    const end = new Date(filterEndDate)
    let data
    switch (activeTab) {
      case "employers":
        data = employers.filter(emp => {
          const regDate = new Date(emp.reg_date || Date.now())
          return regDate >= start && regDate <= end
        })
        break
      case "applicants":
        data = applicants.filter(app => {
          const regDate = new Date(app.reg_date || Date.now())
          return regDate >= start && regDate <= end
        })
        break
      case "jobs":
        data = jobPosts.filter(job => {
          const postDate = new Date(job.post_date || job.application_deadline)
          return postDate >= start && postDate <= end
        })
        break
      case "applications":
        data = jobApplications.filter(app => {
          const appliedDate = new Date(app.applied_at)
          return appliedDate >= start && appliedDate <= end
        })
        break
      case "executions":
        data = workExecutions.filter(we => {
          const completedDate = new Date(we.work_completed_date)
          return completedDate >= start && completedDate <= end
        })
        break
      case "payments":
        data = remunerations.filter(rem => {
          const paymentDate = new Date(rem.payment_date)
          return paymentDate >= start && paymentDate <= end
        })
        break
      default:
        data = null
    }
    setFilteredData(data)
    setShowFilterModal(false)
  }

  const clearFilter = () => {
    setFilterStartDate("")
    setFilterEndDate("")
    setFilteredData(null)
    setShowFilterModal(false)
  }

  // Print report function
  const printReport = () => {
    const data = filteredData || 
      (activeTab === "employers" ? employers :
       activeTab === "applicants" ? applicants :
       activeTab === "jobs" ? jobPosts :
       activeTab === "applications" ? jobApplications :
       activeTab === "executions" ? workExecutions :
       activeTab === "payments" ? remunerations : [])

    const printWindow = window.open("", "_blank")
    printWindow.document.write(`
      <html>
        <head>
          <title>${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px; }
            h1 { color: #FF6B6B; text-align: center; margin-bottom: 30px; }
            .report-header { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px 15px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #2D4059; color: white; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .report-footer { margin-top: 30px; text-align: center; font-size: 14px; color: #666; }
            .filter-info { margin-bottom: 20px; font-style: italic; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="report-header">
              <h1>${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report</h1>
              <p>JobEasy Platform</p>
            </div>
            ${filterStartDate && filterEndDate ? `
              <div class="filter-info">
                <p>Filtered from ${new Date(filterStartDate).toLocaleDateString()} to ${new Date(filterEndDate).toLocaleDateString()}</p>
              </div>
            ` : ''}
            <table>
              <thead>
                <tr>
                  ${getTableHeaders(activeTab)}
                </tr>
              </thead>
              <tbody>
                ${getTableRows(data, activeTab)}
              </tbody>
            </table>
            <div class="report-footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>For any questions, please contact support@jobeasy.com</p>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const getTableHeaders = (tab) => {
    switch (tab) {
      case "employers":
        return `
          <th>ID</th>
          <th>Company Name</th>
          <th>Email</th>
          <th>Contact</th>
          <th>Address</th>
          <th>Status</th>
        `
      case "applicants":
        return `
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Contact</th>
          <th>Skills</th>
          <th>Experience</th>
          <th>Preference</th>
        `
      case "jobs":
        return `
          <th>ID</th>
          <th>Title</th>
          <th>Category</th>
          <th>Salary</th>
          <th>Deadline</th>
          <th>Status</th>
        `
      case "applications":
        return `
          <th>ID</th>
          <th>Job Title</th>
          <th>Applicant Name</th>
          <th>Status</th>
          <th>Applied At</th>
        `
      case "executions":
        return `
          <th>ID</th>
          <th>Job Title</th>
          <th>Status</th>
          <th>Completed Date</th>
        `
      case "payments":
        return `
          <th>ID</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Status</th>
        `
      default:
        return ''
    }
  }

  const getTableRows = (data, tab) => {
    switch (tab) {
      case "employers":
        return data.map(emp => `
          <tr>
            <td>${emp.emp_id}</td>
            <td>${emp.company_name}</td>
            <td>${emp.email}</td>
            <td>${emp.contact_number}</td>
            <td>${emp.address}</td>
            <td>${emp.status === 1 ? "Active" : "Inactive"}</td>
          </tr>
        `).join('')
      case "applicants":
        return data.map(app => `
          <tr>
            <td>${app.applicant_id}</td>
            <td>${app.name}</td>
            <td>${app.email}</td>
            <td>${app.contact_number}</td>
            <td>${app.skills}</td>
            <td>${app.experience}</td>
            <td>${app.preference}</td>
          </tr>
        `).join('')
      case "jobs":
        return data.map(job => `
          <tr>
            <td>${job.job_id}</td>
            <td>${job.job_title}</td>
            <td>${job.job_category}</td>
            <td>₹${job.salary}</td>
            <td>${new Date(job.application_deadline).toLocaleDateString()}</td>
            <td>${job.status}</td>
          </tr>
        `).join('')
      case "applications":
        return data.map(app => `
          <tr>
            <td>${app.application_id}</td>
            <td>${app.job_title}</td>
            <td>${app.applicant_name}</td>
            <td>${app.application_status}</td>
            <td>${new Date(app.applied_at).toLocaleString()}</td>
          </tr>
        `).join('')
      case "executions":
        return data.map(we => `
          <tr>
            <td>${we.execution_id}</td>
            <td>${we.job_title}</td>
            <td>${we.work_status}</td>
            <td>${new Date(we.work_completed_date).toLocaleString()}</td>
          </tr>
        `).join('')
      case "payments":
        return data.map(rem => `
          <tr>
            <td>${rem.payment_id}</td>
            <td>₹${rem.payment_amount}</td>
            <td>${new Date(rem.payment_date).toLocaleString()}</td>
            <td>${rem.payment_status}</td>
          </tr>
        `).join('')
      default:
        return ''
    }
  }

  // Dashboard summary data
  const dashboardStats = [
    { title: "Total Employers", value: employers.length, icon: <Users />, color: "blue" },
    { title: "Total Applicants", value: applicants.length, icon: <User />, color: "green" },
    {
      title: "Active Jobs",
      value: jobPosts.filter((job) => job.status === "Active").length,
      icon: <Briefcase />,
      color: "purple",
    },
    {
      title: "Pending Applications",
      value: jobApplications.filter((app) => app.application_status === "Pending").length,
      icon: <FileText />,
      color: "orange",
    },
  ]

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const renderDashboard = () => (
    <div className="dashboard-overview">
      <div className="welcome-section">
        <div className="welcome-text">
          <h2>Welcome to JobEasy Admin Dashboard</h2>
          <p>Monitor and manage all platform activities from one place</p>
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
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {jobApplications.slice(0, 5).map((app, index) => (
              <div className="activity-item" key={index}>
                <div className="activity-icon">
                  <CheckSquare size={18} />
                </div>
                <div className="activity-details">
                  <p>
                    <strong>{app.applicant_name}</strong> applied for <strong>{app.job_title}</strong>
                  </p>
                  <span className="activity-time">{new Date(app.applied_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <h3>Payment Summary</h3>
          <div className="payment-summary">
            <div className="summary-item">
              <span>Total Payments</span>
              <span className="summary-value">{remunerations.length}</span>
            </div>
            <div className="summary-item">
              <span>Completed</span>
              <span className="summary-value">
                {remunerations.filter((r) => r.payment_status === "Completed").length}
              </span>
            </div>
            <div className="summary-item">
              <span>Pending</span>
              <span className="summary-value">
                {remunerations.filter((r) => r.payment_status === "Pending").length}
              </span>
            </div>
            <div className="summary-item total">
              <span>Total Amount</span>
              <span className="summary-value">
                ₹{remunerations.reduce((sum, r) => sum + Number.parseFloat(r.payment_amount), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEmployers = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Employers Requests</h2>
        <div className="section-actions">
          <button onClick={() => setShowFilterModal(true)} className="action-button filter">
            <Filter size={16} /> Filter
          </button>
          <button onClick={printReport} className="action-button print">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Company Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filteredData || employers).map((emp) => (
              <tr key={emp.emp_id}>
                <td>{emp.emp_id}</td>
                <td>{emp.company_name}</td>
                <td>{emp.email}</td>
                <td>{emp.contact_number}</td>
                <td>{emp.address}</td>
                <td>
                  <span className={`status-badge ${emp.status === 1 ? "active" : "inactive"}`}>
                    {emp.status === 1 ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="action-buttons">
                  <button onClick={() => handleEmployerAction(emp.emp_id, "approve")} className="action-button approve">
                    Approve
                  </button>
                  <button onClick={() => handleEmployerAction(emp.emp_id, "reject")} className="action-button reject">
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderApprovedEmployers = () => (
    <div className="data-section">
      <h2>Employers</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Username</th>
              <th>Company Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Registration Date</th>
              <th>User Status</th>
            </tr>
          </thead>
          <tbody>
            {approvedEmployers.map((emp) => (
              <tr key={emp.emp_id}>
                <td>{emp.emp_id}</td>
                <td>{emp.user_id}</td>
                <td>{emp.username}</td>
                <td>{emp.company_name}</td>
                <td>{emp.email}</td>
                <td>{emp.contact_number}</td>
                <td>{emp.address}</td>
                <td>{new Date(emp.reg_date).toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${emp.user_status === 1 ? "active" : "inactive"}`}>
                    {emp.user_status === 1 ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderApplicants = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Applicants</h2>
        <div className="section-actions">
          <button onClick={() => setShowFilterModal(true)} className="action-button filter">
            <Filter size={16} /> Filter
          </button>
          <button onClick={printReport} className="action-button print">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Skills</th>
              <th>Experience</th>
              <th>Preference</th>
            </tr>
          </thead>
          <tbody>
            {(filteredData || applicants).map((app) => (
              <tr key={app.applicant_id}>
                <td>{app.applicant_id}</td>
                <td>{app.name}</td>
                <td>{app.email}</td>
                <td>{app.contact_number}</td>
                <td>{app.skills}</td>
                <td>{app.experience}</td>
                <td>{app.preference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderJobPosts = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Job Posts</h2>
        <div className="section-actions">
          <button onClick={() => setShowFilterModal(true)} className="action-button filter">
            <Filter size={16} /> Filter
          </button>
          <button onClick={printReport} className="action-button print">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Salary</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(filteredData || jobPosts).map((job) => (
              <tr key={job.job_id}>
                <td>{job.job_id}</td>
                <td>{job.job_title}</td>
                <td>{job.job_category}</td>
                <td>₹{job.salary}</td>
                <td>{new Date(job.application_deadline).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${job.status.toLowerCase()}`}>{job.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderJobApplications = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Job Applications</h2>
        <div className="section-actions">
          <button onClick={() => setShowFilterModal(true)} className="action-button filter">
            <Filter size={16} /> Filter
          </button>
          <button onClick={printReport} className="action-button print">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Job Title</th>
              <th>Applicant Name</th>
              <th>Status</th>
              <th>Applied At</th>
            </tr>
          </thead>
          <tbody>
            {(filteredData || jobApplications).map((app) => (
              <tr key={app.application_id}>
                <td>{app.application_id}</td>
                <td>{app.job_title}</td>
                <td>{app.applicant_name}</td>
                <td>
                  <span className={`status-badge ${app.application_status.toLowerCase()}`}>
                    {app.application_status}
                  </span>
                </td>
                <td>{new Date(app.applied_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderWorkExecutions = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Work Executions</h2>
        <div className="section-actions">
          <button onClick={() => setShowFilterModal(true)} className="action-button filter">
            <Filter size={16} /> Filter
          </button>
          <button onClick={printReport} className="action-button print">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Job Title</th>
              <th>Status</th>
              <th>Completed Date</th>
            </tr>
          </thead>
          <tbody>
            {(filteredData || workExecutions).map((we) => (
              <tr key={we.execution_id}>
                <td>{we.execution_id}</td>
                <td>{we.job_title}</td>
                <td>
                  <span className={`status-badge ${we.work_status.toLowerCase()}`}>{we.work_status}</span>
                </td>
                <td>{new Date(we.work_completed_date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderRemunerations = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Remunerations</h2>
        <div className="section-actions">
          <button onClick={() => setShowFilterModal(true)} className="action-button filter">
            <Filter size={16} /> Filter
          </button>
          <button onClick={printReport} className="action-button print">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(filteredData || remunerations).map((rem) => (
              <tr key={rem.payment_id}>
                <td>{rem.payment_id}</td>
                <td>₹{rem.payment_amount}</td>
                <td>{new Date(rem.payment_date).toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${rem.payment_status.toLowerCase()}`}>{rem.payment_status}</span>
                </td>
                <td>
                  <button onClick={() => printPaymentDetails(rem.payment_id)} className="action-button print">
                    Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderFilterModal = () => (
    <div className="filter-modal">
      <div className="filter-modal-content">
        <h3>Filter by Date Range</h3>
        <div className="filter-inputs">
          <div className="filter-field">
            <label>Start Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label>End Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="filter-actions">
          <button onClick={applyFilter} className="action-button apply">
            Apply Filter
          </button>
          <button onClick={clearFilter} className="action-button clear">
            Clear Filter
          </button>
          <button onClick={() => setShowFilterModal(false)} className="action-button cancel">
            Cancel
          </button>
        </div>
      </div>
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
      case "employers":
        return renderEmployers()
      case "approved-employers":
        return renderApprovedEmployers()
      case "applicants":
        return renderApplicants()
      case "jobs":
        return renderJobPosts()
      case "applications":
        return renderJobApplications()
      case "executions":
        return renderWorkExecutions()
      case "payments":
        return renderRemunerations()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className={`admin-dashboard ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
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
            <li className={activeTab === "employers" ? "active" : ""}>
              <button onClick={() => setActiveTab("employers")}>
                <Users />
                <span>Employer Requests</span>
              </button>
            </li>
            <li className={activeTab === "approved-employers" ? "active" : ""}>
              <button onClick={() => setActiveTab("approved-employers")}>
                <Users />
                <span>Employers</span>
              </button>
            </li>
            <li className={activeTab === "applicants" ? "active" : ""}>
              <button onClick={() => setActiveTab("applicants")}>
                <User />
                <span>Applicants</span>
              </button>
            </li>
            <li className={activeTab === "jobs" ? "active" : ""}>
              <button onClick={() => setActiveTab("jobs")}>
                <Briefcase />
                <span>Job Posts</span>
              </button>
            </li>
            <li className={activeTab === "applications" ? "active" : ""}>
              <button onClick={() => setActiveTab("applications")}>
                <FileText />
                <span>Applications</span>
              </button>
            </li>
            <li className={activeTab === "executions" ? "active" : ""}>
              <button onClick={() => setActiveTab("executions")}>
                <CheckSquare />
                <span>Work Executions</span>
              </button>
            </li>
            <li className={activeTab === "payments" ? "active" : ""}>
              <button onClick={() => setActiveTab("payments")}>
                <DollarSign />
                <span>Payments</span>
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
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder="Search..." />
            </div>
            <div className="admin-profile">
              <span>Admin</span>
              <div className="profile-avatar">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        <div className="content-container">
          {renderContent()}
          {showFilterModal && renderFilterModal()}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard