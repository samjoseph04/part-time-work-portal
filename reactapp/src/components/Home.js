"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./Home.css"

const Home = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Student",
      text: "JobEasy helped me find the perfect part-time job that fits around my class schedule. The process was so simple!",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Freelancer",
      text: "I've been using JobEasy for 6 months now and have found consistent gig work that supplements my income perfectly.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "Parent",
      text: "As a stay-at-home parent, JobEasy allowed me to find flexible work hours that don't interfere with family time.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(interval)
    }
  }, [testimonials.length])

  return (
    <div className="home-container">
      {/* Header */}
      <header className={`home-header ${isScrolled ? "scrolled" : ""}`}>
        <Link to="/" className="logo">
          <h1>JobEasy</h1>
        </Link>

        <nav className="nav-menu">
          <ul>
            <li>
              <button className="nav-tab"><a href="#about">About Us</a></button>
            </li>
            <li>
              <button className="nav-tab"><a href="#features">Features</a></button>
            </li>
            <li>
              <button className="nav-tab"><a href="#testimonials">Testimonials</a></button>
            </li>
            <li>
              <button className="nav-tab"><a href="#contact">Contact</a></button>
            </li>
          </ul>
        </nav>

        <div className="login-container">
          <Link to="/login" className="login-button">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">Find the Perfect Part-Time Opportunity</h2>
          <div className="hero-image">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PhhsR4AFIdd9wfmXbLJtATpffySDmT.png"
            alt="People working together"
          />
        </div>

        </div>

      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="section-header">
            <h2>About Us</h2>
            <div className="section-divider"></div>
          </div>
          <div className="about-content">
            <div className="about-text">
              <h3>Our Mission</h3>
              <p>
                At JobEasy, we're dedicated to connecting talented individuals with flexible part-time opportunities
                that fit their lifestyle. We believe that finding the right job shouldn't be a full-time job itself.
              </p>

              <h3>Our Story</h3>
              <p>
                Founded in 2023, JobEasy was created to solve the challenges faced by students, parents, and
                professionals seeking flexible work arrangements. Our platform simplifies the job search process, making
                it easier for everyone to find meaningful part-time work.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat-item">
                <span className="stat-number">200+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">70+</span>
                <span className="stat-label">Jobs Posted</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">94%</span>
                <span className="stat-label">Satisfaction Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Why Choose JobEasy</h2>
            <div className="section-divider"></div>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Application Tracker</h3>
              <p>Our Application Tracker is designed to keep job seekers informed and organizedof their job applications.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>Flexible Hours</h3>
              <p>Find opportunities that fit your schedule, whether it's evenings, weekends, or remote work.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Diverse Opportunities</h3>
              <p>From retail and hospitality to tech and creative roles, we have jobs across all industries.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Verified Employers</h3>
              <p>All employers on our platform are vetted to ensure a safe and reliable experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <h2>What Our Users Say</h2>
            <div className="section-divider"></div>
          </div>
          <div className="testimonials-carousel">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"{testimonials[activeTestimonial].text}"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-info">
                  <h4>{testimonials[activeTestimonial].name}</h4>
                  <p>{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === activeTestimonial ? "active" : ""}`}
                  onClick={() => setActiveTestimonial(index)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Contact Us</h2>
            <div className="section-divider"></div>
          </div>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Get In Touch</h3>
              <p>Have questions or feedback? We'd love to hear from you!</p>
              <div className="contact-details">
                <p>
                  <strong>Email:</strong> support@jobeasy.com
                </p>
                <p>
                  <strong>Phone:</strong> +91 62382 52896
                </p>
                <p>
                  <strong>Address:</strong> 3rd Floor, Infopark TBC (Technology Business Centre), Kochi
                </p>
              </div>
              <div className="social-links">
                <a href = "http://www.linkedin.com" className="social-icon">
                  FB
                </a>
                <a href = "http://www.linkedin.com" className="social-icon">
                  TW
                </a>
                <a href = "http://www.linkedin.com" className="social-icon">
                  IG
                </a>
                <a href = "http://www.linkedin.com" className="social-icon">
                  LI
                </a>
              </div>
            </div>
            <div className="contact-form">
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Your Name" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" required />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Subject" />
                </div>
                <div className="form-group">
                  <textarea placeholder="Your Message" rows={5} required></textarea>
                </div>
                <button type="submit" className="submit-button">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>JobEasy</h2>
            <p>Finding part-time work made easy</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li>
                  <a href="#about">About Us</a>
                </li>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#testimonials">Testimonials</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Resources</h3>
              <ul>
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
                <li>
                  <Link to="/faq">FAQ</Link>
                </li>
                <li>
                  <Link to="/support">Support</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} JobEasy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home

