import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        form
      );
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── LEFT PANEL ── */}
      <div className="lp-left">
        <div className="lp-blob lp-blob1" />
        <div className="lp-blob lp-blob2" />
        <div className="lp-brand">
          <div className="lp-logo">🏢</div>
          <h1>iSoftzone HRMS</h1>
          <p>Human Resource Management System —<br />your complete workforce platform</p>
          <ul className="lp-features">
            <li><span className="lp-feat-icon">👥</span> Employee Management</li>
            <li><span className="lp-feat-icon">📅</span> Leave & Attendance</li>
            <li><span className="lp-feat-icon">💰</span> Payroll & Reports</li>
            <li><span className="lp-feat-icon">💻</span> Asset Tracking</li>
          </ul>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="lp-right">
        <div className="lp-card">
          <h2>Welcome back 👋</h2>
          <p className="lp-sub">Sign in to your HRMS account</p>

          {error && <div className="lp-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="lp-field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@isoftzone.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="lp-field">
              <label>Password</label>
              <div className="lp-pw-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPw(!showPw)}
                  aria-label="Toggle password"
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="lp-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div className="lp-divider"><span>or</span></div>
          <p className="lp-signup">
            Don't have an account?{" "}
            <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}