import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, ArrowRight, ArrowLeft, UserPlus, Mail, Phone, MapPin } from "lucide-react";

// Removed lodash/debounce import since it's no longer needed

const EmployerSignup = () => {
  const navigate = useNavigate();
  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    company_name: "",
    email: "",
    contact_number: "",
    address: "",
  });

  const [formErrors, setFormErrors] = useState({
    username: "",
    password: "",
    company_name: "",
    email: "",
    contact_number: "",
    address: "",
    general: "",
  });

  const validateUsername = (username) => {
    if (username.length < 4) {
      return {
        isValid: false,
        message: 'Username must be at least 4 characters long',
      };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        isValid: false,
        message: 'Username can only contain letters, numbers, and underscores',
      };
    }
    return { isValid: true };
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
      };
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return {
        isValid: false,
        message: 'Password must include uppercase, lowercase, and numbers',
      };
    }
    return { isValid: true };
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address',
      };
    }
    return { isValid: true };
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(phone)) {
      return {
        isValid: false,
        message: 'Please enter a valid phone number (e.g., +1234567890, 7–15 digits)',
      };
    }
    return { isValid: true };
  };

  const validateCompanyName = (name) => {
    if (name.length < 2) {
      return {
        isValid: false,
        message: 'Company name must be at least 2 characters long',
      };
    }
    return { isValid: true };
  };

  const validateAddress = (address) => {
    if (address.length < 10) {
      return {
        isValid: false,
        message: 'Address must be at least 10 characters long',
      };
    }
    return { isValid: true };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const validateAllStepsUpTo = (step) => {
    let isValid = true;
    const newErrors = { ...formErrors, general: "" };

    if (step >= 0) {
      const usernameValidation = validateUsername(formData.username);
      if (!usernameValidation.isValid) {
        newErrors.username = usernameValidation.message;
        isValid = false;
      }

      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
        isValid = false;
      }
    }

    if (step >= 1) {
      const companyValidation = validateCompanyName(formData.company_name);
      if (!companyValidation.isValid) {
        newErrors.company_name = companyValidation.message;
        isValid = false;
      }

      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.message;
        isValid = false;
      }
    }

    if (step >= 2) {
      const phoneValidation = validatePhoneNumber(formData.contact_number);
      if (!phoneValidation.isValid) {
        newErrors.contact_number = phoneValidation.message;
        isValid = false;
      }

      const addressValidation = validateAddress(formData.address);
      if (!addressValidation.isValid) {
        newErrors.address = addressValidation.message;
        isValid = false;
      }
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthLabel = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return { label: "Weak", class: "weak" };
      case 2:
        return { label: "Fair", class: "fair" };
      case 3:
        return { label: "Good", class: "good" };
      case 4:
        return { label: "Strong", class: "strong" };
      default:
        return { label: "", class: "" };
    }
  };

  const nextStep = () => {
    if (validateAllStepsUpTo(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    validateAllStepsUpTo(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllStepsUpTo(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(false);

    try {
      const customerResponse = await fetch("http://127.0.0.1:8000/api/customer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          user_type: "employer",
          status: 1,
        }),
      });

      if (!customerResponse.ok) {
        let errorMessage = "Customer creation failed";
        try {
          const errorData = await customerResponse.json();
          errorMessage = errorData.detail || JSON.stringify(errorData) || errorMessage;
        } catch (parseError) {
          // Fallback if response is not JSON
        }
        throw new Error(errorMessage);
      }

      const customerData = await customerResponse.json();

      const employerResponse = await fetch("http://127.0.0.1:8000/api/employer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: customerData.user_id,
          company_name: formData.company_name,
          email: formData.email,
          contact_number: formData.contact_number,
          address: formData.address,
        }),
      });

      if (!employerResponse.ok) {
        let errorMessage = "Employer creation failed";
        try {
          const errorData = await employerResponse.json();
          errorMessage = errorData.detail || JSON.stringify(errorData) || errorMessage;
        } catch (parseError) {
          // Fallback if response is not JSON
        }
        throw new Error(errorMessage);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setSubmitError(true);
      console.error("Signup error:", error.message);
      setFormErrors((prev) => ({
        ...prev,
        general: error.message.includes("Failed to fetch")
          ? "Network error: Please check your connection"
          : error.message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`step ${i < currentStep ? "completed" : ""} ${i === currentStep ? "current" : ""}`}
          >
            <div className="step-circle">
              {i < currentStep ? (
                <span className="step-check">✓</span>
              ) : (
                <span className="step-number">{i + 1}</span>
              )}
            </div>
            <div className="step-label">
              {i === 0 && "Account"}
              {i === 1 && "Company Info"}
              {i === 2 && "Contact"}
            </div>
            {i < totalSteps - 1 && <div className="step-line"></div>}
          </div>
        ))}
      </div>
    );
  };

  const renderFormField = ({ id, label, type, name, value, placeholder, required = true, error }) => {
    return (
      <div className={`form-field ${error ? "has-error" : ""}`}>
        <label htmlFor={id} className="field-label">
          {label} {required && <span className="required-mark">*</span>}
        </label>
        {type === "textarea" ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="form-textarea"
            required={required}
          />
        ) : (
          <input
            id={id}
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="form-input"
            required={required}
          />
        )}
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="form-step account-step">
            <h3 className="step-title">Account Information</h3>
            {renderFormField({
              id: "username",
              label: "Username",
              type: "text",
              name: "username",
              value: formData.username,
              placeholder: "Choose a username",
              error: formErrors.username,
            })}
            <div className="password-field">
              {renderFormField({
                id: "password",
                label: "Password",
                type: showPassword ? "text" : "password",
                name: "password",
                value: formData.password,
                placeholder: "Choose a secure password",
                error: formErrors.password,
              })}
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="password-strength-meter" role="region" aria-live="polite">
              <div className="strength-bars">
                {Array.from({ length: 4 }, (_, i) => {
                  const strength = calculatePasswordStrength(formData.password);
                  const { class: strengthClass } = getPasswordStrengthLabel(strength);
                  return (
                    <div
                      key={i}
                      className={`strength-bar ${i < strength ? strengthClass : ""}`}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
              {formData.password && (
                <span className="strength-label">
                  Password Strength: {getPasswordStrengthLabel(calculatePasswordStrength(formData.password)).label}
                </span>
              )}
            </div>
            <div className="password-requirements">
              <p>Password must:</p>
              <ul>
                <li className={formData.password.length >= 8 ? "met" : ""}>
                  Be at least 8 characters long
                </li>
                <li className={/[A-Z]/.test(formData.password) ? "met" : ""}>
                  Include at least one uppercase letter
                </li>
                <li className={/[a-z]/.test(formData.password) ? "met" : ""}>
                  Include at least one lowercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? "met" : ""}>
                  Include at least one number
                </li>
              </ul>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="form-step company-step">
            <h3 className="step-title">Company Information</h3>
            {renderFormField({
              id: "company_name",
              label: "Company Name",
              type: "text",
              name: "company_name",
              value: formData.company_name,
              placeholder: "Enter your company name",
              error: formErrors.company_name,
            })}
            {renderFormField({
              id: "email",
              label: "Email Address",
              type: "email",
              name: "email",
              value: formData.email,
              placeholder: "Enter company email address",
              error: formErrors.email,
            })}
          </div>
        );
      case 2:
        return (
          <div className="form-step contact-step">
            <h3 className="step-title">Contact Details</h3>
            {renderFormField({
              id: "contact_number",
              label: "Contact Number",
              type: "tel",
              name: "contact_number",
              value: formData.contact_number,
              placeholder: "Enter contact number (e.g., +1234567890)",
              error: formErrors.contact_number,
            })}
            {renderFormField({
              id: "address",
              label: "Business Address",
              type: "textarea",
              name: "address",
              value: formData.address,
              placeholder: "Enter company address",
              error: formErrors.address,
            })}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <header className="signup-header">
          <Link to="/" className="logo">
            <Building2 size={24} />
            <h1>JobEasy</h1>
          </Link>
        </header>
        <div className="signup-content">
          <div className="signup-left">
            <div className="signup-info">
              <h2>Join Our Employer Network</h2>
              <p>Create an account to start posting jobs and finding the best talent for your company.</p>
              <div className="benefits">
                <div className="benefit-item">
                  <UserPlus size={20} />
                  <span>Access to thousands of qualified candidates</span>
                </div>
                <div className="benefit-item">
                  <Mail size={20} />
                  <span>Direct communication with applicants</span>
                </div>
                <div className="benefit-item">
                  <Phone size={20} />
                  <span>Dedicated support from our team</span>
                </div>
                <div className="benefit-item">
                  <MapPin size={20} />
                  <span>Targeted local and global recruitment</span>
                </div>
              </div>
              <div className="login-link">
                <span>Already have an account?</span>
                <Link to="/login">Log in</Link>
              </div>
            </div>
          </div>
          <div className="signup-right">
            <div className="signup-card">
              <h2 className="form-title">Employer Registration</h2>
              {renderStepIndicator()}
              <form
                onSubmit={handleSubmit}
                className="signup-form"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && currentStep < totalSteps - 1) {
                    e.preventDefault();
                    nextStep();
                  }
                }}
              >
                {renderStepContent()}
                <div className="form-navigation">
                  {currentStep > 0 && (
                    <button type="button" className="btn btn-secondary" onClick={prevStep}>
                      <ArrowLeft size={16} />
                      Back
                    </button>
                  )}
                  {currentStep < totalSteps - 1 ? (
                    <button type="button" className="btn btn-primary" onClick={nextStep}>
                      Next
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Complete Registration"}
                    </button>
                  )}
                </div>
                {submitSuccess && (
                  <div className="submit-message success">
                    <p>Registration successful! Redirecting to login...</p>
                  </div>
                )}
                {submitError && (
                  <div className="submit-message error">
                    <p>Registration failed: {formErrors.general || "Please try again later."}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerSignup;