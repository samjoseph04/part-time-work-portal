import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { UserPlus, ArrowRight, ArrowLeft, Mail, Phone, FileText, Briefcase } from "lucide-react";
import "./signup.css";

const JobSeekerSignup = () => {
  const navigate = useNavigate();
  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resume, setResume] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    contact_number: "",
    skills: "",
    experience: "",
    preference: "",
  });

  const [formErrors, setFormErrors] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    contact_number: "",
    skills: "",
    experience: "",
    preference: "",
    resume: "",
  });

  const validateUsername = (username) => {
    if (username.length < 4) {
      return {
        isValid: false,
        message: 'Username must be at least 4 characters long'
      };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        isValid: false,
        message: 'Username can only contain letters, numbers, and underscores'
      };
    }
    return { isValid: true };
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long'
      };
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return {
        isValid: false,
        message: 'Password must include uppercase, lowercase, and numbers'
      };
    }
    
    return { isValid: true };
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address'
      };
    }
    return { isValid: true };
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone)) {
      return {
        isValid: false,
        message: 'Please enter a valid phone number (e.g., +1234567890)'
      };
    }
    return { isValid: true };
  };

  const validateName = (name) => {
    if (name.length < 2) {
      return {
        isValid: false,
        message: 'Name must be at least 2 characters long'
      };
    }
    return { isValid: true };
  };

  const validateField = (field, value) => {
    if (value.trim().length < 10) {
      return {
        isValid: false,
        message: `${field} must be at least 10 characters long`
      };
    }
    return { isValid: true };
  };

  const validateResume = (file) => {
    if (!file) {
      return {
        isValid: false,
        message: 'Please upload your resume'
      };
    }
    
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: 'Please upload PDF or Word document only'
      };
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return {
        isValid: false,
        message: 'File size should be less than 5MB'
      };
    }
    
    return { isValid: true };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateResume(file);
      if (!validation.isValid) {
        setFormErrors(prev => ({
          ...prev,
          resume: validation.message
        }));
        setResume(null);
      } else {
        setFormErrors(prev => ({
          ...prev,
          resume: ""
        }));
        setResume(file);
      }
    }
  };

  const validateStep = () => {
    let isValid = true;
    const newErrors = { ...formErrors };

    if (currentStep === 0) {
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
    else if (currentStep === 1) {
      const nameValidation = validateName(formData.name);
      if (!nameValidation.isValid) {
        newErrors.name = nameValidation.message;
        isValid = false;
      }

      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.message;
        isValid = false;
      }

      const phoneValidation = validatePhoneNumber(formData.contact_number);
      if (!phoneValidation.isValid) {
        newErrors.contact_number = phoneValidation.message;
        isValid = false;
      }
    }
    else if (currentStep === 2) {
      const skillsValidation = validateField('Skills', formData.skills);
      if (!skillsValidation.isValid) {
        newErrors.skills = skillsValidation.message;
        isValid = false;
      }

      const experienceValidation = validateField('Experience', formData.experience);
      if (!experienceValidation.isValid) {
        newErrors.experience = experienceValidation.message;
        isValid = false;
      }

      const preferenceValidation = validateField('Preference', formData.preference);
      if (!preferenceValidation.isValid) {
        newErrors.preference = preferenceValidation.message;
        isValid = false;
      }

      if (resume) {
        const resumeValidation = validateResume(resume);
        if (!resumeValidation.isValid) {
          newErrors.resume = resumeValidation.message;
          isValid = false;
        }
      } else {
        newErrors.resume = 'Please upload your resume';
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
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthLabel = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return { label: 'Weak', class: 'weak' };
      case 2:
        return { label: 'Fair', class: 'fair' };
      case 3:
        return { label: 'Good', class: 'good' };
      case 4:
        return { label: 'Strong', class: 'strong' };
      default:
        return { label: '', class: '' };
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(false);

    try {
      // First, create the customer record
      const customerResponse = await fetch("http://127.0.0.1:8000/api/customer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          user_type: "applicant",
          status: 1
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        throw new Error(errorData.detail || "Customer creation failed");
      }

      const customerData = await customerResponse.json();

      // Create FormData for multipart/form-data submission (for file upload)
      const formDataObj = new FormData();
      formDataObj.append("user_id", customerData.user_id);
      formDataObj.append("name", formData.name);
      formDataObj.append("email", formData.email);
      formDataObj.append("contact_number", formData.contact_number);
      formDataObj.append("skills", formData.skills);
      formDataObj.append("experience", formData.experience);
      formDataObj.append("preference", formData.preference);
      formDataObj.append("resume", resume);

      // Then create the applicant record with the user_id and resume
      const applicantResponse = await fetch("http://127.0.0.1:8000/api/applicant/", {
        method: "POST",
        body: formDataObj, // No Content-Type header, browser sets it with boundary
      });

      if (!applicantResponse.ok) {
        const errorData = await applicantResponse.json();
        throw new Error(errorData.detail || "Applicant creation failed");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      setSubmitError(true);
      console.error("Signup error:", error);
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
            className={`step ${i < currentStep ? 'completed' : ''} ${i === currentStep ? 'current' : ''}`}
          >
            <div className="step-circle">
              {i < currentStep ? (
                <span className="step-check">✓</span>
              ) : (
                <span className="step-number">{i + 1}</span>
              )}
            </div>
            <div className="step-label">
              {i === 0 && 'Account'}
              {i === 1 && 'Personal Info'}
              {i === 2 && 'Professional'}
            </div>
            {i < totalSteps - 1 && <div className="step-line"></div>}
          </div>
        ))}
      </div>
    );
  };

  const renderFormField = ({ id, label, type, name, value, placeholder, required = true, error }) => {
    return (
      <div className={`form-field ${error ? 'has-error' : ''}`}>
        <label htmlFor={id} className="field-label">
          {label} {required && <span className="required-mark">*</span>}
        </label>
        {type === 'textarea' ? (
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

  const renderFileField = ({ id, label, accept, required = true, error }) => {
    return (
      <div className={`form-field ${error ? 'has-error' : ''}`}>
        <label htmlFor={id} className="field-label">
          {label} {required && <span className="required-mark">*</span>}
        </label>
        <div className="file-upload-wrapper">
          <input
            id={id}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="form-file-input"
            required={required}
          />
          <div className="file-upload-info">
            {resume ? (
              <span className="file-name">{resume.name}</span>
            ) : (
              <span className="file-placeholder">Choose PDF or Word document</span>
            )}
          </div>
        </div>
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
              error: formErrors.username
            })}
            
            <div className="password-field">
              {renderFormField({
                id: "password",
                label: "Password",
                type: showPassword ? "text" : "password",
                name: "password",
                value: formData.password,
                placeholder: "Choose a secure password",
                error: formErrors.password
              })}
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            
            <div className="password-strength-meter">
              <div className="strength-bars">
                {Array.from({ length: 4 }, (_, i) => {
                  const strength = calculatePasswordStrength(formData.password);
                  const { class: strengthClass } = getPasswordStrengthLabel(strength);
                  return (
                    <div
                      key={i}
                      className={`strength-bar ${i < strength ? strengthClass : ''}`}
                    />
                  );
                })}
              </div>
              {formData.password && (
                <span className="strength-label">
                  {getPasswordStrengthLabel(calculatePasswordStrength(formData.password)).label}
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
          <div className="form-step personal-step">
            <h3 className="step-title">Personal Information</h3>
            {renderFormField({
              id: "name",
              label: "Full Name",
              type: "text",
              name: "name",
              value: formData.name,
              placeholder: "Enter your full name",
              error: formErrors.name
            })}
            
            {renderFormField({
              id: "email",
              label: "Email Address",
              type: "email",
              name: "email",
              value: formData.email,
              placeholder: "Enter your email address",
              error: formErrors.email
            })}
            
            {renderFormField({
              id: "contact_number",
              label: "Contact Number",
              type: "tel",
              name: "contact_number",
              value: formData.contact_number,
              placeholder: "Enter contact number (e.g., +1234567890)",
              error: formErrors.contact_number
            })}
          </div>
        );
      case 2:
        return (
          <div className="form-step professional-step">
            <h3 className="step-title">Professional Information</h3>
            {renderFormField({
              id: "skills",
              label: "Skills",
              type: "textarea",
              name: "skills",
              value: formData.skills,
              placeholder: "List your skills (e.g., JavaScript, React, UI/UX Design)",
              error: formErrors.skills
            })}
            
            {renderFormField({
              id: "experience",
              label: "Experience",
              type: "textarea",
              name: "experience",
              value: formData.experience,
              placeholder: "Describe your work experience",
              error: formErrors.experience
            })}
            
            {renderFormField({
              id: "preference",
              label: "Job Preferences",
              type: "textarea",
              name: "preference",
              value: formData.preference,
              placeholder: "Describe your job preferences (e.g., remote work, industry, salary)",
              error: formErrors.preference
            })}
            
            {renderFileField({
              id: "resume",
              label: "Resume",
              accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              error: formErrors.resume
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
            <FileText size={24} />
            <h1>JobEasy</h1>
          </Link>
        </header>
        
        <div className="signup-content">
          <div className="signup-left">
            <div className="signup-info">
              <h2>Discover Flexible Jobs</h2>
              <p>Create an account to discover exciting part-time job opportunities that suit your skills and preferences.</p>
              
              <div className="benefits">
                <div className="benefit-item">
                  <UserPlus size={20} />
                  <span>Access to thousands of job opportunities</span>
                </div>
                <div className="benefit-item">
                  <Mail size={20} />
                  <span>Get notified about new matching positions</span>
                </div>
                <div className="benefit-item">
                  <Briefcase size={20} />
                  <span>Track all your applications in one place</span>
                </div>
                <div className="benefit-item">
                  <Phone size={20} />
                  <span>Connect directly with hiring managers</span>
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
              <h2 className="form-title">Employee Registration</h2>
              
              {renderStepIndicator()}
              
              <form onSubmit={handleSubmit} className="signup-form">
                {renderStepContent()}
                
                <div className="form-navigation">
                  {currentStep > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={prevStep}
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                  )}
                  
                  {currentStep < totalSteps - 1 ? (
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={nextStep}
                    >
                      Next
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Complete Registration'}
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
                    <p>Registration failed. Please try again later.</p>
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

export default JobSeekerSignup;