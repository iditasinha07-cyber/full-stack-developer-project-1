import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api";

function initials(name) {
  return name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
}

function Avatar({ emp }) {
  if (emp?.profile_image) {
    return <img src={`${API.replace('/api','')}  /uploads/${emp.profile_image}`} alt={emp.name} className="avatar" style={{borderRadius:"50%",width:34,height:34,objectFit:"cover"}} />;
  }
  return <div className="avatar">{initials(emp?.name || "?")}</div>;
}

// ─── AUTH PAGES ───────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });
  const [error, setError] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const url = mode === "login" ? `${API}/auth/login` : `${API}/auth/signup`;
      const res = await axios.post(url, form);
      if (mode === "login") {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLogin(res.data.user);
      } else {
        alert("Account created! Please login.");
        setMode("login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>🏢 iSoftzone HRMS</h1>
          <p>Human Resource Management System</p>
        </div>
        <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        {error && <p style={{color:"#A32D2D",fontSize:13,marginBottom:12,background:"#FCEBEB",padding:"8px 12px",borderRadius:8}}>{error}</p>}
        <form onSubmit={submit}>
          {mode === "signup" && <input name="name" placeholder="Full name" onChange={handle} required />}
          <input name="email" type="email" placeholder="Email address" onChange={handle} required />
          <input name="password" type="password" placeholder="Password" onChange={handle} required />
          {mode === "signup" && (
            <select name="role" onChange={handle}>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <button type="submit" className="btn-auth">
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── EDIT EMPLOYEE MODAL ──────────────────────────────────
function EditModal({ emp, departments, onClose, onSave }) {
  const [form, setForm] = useState({
    name: emp.name || "", email: emp.email || "",
    phone: emp.phone || "", address: emp.address || "",
    designation: emp.designation || "", salary: emp.salary || "",
    department_id: emp.department_id || ""
  });
  const [image, setImage] = useState(null);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("profile_image", image);
    await axios.put(`${API}/employees/${emp.id}`, fd);
    onSave();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Edit Employee
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group"><label>Full name</label><input name="name" value={form.name} onChange={handle} /></div>
            <div className="form-group"><label>Email</label><input name="email" value={form.email} onChange={handle} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input name="phone" value={form.phone} onChange={handle} /></div>
            <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={handle} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Designation</label><input name="designation" value={form.designation} onChange={handle} /></div>
            <div className="form-group"><label>Salary</label><input name="salary" value={form.salary} onChange={handle} /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select name="department_id" value={form.department_id} onChange={handle}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Profile photo</label><input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} /></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button type="button" className="btn" style={{background:"#f0f0f0",color:"#333"}} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [tab, setTab] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({});
  const [editEmp, setEditEmp] = useState(null);
  const [leaveTab, setLeaveTab] = useState("apply");
  const [leaveForm, setLeaveForm] = useState({ employee_id:"", leave_type_id:"", from_date:"", to_date:"", total_days:"", reason:"" });

  const fetchAll = () => {
    axios.get(`${API}/employees`).then(r => setEmployees(r.data)).catch(()=>{});
    axios.get(`${API}/employees/meta/departments`).then(r => setDepartments(r.data)).catch(()=>{});
    axios.get(`${API}/employees/meta/stats`).then(r => setStats(r.data)).catch(()=>{});
    axios.get(`${API}/leave/types`).then(r => setLeaveTypes(r.data)).catch(()=>{});
    axios.get(`${API}/leave`).then(r => setLeaves(r.data)).catch(()=>{});
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    await axios.delete(`${API}/employees/${id}`);
    fetchAll();
  };

  const applyLeave = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/leave/apply`, leaveForm);
    alert("Leave applied!");
    fetchAll();
  };

  const handleLeaveAction = async (id, action) => {
    await axios.put(`${API}/leave/approve/${id}`, { action, remarks: action, approved_by: user.id });
    fetchAll();
  };

  const navItems = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "employees", icon: "👥", label: "Employees" },
    { key: "leave", icon: "📅", label: "Leave Management" },
  ];

  if (!user) return <AuthPage onLogin={(u) => { setUser(u); }} />;

  return (
    <div style={{display:"flex"}}>
      {editEmp && <EditModal emp={editEmp} departments={departments} onClose={() => setEditEmp(null)} onSave={fetchAll} />}

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>iSoftzone</h2>
          <p>HRMS Platform</p>
        </div>
        <div className="sidebar-nav">
          {navItems.map(n => (
            <div key={n.key} className={`nav-item ${tab===n.key?"active":""}`} onClick={() => setTab(n.key)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </div>
        <div className="sidebar-user">
          <div className="avatar">{initials(user.name)}</div>
          <div className="info">
            <p>{user.name}</p>
            <span>{user.role}</span>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="stats-grid">
              <div className="stat-card stat-purple"><div className="stat-icon">👥</div><div className="stat-label">Total employees</div><div className="stat-value">{stats.totalEmployees || 0}</div></div>
              <div className="stat-card stat-green"><div className="stat-icon">🏢</div><div className="stat-label">Departments</div><div className="stat-value">{stats.totalDepartments || 0}</div></div>
              <div className="stat-card stat-amber"><div className="stat-icon">⏳</div><div className="stat-label">Pending leaves</div><div className="stat-value">{stats.pending || 0}</div></div>
              <div className="stat-card stat-teal"><div className="stat-icon">✅</div><div className="stat-label">Approved leaves</div><div className="stat-value">{stats.approved || 0}</div></div>
              <div className="stat-card stat-red"><div className="stat-icon">❌</div><div className="stat-label">Rejected leaves</div><div className="stat-value">{stats.rejected || 0}</div></div>
              <div className="stat-card stat-purple"><div className="stat-icon">🛠</div><div className="stat-label">Total skills</div><div className="stat-value">{stats.totalSkills || 0}</div></div>
              <div className="stat-card stat-green" style={{gridColumn:"span 2"}}><div className="stat-icon">💰</div><div className="stat-label">Total salary expense</div><div className="stat-value">₹{Number(stats.totalSalary||0).toLocaleString("en-IN")}</div></div>
            </div>
            <div className="card">
              <div className="card-title">👋 Welcome, {user.name}</div>
              <p style={{fontSize:14,color:"#666",lineHeight:1.7}}>You are logged in as <strong>{user.role}</strong>. Use the sidebar to navigate between employees, leave management, and more.</p>
            </div>
          </div>
        )}

        {/* EMPLOYEES */}
        {tab === "employees" && (
          <div>
            <h1 className="page-title">Employees</h1>
            <div className="card">
              <div className="card-title">👥 All employees — {employees.length} total</div>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Salary</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="emp-cell">
                          {emp.profile_image
                            ? <img src={`http://localhost:5000/uploads/${emp.profile_image}`} alt={emp.name} style={{width:34,height:34,borderRadius:"50%",objectFit:"cover"}} />
                            : <div className="avatar">{initials(emp.name)}</div>
                          }
                          <div>
                            <div style={{fontWeight:500}}>{emp.name}</div>
                            <div style={{fontSize:12,color:"#888"}}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.designation || "—"}</td>
                      <td><span className="pill pill-purple">{emp.department_name || "—"}</span></td>
                      <td>{emp.phone || "—"}</td>
                      <td>{emp.salary ? `₹${Number(emp.salary).toLocaleString("en-IN")}` : "—"}</td>
                      <td><span className={`pill ${emp.role==="admin"?"pill-red":emp.role==="hr"?"pill-green":emp.role==="manager"?"pill-amber":"pill-blue"}`}>{emp.role}</span></td>
                      <td>
                        <div className="actions-row">
                          <button className="btn btn-edit" onClick={() => setEditEmp(emp)}>Edit</button>
                          <button className="btn btn-danger" onClick={() => deleteEmployee(emp.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEAVE */}
        {tab === "leave" && (
          <div>
            <h1 className="page-title">Leave Management</h1>
            <div className="tabs">
              <button className={`tab ${leaveTab==="apply"?"active":""}`} onClick={() => setLeaveTab("apply")}>Apply for leave</button>
              <button className={`tab ${leaveTab==="approvals"?"active":""}`} onClick={() => setLeaveTab("approvals")}>All applications</button>
            </div>

            {leaveTab === "apply" && (
              <div className="card">
                <div className="card-title">📝 New leave application</div>
                <form onSubmit={applyLeave}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Employee</label>
                      <select onChange={e => setLeaveForm({...leaveForm, employee_id: e.target.value})}>
                        <option value="">Select employee</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Leave type</label>
                      <select onChange={e => setLeaveForm({...leaveForm, leave_type_id: e.target.value})}>
                        <option value="">Select type</option>
                        {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.leave_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>From date</label><input type="date" onChange={e => setLeaveForm({...leaveForm, from_date: e.target.value})} /></div>
                    <div className="form-group"><label>To date</label><input type="date" onChange={e => setLeaveForm({...leaveForm, to_date: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Total days</label><input type="number" placeholder="e.g. 3" onChange={e => setLeaveForm({...leaveForm, total_days: e.target.value})} /></div>
                    <div className="form-group"><label>Reason</label><input placeholder="Reason for leave" onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} /></div>
                  </div>
                  <button type="submit" className="btn btn-primary">Submit application</button>
                </form>
              </div>
            )}

            {leaveTab === "approvals" && (
              <div className="card">
                <div className="card-title">📋 Leave applications</div>
                <table>
                  <thead>
                    <tr><th>Employee</th><th>Leave type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id}>
                        <td><strong>{l.employee_name}</strong></td>
                        <td>{l.leave_name}</td>
                        <td>{l.from_date?.slice(0,10)}</td>
                        <td>{l.to_date?.slice(0,10)}</td>
                        <td>{l.total_days}</td>
                        <td style={{maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.reason}</td>
                        <td>
                          <span className={`pill ${l.status==="Approved"?"pill-green":l.status==="Rejected"?"pill-red":"pill-amber"}`}>
                            {l.status}
                          </span>
                        </td>
                        <td>
                          {l.status === "Pending" && (
                            <div className="actions-row">
                              <button className="btn btn-success" onClick={() => handleLeaveAction(l.id, "Approved")}>Approve</button>
                              <button className="btn btn-danger" onClick={() => handleLeaveAction(l.id, "Rejected")}>Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}