import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import { AdminRoute, ProtectedRoute, StudentRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';
import './App.css';

const AppToastContext = createContext(null);

const features = [
  {
    icon: Shield,
    title: 'Secure Authentication',
    description: 'JWT-based secure authentication.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Controlled access for students and administrators.',
  },
  {
    icon: GraduationCap,
    title: 'Student Management',
    description: 'Centralized student information and operations.',
  },
  {
    icon: Sparkles,
    title: 'Enterprise Architecture',
    description: 'FastAPI + JWT + Supabase powered backend.',
  },
];

function normalizeStudents(payload) {
  const source = Array.isArray(payload) ? payload : payload?.students || [];
  return source.map((student, index) => ({
    id: student.id ?? index + 1,
    name: student.name || 'Unnamed student',
    age: student.age ?? 20,
    course: student.course || 'General',
    semester: student.semester ?? 1,
    email: student.email || 'noreply@example.com',
  }));
}

function AppToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  return (
    <AppToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-icon">{toast.type === 'error' ? '!' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AppToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(AppToastContext);
  if (!ctx) {
    throw new Error('AppToastContext missing');
  }
  return ctx;
}

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="brand-wrap">
          <div className="brand-tag">Shaun@college_Database</div>
        </div>
        <div className="landing-actions">
          <Link className="link-button secondary" to="/login">
            Sign In
          </Link>
          <Link className="link-button primary" to="/register">
            Create Account
          </Link>
        </div>
      </header>

      <main className="hero-shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow gold">Enterprise Student Management Platform</span>
            <h1>
              Shaun@college_Database
              <span className="subtitle">Secure. Intelligent. Centralized Student Management.</span>
            </h1>
            <p>
              A modern enterprise platform for secure student data management,
              authentication, authorization, and administrative operations.
            </p>
            <div className="cta-row">
              <Link className="link-button primary" to="/login">
                Sign In
              </Link>
              <Link className="link-button secondary" to="/register">
                Create Account
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-card signal-card">
              <div className="signal-header">
                <span className="live-dot" />
                System Integrity
              </div>
              <div className="signal-metric">
                <strong>99.98%</strong>
                <span>Operational uptime</span>
              </div>
              <div className="signal-row">
                <span>JWT</span>
                <span>RBAC</span>
                <span>SCM</span>
              </div>
            </div>
            <div className="panel-card mini-grid">
              <div className="mini-box">
                <ShieldCheck size={18} />
                <span>Verified</span>
              </div>
              <div className="mini-box">
                <Users size={18} />
                <span>Roles</span>
              </div>
              <div className="mini-box">
                <FileText size={18} />
                <span>Audit</span>
              </div>
              <div className="mini-box">
                <Lock size={18} />
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>

        <section className="feature-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      await login(form);
      showToast('success', '✓ Login successful');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err.response?.data?.detail || 'Unable to sign in. Please check your email and password.';
      setError(message);
      showToast('error', 'Unable to sign in. Please check your email and password.');
      console.error('Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual">
          <div className="auth-brand">
            <span className="brand-tag">Shaun@college_Database</span>
          </div>
          <div className="security-copy">
            <h2>Enterprise-grade access control.</h2>
            <p>Protecting student data with secure authentication and role-aware access control.</p>
          </div>
          <div className="visual-blocks">
            <div className="visual-box accent" />
            <div className="visual-box" />
            <div className="visual-box alt" />
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="form-header">
            <p className="eyebrow gold">Welcome back</p>
            <h2>Sign in</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Email</span>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="shaun@example.com"
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? <div className="field-error">{error}</div> : null}

            <div className="form-row inline-row">
              <button type="button" className="subtle-link-button" onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </button>
              <Link to="/register" className="subtle-link-button">
                Create account
              </Link>
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!form.password) return { label: 'No password', score: 0 };
    if (form.password.length >= 8 && /[A-Z]/.test(form.password) && /\d/.test(form.password)) {
      return { label: 'Strong', score: 3 };
    }
    if (form.password.length >= 6) {
      return { label: 'Moderate', score: 2 };
    }
    return { label: 'Weak', score: 1 };
  }, [form.password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Use a stronger password with at least 8 characters and a number.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setRegistered(true);
      showToast('success', 'Account created successfully');
    } catch (err) {
      const message = err.response?.data?.detail || 'Unable to create account.';
      setError(message);
      showToast('error', 'Registration failed. Please try again.');
      console.error('Registration failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="auth-page">
        <div className="success-panel">
          <CheckCircle2 size={52} className="success-icon" />
          <h2>Account created</h2>
          <p>Your profile is ready for approval and secure login access.</p>
          <button type="button" className="primary-button" onClick={() => navigate('/login')}>
            Continue to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual alt-visual">
          <div className="auth-brand">
            <span className="brand-tag">Shaun@college_Database</span>
          </div>
          <div className="security-copy">
            <h2>Secure access begins here.</h2>
            <p>Register a verified enterprise profile for central student operations.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="form-header">
            <p className="eyebrow gold">New account</p>
            <h2>Create Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Full Name</span>
              <div className="input-wrap">
                <User size={16} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Shaun"
                />
              </div>
            </label>

            <label>
              <span>Email</span>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="shaun@example.com"
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a secure password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="strength-meter">
              <div className={`strength-bar level-${passwordStrength.score}`} />
              <span>{passwordStrength.label}</span>
            </div>

            <label>
              <span>Confirm Password</span>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? <div className="field-error">{error}</div> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/forgot-password', { email });
      setMessage(response.data.message || 'If this email is registered, a reset link has been sent.');
      if (response.data.reset_link) {
        setMessage(`${response.data.message}. Development reset link: ${response.data.reset_link}`);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to process your password reset request.';
      setError(detail);
      console.error('Forgot password failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual">
          <div className="auth-brand">
            <span className="brand-tag">Shaun@college_Database</span>
          </div>
          <div className="security-copy">
            <h2>Reset access securely.</h2>
            <p>Enter the email linked to your account and we will send a secure reset link.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="form-header">
            <p className="eyebrow gold">Password recovery</p>
            <h2>Forgot Password</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Email</span>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="shaun@example.com"
                />
              </div>
            </label>

            {error ? <div className="field-error">{error}</div> : null}
            {message ? <div className="status-box">{message}</div> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>

            <button type="button" className="secondary-button" onClick={() => navigate('/login')}>
              Back to Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!form.password) return { label: 'No password', score: 0 };
    if (form.password.length >= 8 && /[A-Z]/.test(form.password) && /\d/.test(form.password)) {
      return { label: 'Strong', score: 3 };
    }
    if (form.password.length >= 6) {
      return { label: 'Moderate', score: 2 };
    }
    return { label: 'Weak', score: 1 };
  }, [form.password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Use a stronger password with at least 8 characters and a number.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/reset-password', {
        token,
        new_password: form.password,
      });
      setSuccess(true);
      showToast('success', 'Password reset successfully');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Unable to reset your password.';
      setError(detail);
      showToast('error', 'Unable to reset password.');
      console.error('Reset password failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="success-panel">
          <CheckCircle2 size={52} className="success-icon" />
          <h2>Password reset successful</h2>
          <p>You can now sign in with your new password.</p>
          <button type="button" className="primary-button" onClick={() => navigate('/login')}>
            Continue to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual alt-visual">
          <div className="auth-brand">
            <span className="brand-tag">Shaun@college_Database</span>
          </div>
          <div className="security-copy">
            <h2>Choose a new password.</h2>
            <p>Create a stronger password to protect your account and student profile.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="form-header">
            <p className="eyebrow gold">Account recovery</p>
            <h2>Reset Password</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>New Password</span>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Create a secure password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="strength-meter">
              <div className={`strength-bar level-${passwordStrength.score}`} />
              <span>{passwordStrength.label}</span>
            </div>

            <label>
              <span>Confirm New Password</span>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  placeholder="Confirm your new password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? <div className="field-error">{error}</div> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(normalizeStudents(response.data));
    } catch (error) {
      console.error('Failed to load students', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const stats = useMemo(() => {
    const total = students.length;
    const semesterCounts = students.reduce((acc, student) => {
      acc[student.semester] = (acc[student.semester] || 0) + 1;
      return acc;
    }, {});

    const currentSemester = Object.entries(semesterCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '6';

    return [
      { label: 'Total Students', value: total },
      { label: 'Active Users', value: total },
      { label: 'Current Semester', value: `Sem ${currentSemester}` },
      { label: 'User Role', value: user?.role || 'student' },
    ];
  }, [students, user]);

  if (loading) {
    return <div className="panel-card skeleton-card" />;
  }

  if (user?.role === 'admin') {
    return (
      <div className="dashboard-stack">
        <div className="kpi-grid">
          {stats.map((stat) => (
            <div className="trend-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <div className="panel-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Overview</p>
              <h3>Student management</h3>
            </div>
            <Link className="link-button primary small" to="/admin">
              + Add Student
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 5).map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td>{student.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-stack">
      <div className="welcome-card panel-card">
        <div>
          <p className="eyebrow">Welcome</p>
          <h2>Welcome back, {user?.name || 'Shaun'}</h2>
        </div>
        <div className="info-pill-group">
          <span className="info-pill">Email: {user?.email}</span>
          <span className="info-pill">Role: {user?.role}</span>
          <span className="info-pill">Account status: Active</span>
        </div>
      </div>

      <div className="panel-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Student directory</p>
            <h3>Portfolio overview</h3>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 6).map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.age}</td>
                <td>{student.course}</td>
                <td>{student.semester}</td>
                <td>{student.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(normalizeStudents(response.data));
    } catch (error) {
      console.error('Failed to load students', error);
      showToast('error', 'The server is currently unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = useMemo(() => {
    const text = search.toLowerCase();
    return [...students]
      .filter((student) => {
        const matchesSearch =
          !text ||
          student.name.toLowerCase().includes(text) ||
          student.email.toLowerCase().includes(text) ||
          student.course.toLowerCase().includes(text);

        const matchesCourse = filterCourse === 'all' || student.course === filterCourse;
        return matchesSearch && matchesCourse;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'course') return a.course.localeCompare(b.course);
        if (sortBy === 'semester') return a.semester - b.semester;
        return a.id - b.id;
      });
  }, [students, search, filterCourse, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 6));
  const paginated = filtered.slice((page - 1) * 6, page * 6);

  const courses = [...new Set(students.map((student) => student.course))];

  useEffect(() => {
    setPage(1);
  }, [search, filterCourse, sortBy]);

  return (
    <div className="panel-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Directory</p>
          <h3>Student records</h3>
        </div>
        {user?.role === 'admin' ? (
          <Link className="link-button primary small" to="/admin">
            + Add Student
          </Link>
        ) : null}
      </div>

      <div className="toolbar">
        <input
          className="table-search"
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={filterCourse} onChange={(event) => setFilterCourse(event.target.value)}>
          <option value="all">All courses</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="id">Sort by ID</option>
          <option value="name">Sort by Name</option>
          <option value="course">Sort by Course</option>
          <option value="semester">Sort by Semester</option>
        </select>
      </div>

      {loading ? (
        <div className="skeleton-table" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Email</th>
                {user?.role === 'admin' ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {paginated.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.age}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td>{student.email}</td>
                  {user?.role === 'admin' ? (
                    <td>
                      <div className="table-actions">
                        <Link to={`/students/${student.id}`} className="table-action-view">
                          View
                        </Link>
                        <button type="button" className="table-action-button">Edit</button>
                        <button type="button" className="table-action-button danger">Delete</button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button type="button" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/me');
        setProfile(response.data.user || response.data);
      } catch (error) {
        console.error('Failed to load current user', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return <div className="panel-card skeleton-card" />;
  }

  const currentUser = profile || user;

  return (
    <div className="profile-grid">
      <div className="panel-card profile-card">
        <div className="profile-header">
          <div className="avatar large">{currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <p className="eyebrow">Profile</p>
            <h2>{currentUser?.name || 'User'}</h2>
          </div>
        </div>

        <div className="profile-list">
          <div><span>Name</span><strong>{currentUser?.name}</strong></div>
          <div><span>Email</span><strong>{currentUser?.email}</strong></div>
          <div><span>User ID</span><strong>{currentUser?.id || 'N/A'}</strong></div>
          <div><span>Role</span><strong>{currentUser?.role}</strong></div>
          <div><span>Authentication status</span><strong>Secure session active</strong></div>
        </div>
      </div>
    </div>
  );
}

function StudentDetailsPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const response = await api.get(`/students/${id}`);
        setStudent(response.data);
      } catch (error) {
        console.error('Student detail fetch failed', error);
      }
    };

    loadStudent();
  }, [id]);

  if (!student) {
    return <div className="panel-card skeleton-card" />;
  }

  return (
    <div className="panel-card detail-card">
      <p className="eyebrow">Student Details</p>
      <h2>{student.name}</h2>
      <div className="detail-grid">
        <div><span>ID</span><strong>{student.id}</strong></div>
        <div><span>Age</span><strong>{student.age}</strong></div>
        <div><span>Course</span><strong>{student.course}</strong></div>
        <div><span>Semester</span><strong>{student.semester}</strong></div>
        <div><span>Email</span><strong>{student.email}</strong></div>
      </div>
    </div>
  );
}

function AdminPage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', course: '', semester: '', email: '' });

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(normalizeStudents(response.data));
    } catch (error) {
      console.error('Failed to fetch students for admin', error);
      showToast('error', 'The server is currently unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openCreateModal = () => {
    setEditingStudent(null);
    setForm({ name: '', age: '', course: '', semester: '', email: '' });
    setShowForm(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student.id);
    setForm({
      name: student.name,
      age: student.age,
      course: student.course,
      semester: student.semester,
      email: student.email,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name,
      age: Number(form.age),
      course: form.course,
      semester: Number(form.semester),
      email: form.email,
    };

    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent}`, payload);
        showToast('success', '✓ Student updated');
      } else {
        await api.post('/students', payload);
        showToast('success', '✓ Student created');
      }
      setShowForm(false);
      fetchStudents();
    } catch (error) {
      showToast('error', 'Unable to complete student update.');
      console.error('Student save failed', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${pendingDelete.id}`);
      showToast('success', '✓ Student deleted');
      setPendingDelete(null);
      fetchStudents();
    } catch (error) {
      showToast('error', 'Unable to delete student.');
      console.error('Delete failed', error);
    }
  };

  return (
    <div className="dashboard-stack">
      <div className="kpi-grid admin-grid">
        <div className="trend-card"><span>Total students</span><strong>{students.length}</strong></div>
        <div className="trend-card"><span>Courses</span><strong>{new Set(students.map((s) => s.course)).size}</strong></div>
        <div className="trend-card"><span>Recent activity</span><strong>Live</strong></div>
        <div className="trend-card"><span>System info</span><strong>Secure</strong></div>
      </div>

      <div className="panel-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h3>Student management</h3>
          </div>
          <button type="button" className="primary-button small" onClick={openCreateModal}>
            + Add Student
          </button>
        </div>

        {loading ? (
          <div className="skeleton-table" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.age}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td>{student.email}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/students/${student.id}`} className="table-action-view">View</Link>
                      <button type="button" className="table-action-button" onClick={() => openEditModal(student)}>Edit</button>
                      <button type="button" className="table-action-button danger" onClick={() => setPendingDelete(student)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm ? (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStudent ? 'Edit Student' : 'Add Student'}</h3>
              <button type="button" className="close-button" onClick={() => setShowForm(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="field-grid">
                <label>
                  <span>Name</span>
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label>
                  <span>Age</span>
                  <input value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
                </label>
                <label>
                  <span>Course</span>
                  <input value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} />
                </label>
                <label>
                  <span>Semester</span>
                  <input value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })} />
                </label>
                <label className="full-width">
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingStudent ? 'Save changes' : 'Create student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
          <div className="modal-card confirm-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Student?</h3>
              <button type="button" className="close-button" onClick={() => setPendingDelete(null)}>
                <X size={16} />
              </button>
            </div>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={handleDelete}>
                Delete Student
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="status-page">
      <div className="status-card">
        <CircleAlert size={56} className="warning-icon" />
        <h1>Access Restricted</h1>
        <p>Your account does not have permission to access this resource.</p>
        <Link className="primary-button inline-link" to="/dashboard">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="status-page">
      <div className="status-card">
        <FileText size={56} className="warning-icon" />
        <h1>Page Not Found</h1>
        <p>The page you are looking for could not be found.</p>
        <Link className="primary-button inline-link" to="/dashboard">
          Return Home
        </Link>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/students/:id" element={<StudentDetailsPage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route element={<StudentRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppToastProvider>
          <AppRoutes />
        </AppToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
