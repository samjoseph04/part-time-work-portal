"use client"

import { useNavigate } from "react-router-dom"

const Error = () => {
  const navigate = useNavigate()

  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1 className="error-title">Waiting for Admin Approval</h1>
        <p className="error-message">
          Your account is currently pending approval from an administrator. You'll be able to access the platform once
          your account has been reviewed and approved.
        </p>
        <p className="error-submessage">This usually takes 24-48 hours. Thank you for your patience.</p>
        <div className="button-container">
          <button className="error-button" onClick={() => navigate("/")}>
            Back to Homepage
          </button>
        </div>
      </div>
      <style jsx="true">{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .error-container {
          font-family: "Poppins", Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f8f9fa;
          padding: 20px;
        }

        .error-card {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          transition: all 0.3s ease;
        }

        .error-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        }

        .error-icon {
          color: #ff6b6b;
          margin-bottom: 20px;
        }

        .error-title {
          color: #2d4059;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .error-message {
          color: #6c757d;
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .error-submessage {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .button-container {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .error-button {
          background-color: #ff6b6b;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-family: "Poppins", Arial, sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .error-button:hover {
          background-color: #ff8576;
        }


        @media (max-width: 576px) {
          .error-card {
            padding: 30px 20px;
          }

          .error-title {
            font-size: 20px;
          }

          .button-container {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}

export default Error