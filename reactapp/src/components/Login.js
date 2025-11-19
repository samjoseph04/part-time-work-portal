"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { ArrowRight, Mail, Lock, User, Briefcase, LogIn, Github, Twitter } from "lucide-react"
import "./Login.css"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Animation effect when component mounts
  useEffect(() => {
    document.querySelector(".auth-card").classList.add("fade-in")
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Reset form values and errors when switching tabs
    setUsername("")
    setPassword("")
    setErrorMessage("")
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await fetch("http://127.0.0.1:8000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem(
                "user",
                JSON.stringify({
                    user_id: data.user_id,
                    username: data.username,
                    user_type: data.user_type,
                })
            );

            // Redirect based on user type
            if (data.user_type === "employer") {
                navigate("/employer-dashboard");
            } else if (data.user_type === "applicant") {
                navigate("/applicant-dashboard");
            } else if (data.user_type === "admin") {
                navigate("/admin-dashboard");
            } else {
                navigate("/");
            }
        } else if (data.redirectToError) {
            // Redirect to Error page for inactive employer
            navigate("/error");
        } else {
            setErrorMessage(data.detail || "Invalid login credentials");
        }
    } catch (error) {
        setErrorMessage("Something went wrong. Please try again later.");
    } finally {
        setIsLoading(false);
    }
};
  

  return (
    <div className="login-page">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <header className="home-header">
        <Link to="/" className="logo">
          <h1 style={{ color: "#FF6B6B" }}>JobEasy</h1>
        </Link>
        <nav className="nav-menu">
        </nav>
        <div className="login-container">
          <Link to="/login" className="login-button">
            Login
          </Link>
        </div>
      </header>

      <div className="login-content">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => handleTabChange("login")}
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
            <button
              className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => handleTabChange("signup")}
            >
              <User size={18} />
              <span>Sign Up</span>
            </button>
          </div>

          <div className={`auth-content ${activeTab === "login" ? "show" : ""}`}>
            {activeTab === "login" ? (
              <>
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Sign in to access your account</p>

                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label htmlFor="username">
                      
                      <span>Username</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">
                      
                      <span>Password</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-options">
                    <div className="remember-me">
                      <input type="checkbox" id="remember" />
                      <label htmlFor="remember">Remember me </label>
                    </div>
                    <a href="#" className="forgot-password">
                      Forgot Password?
                    </a>
                  </div>

                  {errorMessage && <p className="error-message">{errorMessage}</p>}

                  <button type="submit" className={`submit-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                    {!isLoading && <ArrowRight size={18} />}
                  </button>
                </form>

              </>
            ) : (
              <>
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Choose your account type</p>

                <div className="signup-options">
                  <button className="signup-option applicant" onClick={() => navigate("/job-seeker-signup")}>
                    <User size={24} />
                    <div>
                      <h3>Applicant</h3>
                      <p>Find jobs and opportunities</p>
                    </div>
                    <ArrowRight size={18} />
                  </button>

                  <button className="signup-option employer" onClick={() => navigate("/employer-signup")}>
                    <Briefcase size={24} />
                    <div>
                      <h3>Employer</h3>
                      <p>Post jobs and hire talent</p>
                    </div>
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="signup-note">
                  <p>
                    By signing up, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

