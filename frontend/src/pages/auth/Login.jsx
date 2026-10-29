import { useState } from "react";
import {
  Activity,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await login(username.trim(), password);

      const role = String(result?.user?.role || "").toLowerCase();

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to sign in. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-logo">
            <HeartPulse size={29} strokeWidth={2.2} />
          </div>

          <div className="login-brand-kicker">
            Smart Healthcare Management
          </div>

          <h1 className="login-brand-title">
            Better care,
            <br />
            through better coordination.
          </h1>

          <p className="login-brand-description">
            Sanjeevni Tech brings patients, clinicians, diagnostics,
            pharmacy, billing and hospital operations together in one
            secure healthcare platform.
          </p>

          <div className="login-feature-list">
            <div className="login-feature">
              <span className="login-feature-icon">
                <ShieldCheck size={15} />
              </span>
              One connected system for every hospital team
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">
                <Activity size={15} />
              </span>
              Real-time visibility across hospital operations
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">
                <Stethoscope size={15} />
              </span>
              Secure access for every hospital role
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-eyebrow">
            Secure staff portal
          </div>

          <h2>Welcome to your workspace</h2>

          <p className="login-description">
            Sign in securely to continue managing your hospital operations.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="field-group">
              <label htmlFor="username">Username</label>

              <div className="input-shell">
                <Mail className="input-icon" size={17} />

                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>

              <div className="input-shell">
                <LockKeyhole className="input-icon" size={17} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <div className="remember-row">
              <label className="flex items-center gap-2 text-[11px] text-[#55718a]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-3.5 w-3.5 accent-cyan-600"
                />
                Keep me signed in
              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  setError("Please contact the hospital administrator to reset your password.")
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing you in..." : "Continue to workspace"}
            </button>

            <div className="secure-session-row">
              <ShieldCheck size={14} />
              <span>Secure session · Role-based access · Hospital-grade security</span>
            </div>
          </form>

          <div className="login-footer">
            Sanjeevni Tech · Smart Hospital Management System
            <br />
            Securely designed for modern hospital operations
          </div>
        </div>
      </section>
    </div>
  );
}

