// App.js
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Login from "./components/Login"
import Home from "./components/Home"
import JobSeekerSignup from "./components/JobSeekerSignup"
import EmployerSignup from "./components/EmployerSignup"
import EmployerDashboard from "./components/employer-dashboard"
import ApplicantDashboard from "./components/applicant-dashboard"
import AdminDashboard from "./components/admin-dashboard"
import Error from "./components/Error"
import EmployerChat from "./components/chat/EmployerChat"
import ApplicantChat from "./components/chat/ApplicantChat"
import EmployerPayment from "./components/payment/EmployerPayment"
import ApplicantPayment from "./components/payment/ApplicantPayment"
import EmployerFeedback from "./components/feedback/employer-feedback";
import ApplicantFeedback from "./components/feedback/applicant-feedback";

function App() {
  return (
    <Router>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/job-seeker-signup" element={<JobSeekerSignup />} />
            <Route path="/employer-signup" element={<EmployerSignup />} />
            <Route path="/employer-dashboard" element={<EmployerDashboard />} />
            <Route path="/applicant-dashboard" element={<ApplicantDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/Error" element={<Error />} />
            <Route path="/chat/EmployerChat" element={<EmployerChat />} />
            <Route path="/chat/ApplicantChat" element={<ApplicantChat />} />
            <Route path="/payment/EmployerPayment" element={<EmployerPayment />} />
            <Route path="/payment/ApplicantPayment" element={<ApplicantPayment />} />
            <Route path="/feedback/employer-feedback" element={<EmployerFeedback />} />
            <Route path="/feedback/applicant-feedback" element={<ApplicantFeedback />} />
          </Routes>
        </main>
    </Router>
  )
}

export default App