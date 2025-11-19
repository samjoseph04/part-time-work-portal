"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import {
  CreditCard,
  CheckCircle,
  ArrowLeft,
  PlusCircle,
  X,
  DollarSign,
  User,
  AlertCircle,
  Building,
  Clock,
  Printer,
} from "lucide-react"
import "./Payment.css"

const EmployerPayment = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [executionId, setExecutionId] = useState(null)
  const [jobTitle, setJobTitle] = useState("")
  const [applicantName, setApplicantName] = useState("")
  const [salary, setSalary] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [cards, setCards] = useState([])
  const [selectedCard, setSelectedCard] = useState("")
  const [newCard, setNewCard] = useState({
    card_number: "",
    expiry_date: "",
    card_holder_name: "",
    cvv: "",
  })
  const [useNewCard, setUseNewCard] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const illustrationRef = useRef(null)
  const [animatePayment, setAnimatePayment] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const execId = params.get("executionId")
    setExecutionId(execId)
    fetchWorkDetails(execId)
    fetchCards()
  }, [location])

  useEffect(() => {
    if (!isLoading && illustrationRef.current) {
      illustrationRef.current.classList.add("animate-in")
    }
  }, [isLoading])

  const fetchWorkDetails = async (executionId) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const response = await axios.get(`http://localhost:8000/api/work-executions/employer/details/${executionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setJobTitle(response.data.job_title)
      setApplicantName(response.data.applicant_name)
      setSalary(response.data.salary)
      setPaymentStatus(response.data.payment_status)
      setPaymentDate(response.data.payment_date || new Date().toISOString())

      // Simulate loading for smoother transitions
      setTimeout(() => {
        setIsLoading(false)
        setAnimatePayment(true)
      }, 800)
    } catch (error) {
      console.error("Error fetching work details:", error)
      setIsLoading(false)
    }
  }

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const decoded = jwtDecode(token)
      const userId = decoded.user_id
      const response = await axios.get(`http://localhost:8000/api/cards/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCards(response.data)
      if (response.data.length > 0) {
        setSelectedCard(response.data[0].card_id)
      }
    } catch (error) {
      console.error("Error fetching cards:", error)
    }
  }

  const handleAddCard = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const decoded = jwtDecode(token)
      const userId = decoded.user_id

      if (newCard.card_number.length !== 16 || !/^\d+$/.test(newCard.card_number)) {
        alert("Please enter a valid 16-digit card number")
        return
      }

      if (!newCard.expiry_date) {
        alert("Please enter a valid expiry date")
        return
      }

      if (!newCard.card_holder_name) {
        alert("Please enter the card holder name")
        return
      }

      if (newCard.cvv.length < 3 || !/^\d+$/.test(newCard.cvv)) {
        alert("Please enter a valid CVV")
        return
      }

      const response = await axios.post(
        "http://localhost:8000/api/cards",
        {
          card_number: newCard.card_number,
          expiry_date: newCard.expiry_date,
          card_holder_name: newCard.card_holder_name,
          user_id: userId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setCards([...cards, response.data])
      setSelectedCard(response.data.card_id)
      setNewCard({ card_number: "", expiry_date: "", card_holder_name: "", cvv: "" })
      setUseNewCard(false)
    } catch (error) {
      console.error("Error adding card:", error)
      alert("Failed to add card.")
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    try {
      setIsProcessing(true)
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const cardId = useNewCard ? cards[cards.length - 1]?.card_id : selectedCard
      if (!cardId) {
        alert("Please select or add a card.")
        setIsProcessing(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))

      const response = await axios.post(
        "http://localhost:8000/api/payments",
        { execution_id: executionId, card_id: cardId, payment_amount: salary },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (response.status === 201) {
        await axios.put(
          `http://localhost:8000/api/work-executions/${executionId}/status`,
          { work_status: "Paid" },
          { headers: { Authorization: `Bearer ${token}` } },
        )

        setPaymentSuccess(true)
        setPaymentStatus("completed")
        setPaymentDate(new Date().toISOString())
        setIsProcessing(false)

        setTimeout(() => {
          navigate("/employer-dashboard")
        }, 3000)
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Failed to process payment.")
      setIsProcessing(false)
    }
  }

  const printPaymentDetails = () => {
    if (paymentStatus === "completed") {
      const payment = {
        execution_id: executionId,
        job_title: jobTitle,
        applicant_name: applicantName,
        payment_date: paymentDate,
        payment_status: paymentStatus,
        payment_amount: salary,
      }
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
                <p>JobEasy Solutions Pvt Ltd</p>
              </div>
              <div class="receipt-details">
                <div class="receipt-row">
                </div>
                <div class="receipt-row">
                  <span>Job Title:</span>
                  <span>${payment.job_title}</span>
                </div>
                <div class="receipt-row">
                  <span>Employee Name:</span>
                  <span>${payment.applicant_name}</span>
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
                  <span class="amount">₹${payment.payment_amount}</span>
                </div>
              </div>
              <div class="receipt-footer">
                <p>The amount will be credited directly to the Employee's Wallet</p>
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

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value)
    setNewCard({ ...newCard, card_number: formattedValue.replace(/\s/g, "") })
    e.target.value = formattedValue
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

  // Show "Payment Completed" if payment_status is "completed"
  if (paymentStatus === "completed") {
    return (
      <div className="payment-container">
        <div className="payment-success-container">
          <div className="payment-success-card">
            <div className="success-icon">
              <CheckCircle size={80} />
            </div>
            <h2>Payment Completed!</h2>
            <p>
              The payment of ₹{salary} for {jobTitle} has already been processed.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => navigate("/employer-dashboard")} className="back-button">
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
              <button onClick={printPaymentDetails} className="back-button">
                <Printer size={20} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show success message after payment is processed
  if (paymentSuccess) {
    return (
      <div className="payment-container">
        <div className="payment-success-container">
          <div className="payment-success-card">
            <div className="success-icon">
              <CheckCircle size={80} />
            </div>
            <h2>Payment Successful!</h2>
            <p>
              Your payment of ₹{salary} for {jobTitle} has been processed successfully.
            </p>
            <p>Redirecting to dashboard...</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => navigate("/employer-dashboard")} className="back-button">
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
              <button onClick={printPaymentDetails} className="back-button">
                <Printer size={20} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button onClick={() => navigate("/employer-dashboard")} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1>Complete Your Payment</h1>
      </div>

      <div className="payment-content">
        <div className="payment-details-container">
          <div className="payment-details">
            <div className="payment-illustration" ref={illustrationRef}>
              {!isLoading && getIllustration(paymentStatus)}
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
                      <span className="detail-label">Applicant Name</span>
                      <span className="detail-value">{applicantName || "N/A"}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <DollarSign size={20} />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value amount">₹{salary || "N/A"}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="payment-status-container">
            <h2>
              <DollarSign size={20} className="card-header-icon" />
              Payment Method
            </h2>

            {isLoading ? (
              <div className="loading-skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
              </div>
            ) : (
              <div className={`payment-status-card ${animatePayment ? "animate" : ""}`}>
                {!useNewCard ? (
                  <div className="saved-cards">
                    <h3 className="section-title">Select a payment method</h3>

                    {cards.length === 0 ? (
                      <div className="no-cards-message">
                        <p>You don't have any saved cards.</p>
                      </div>
                    ) : (
                      <div className="cards-list">
                        {cards.map((card) => (
                          <div
                            key={card.card_id}
                            className={`card-item ${selectedCard === card.card_id ? "selected" : ""}`}
                            onClick={() => setSelectedCard(card.card_id)}
                          >
                            <div className="card-icon">
                              <CreditCard size={24} />
                            </div>
                            <div className="card-info">
                              <span className="card-name">{card.card_holder_name}</span>
                              <span className="card-number">**** **** **** {card.card_number.slice(-4)}</span>
                            </div>
                            <div className="card-radio">
                              <input
                                type="radio"
                                name="card"
                                checked={selectedCard === card.card_id}
                                onChange={() => setSelectedCard(card.card_id)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => setUseNewCard(true)} className="add-card-button">
                      <PlusCircle size={20} />
                      <span>Add New Card</span>
                    </button>

                    <button
                      onClick={handlePayment}
                      className={`pay-button ${isProcessing ? "processing" : ""}`}
                      disabled={isProcessing || cards.length === 0}
                    >
                      {isProcessing ? "Processing..." : `Pay ₹${salary}`}
                    </button>
                  </div>
                ) : (
                  <div className="new-card-form-container">
                    <div className="new-card-header">
                      <h3 className="section-title">Add New Card</h3>
                      <button onClick={() => setUseNewCard(false)} className="close-button">
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleAddCard} className="new-card-form">
                      <div className="form-group">
                        <label htmlFor="card_holder_name">Card Holder Name</label>
                        <input
                          type="text"
                          id="card_holder_name"
                          placeholder="Name on card"
                          value={newCard.card_holder_name}
                          onChange={(e) => setNewCard({ ...newCard, card_holder_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="card_number">Card Number</label>
                        <div className="card-number-input">
                          <CreditCard size={20} className="card-input-icon" />
                          <input
                            type="text"
                            id="card_number"
                            placeholder="1234 5678 9012 3456"
                            maxLength="19"
                            onChange={handleCardNumberChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="expiry_date">Expiry Date</label>
                          <input
                            type="date"
                            id="expiry_date"
                            value={newCard.expiry_date}
                            onChange={(e) => setNewCard({ ...newCard, expiry_date: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="cvv">CVV</label>
                          <input
                            type="text"
                            id="cvv"
                            placeholder="123"
                            maxLength="4"
                            value={newCard.cvv}
                            onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, "") })}
                            required
                          />
                        </div>
                      </div>

                      <div className="payment-note">
                        <AlertCircle size={18} className="note-icon" />
                        <p>Your card information will be securely stored for future payments.</p>
                      </div>

                      <div className="form-actions">
                        <button type="button" onClick={() => setUseNewCard(false)} className="cancel-button">
                          Cancel
                        </button>
                        <button type="submit" className="submit-button">
                          Save Card
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployerPayment