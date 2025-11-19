"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Clock,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  XCircle,
  Building,
} from "lucide-react"
import "./Payment.css"

const ApplicantPayment = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [executionId, setExecutionId] = useState(null)
  const [jobTitle, setJobTitle] = useState("")
  const [employerName, setEmployerName] = useState("")
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [animatePayment, setAnimatePayment] = useState(false)
  const illustrationRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const execId = params.get("executionId")
    setExecutionId(execId)
    fetchPaymentDetails(execId)
  }, [location])

  useEffect(() => {
    if (paymentDetails && !isLoading) {
      setAnimatePayment(true)
    }
  }, [paymentDetails, isLoading])

  // Animation for illustration based on payment status
  useEffect(() => {
    if (!isLoading && illustrationRef.current) {
      illustrationRef.current.classList.add("animate-in")
    }
  }, [isLoading])

  const fetchPaymentDetails = async (executionId) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const decoded = jwtDecode(token)
      const userId = decoded.user_id

      // Fetch payment details
      const paymentResponse = await axios.get(`http://localhost:8000/api/payments/applicant/${executionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (paymentResponse.data) {
        setPaymentDetails(paymentResponse.data)
        setJobTitle(paymentResponse.data.job_title)
        setEmployerName(paymentResponse.data.employer_name)
      } else {
        setPaymentDetails({ payment_status: "Not Paid" })
      }

      // Simulate loading for smoother transitions
      setTimeout(() => {
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error("Error fetching payment details:", error)
      setPaymentDetails({ payment_status: "Not Paid" })
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    if (!status) return <Clock size={24} className="status-icon not-paid" />

    status = status.toLowerCase()
    if (status === "completed") return <CheckCircle size={24} className="status-icon paid" />
    if (status === "pending") return <Clock size={24} className="status-icon pending" />
    return <XCircle size={24} className="status-icon not-paid" />
  }

  const getStatusClass = (status) => {
    if (!status) return "not-paid"
    status = status.toLowerCase()
    if (status === "completed") return "paid"
    return status
  }

  const getIllustration = (status) => {
    if (!status) status = "not-paid"
    status = status.toLowerCase()

    if (status === "completed") {
      return (
        <div className="payment-illustration-svg paid">
          <CheckCircle size={80} />
          <div className="illustration-circle"></div>
          <div className="illustration-rays"></div>
        </div>
      )
    } else if (status === "pending") {
      return (
        <div className="payment-illustration-svg pending">
          <Clock size={80} />
          <div className="illustration-circle"></div>
          <div className="illustration-pulse"></div>
        </div>
      )
    } else {
      return (
        <div className="payment-illustration-svg not-paid">
          <AlertCircle size={80} />
          <div className="illustration-circle"></div>
        </div>
      )
    }
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button onClick={() => navigate("/applicant-dashboard")} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1>Payment Status</h1>
      </div>

      <div className="payment-content">
        <div className="payment-details-container">
          <div className="payment-details">
            <div className="payment-illustration" ref={illustrationRef}>
              {!isLoading && getIllustration(paymentDetails?.payment_status)}
            </div>

            <div className="work-details-card">
              <h2>
                <Building size={20} className="card-header-icon" />
                Work Details
              </h2>
              {isLoading ? (
                <div className="loading-skeleton">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                </div>
              ) : (
                <>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <CreditCard size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Job Title</span>
                      <span className="detail-value">{jobTitle || "N/A"}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">
                      <User size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Employer Name</span>
                      <span className="detail-value">{employerName || "N/A"}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="payment-status-container">
            <h2>
              <DollarSign size={20} className="card-header-icon" />
              Payment Status
            </h2>

            {isLoading ? (
              <div className="loading-skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
              </div>
            ) : (
              <div className={`payment-status-card ${animatePayment ? "animate" : ""}`}>
                <div className="status-header">
                  <div className="status-icon-container">{getStatusIcon(paymentDetails?.payment_status)}</div>
                  <div className="status-info">
                    <h3 className={`status-text ${getStatusClass(paymentDetails?.payment_status)}`}>
                      {paymentDetails?.payment_status || "Not Paid"}
                    </h3>
                    <span className={`status-badge ${getStatusClass(paymentDetails?.payment_status)}`}>
                      {paymentDetails?.payment_status || "Not Available"}
                    </span>
                  </div>
                </div>

                <div className="status-details">
                  <div className="detail-item">
                    <div className="detail-icon">
                      <DollarSign size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value amount">
                        {paymentDetails?.payment_amount ? `₹${paymentDetails.payment_amount}` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {paymentDetails?.payment_date && (
                    <div className="detail-item">
                      <div className="detail-icon">
                        <Calendar size={20} />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Payment Date</span>
                        <span className="detail-value">{new Date(paymentDetails.payment_date).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="payment-note">
                  <AlertCircle size={18} className="note-icon" />
                  {paymentDetails?.payment_status?.toLowerCase() === "completed" ? (
                    <p>Thank you for your work! Your payment has been processed successfully.</p>
                  ) : paymentDetails?.payment_status?.toLowerCase() === "pending" ? (
                    <p>Your payment is being processed. Please check back later.</p>
                  ) : (
                    <p>
                      Your payment has not been processed yet. Please contact your employer if you have any questions.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicantPayment
