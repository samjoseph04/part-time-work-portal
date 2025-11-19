"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Star, ArrowLeft, Send } from "lucide-react";
import "./employer-feedback.css";

const ApplicantFeedback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [executionId, setExecutionId] = useState(null);
  const [empId, setEmpId] = useState(null);
  const [applicantId, setApplicantId] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    comments: "",
    isAnonymous: false,
  });
  const [existingFeedback, setExistingFeedback] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const execId = params.get("executionId");
    if (execId) {
      setExecutionId(execId);
      fetchApplicantId();
      if (location.state?.empId) {
        setEmpId(location.state.empId);
        setJobTitle(location.state.jobTitle);
        setCompanyName(location.state.companyName);
        fetchExistingFeedback(execId);
        setLoading(false);
      } else {
        fetchWorkDetails(execId);
      }
    } else {
      setError("Missing execution ID. Please try again.");
      setLoading(false);
    }
  }, [location]);

  const fetchApplicantId = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/login");
        return;
      }
      const response = await axios.get(`http://localhost:8000/api/applicant/${JSON.parse(atob(token.split('.')[1])).user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplicantId(response.data.applicant_id);
    } catch (err) {
      console.error("Error fetching applicant ID:", err);
      setError("Failed to fetch applicant profile");
      setLoading(false);
    }
  };

  const fetchWorkDetails = async (executionId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/login");
        return;
      }
      const response = await axios.get(
        `http://localhost:8000/api/work-executions/employer/details/${executionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEmpId(response.data.emp_id);
      setJobTitle(response.data.job_title);
      setCompanyName(response.data.company_name || "Unknown Employer");
      fetchExistingFeedback(executionId);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching work details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(`Failed to fetch work details: ${err.response?.data?.detail || err.message}`);
      setLoading(false);
    }
  };

  const fetchExistingFeedback = async (executionId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/login");
        return;
      }
      const response = await axios.get(
        `http://localhost:8000/api/feedback/execution/${executionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.feedback_id) {
        setExistingFeedback(response.data);
      }
    } catch (err) {
      console.error("No existing feedback found or error:", err);
    }
  };

  const handleInputChange = (field, value) => {
    setFeedbackForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (!feedbackForm.rating || feedbackForm.rating < 1 || feedbackForm.rating > 5) {
      alert("Please provide a rating between 1 and 5.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!executionId || !empId || !applicantId || !token) {
      alert("Required data is missing. Please try again.");
      navigate("/login");
      return;
    }

    const payload = {
      execution_id: parseInt(executionId),
      emp_id: parseInt(empId),
      applicant_id: parseInt(applicantId),
      rating: parseInt(feedbackForm.rating),
      comments: feedbackForm.comments || "",
      is_anonymous: feedbackForm.isAnonymous,
      feedback_type: "applicant_to_employer",
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/api/appfeedback",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        alert("Feedback submitted successfully!");
        navigate("/applicant-dashboard");
      }
    } catch (err) {
      console.error("Error submitting feedback:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      alert(`Failed to submit feedback: ${err.response?.data?.detail || err.message}`);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`star-button ${feedbackForm.rating >= star ? "filled" : ""}`}
        onClick={() => handleInputChange("rating", star)}
        disabled={existingFeedback}
      >
        <Star size={24} />
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="employer-feedback">
      <header className="feedback-header">
        <button className="back-button" onClick={() => navigate("/applicant-dashboard")}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <h1>Provide Feedback</h1>
      </header>

      <div className="feedback-content">
        <div className="work-details">
          <h2>{jobTitle}</h2>
          <p>
            <strong>Employer:</strong> {companyName}
          </p>
        </div>

        {existingFeedback ? (
          <div className="existing-feedback">
            <h3>Your Previous Feedback</h3>
            <div className="rating-display">
              {Array(existingFeedback.rating)
                .fill()
                .map((_, i) => (
                  <Star key={i} size={24} className="filled" />
                ))}
              <span>{existingFeedback.rating}/5</span>
            </div>
            <p>
              <strong>Comments:</strong> {existingFeedback.comments || "No comments provided"}
            </p>
            <p>
              <strong>Submitted:</strong> {new Date(existingFeedback.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Anonymous:</strong> {existingFeedback.is_anonymous ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="feedback-form">
            <div className="form-group">
              <label>Rating (1-5)</label>
              <div className="star-rating">{renderStars()}</div>
            </div>

            <div className="form-group">
              <label htmlFor="comments">Comments</label>
              <textarea
                id="comments"
                value={feedbackForm.comments}
                onChange={(e) => handleInputChange("comments", e.target.value)}
                placeholder="Share your feedback about the employer's process..."
                rows={5}
                className="form-input"
              />
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={feedbackForm.isAnonymous}
                  onChange={(e) => handleInputChange("isAnonymous", e.target.checked)}
                />
                Submit Anonymously
              </label>
            </div>

            <button type="submit" className="submit-button">
              <Send size={16} /> Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ApplicantFeedback;