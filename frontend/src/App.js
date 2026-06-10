import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import "./App.css";

const API = "http://localhost:5000/api";

function initials(name) {
  return name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
}

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

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

  const sendForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
      setForgotMsg(res.data.message);
    } catch (err) {
      setForgotMsg(err.response?.data?.message || "Error sending email");
    }
  };

  if (forgotMode) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-logo"><h1>🏢 iSoftzone HRMS</h1><p>Password Recovery</p></div>
          <h2>Forgot password</h2>
          {forgotMsg && <p style={{color:"#0F6E56",fontSize:13,marginBottom:12,background:"#EAF3DE",padding:"8px 12px",borderRadius:8}}>{forgotMsg}</p>}
          <form onSubmit={sendForgotPassword}>
            <input type="email" placeholder="Enter your email address" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required />
            <button type="submit" className="btn-auth">Send reset link</button>
          </form>
          <p className="auth-switch"><span onClick={()=>setForgotMode(false)}>← Back to login</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo"><h1>🏢 iSoftzone HRMS</h1><p>Human Resource Management System</p></div>
        <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        {error && <p style={{color:"#A32D2D",fontSize:13,marginBottom:12,background:"#FCEBEB",padding:"8px 12px",borderRadius:8}}>{error}</p>}
        <form onSubmit={submit}>
          {mode === "signup" && <input name="name" placeholder="Full name" onChange={handle} required />}
          <input name="email" type="email" placeholder="Email address" onChange={handle} required />
          <div style={{position:"relative",marginBottom:12}}>
            <input name="password" type={showPassword?"text":"password"} placeholder="Password" onChange={handle} required style={{width:"100%",paddingRight:40,marginBottom:0}} />
            <span onClick={()=>setShowPassword(!showPassword)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:16,color:"#888"}}>
              {showPassword?"🙈":"👁️"}
            </span>
          </div>
          {mode === "signup" && (
            <select name="role" onChange={handle}>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <button type="submit" className="btn-auth">{mode==="login"?"Sign in":"Create account"}</button>
        </form>
        {mode==="login" && <p className="auth-switch"><span onClick={()=>setForgotMode(true)}>Forgot password?</span></p>}
        <p className="auth-switch">
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <span onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Sign up":"Sign in"}</span>
        </p>
      </div>
    </div>
  );
}

function EditModal({ emp, departments, onClose, onSave }) {
  const [form, setForm] = useState({
    name:emp.name||"", email:emp.email||"", phone:emp.phone||"",
    address:emp.address||"", designation:emp.designation||"",
    salary:emp.salary||"", department_id:emp.department_id||""
  });
  const [image, setImage] = useState(null);
  const handle = (e) => setForm({...form,[e.target.name]:e.target.value});
  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k,v])=>fd.append(k,v));
    if (image) fd.append("profile_image",image);
    await axios.put(`${API}/employees/${emp.id}`,fd);
    onSave(); onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Edit Employee <button className="close-btn" onClick={onClose}>✕</button></div>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group"><label>Full name</label><input name="name" value={form.name} onChange={handle}/></div>
            <div className="form-group"><label>Email</label><input name="email" value={form.email} onChange={handle}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input name="phone" value={form.phone} onChange={handle}/></div>
            <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={handle}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Designation</label><input name="designation" value={form.designation} onChange={handle}/></div>
            <div className="form-group"><label>Salary</label><input name="salary" value={form.salary} onChange={handle}/></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select name="department_id" value={form.department_id} onChange={handle}>
                {departments.map(d=><option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Profile photo</label><input type="file" accept="image/*" onChange={e=>setImage(e.target.files[0])}/></div>
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

export default function App() {
  const [user, setUser] = useState(()=>{const u=localStorage.getItem("user");return u?JSON.parse(u):null;});
  const [tab, setTab] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({});
  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [leaveReport, setLeaveReport] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [editEmp, setEditEmp] = useState(null);
  const [leaveTab, setLeaveTab] = useState("apply");
  const [search, setSearch] = useState("");
  const [leaveForm, setLeaveForm] = useState({employee_id:"",leave_type_id:"",from_date:"",to_date:"",total_days:"",reason:""});
  const [assetForm, setAssetForm] = useState({asset_id:"",employee_id:""});

  // ── ROLE FLAGS ──────────────────────────────────────────
  const isAdmin    = user?.role === "admin";
  const isHR       = user?.role === "hr";
  const isManager  = user?.role === "manager";
  const isEmployee = user?.role === "employee";

  // What each role can do
  const canEditEmployee   = isAdmin || isHR;
  const canDeleteEmployee = isAdmin;
  const canApproveLeave   = isAdmin || isHR || isManager;
  const canAllocateAsset  = isAdmin;
  const canViewReports    = isAdmin || isHR;
  const canViewAllAttendance = isAdmin || isHR || isManager;

  const fetchAll = () => {
    axios.get(`${API}/employees`).then(r=>setEmployees(r.data)).catch(()=>{});
    axios.get(`${API}/employees/meta/departments`).then(r=>setDepartments(r.data)).catch(()=>{});
    axios.get(`${API}/employees/meta/stats`).then(r=>setStats(r.data)).catch(()=>{});
    axios.get(`${API}/leave/types`).then(r=>setLeaveTypes(r.data)).catch(()=>{});
    axios.get(`${API}/leave`).then(r=>setLeaves(r.data)).catch(()=>{});
    axios.get(`${API}/assets`).then(r=>setAssets(r.data)).catch(()=>{});
    axios.get(`${API}/assets/allocations`).then(r=>setAllocations(r.data)).catch(()=>{});
    axios.get(`${API}/reports/department-stats`).then(r=>setDeptStats(r.data)).catch(()=>{});
    axios.get(`${API}/reports/leaves`).then(r=>setLeaveReport(r.data)).catch(()=>{});
    axios.get(`${API}/attendance/today`).then(r=>setTodayAttendance(r.data)).catch(()=>{});
    if(user){
      axios.get(`${API}/notifications/${user.id}`).then(r=>setNotifications(r.data)).catch(()=>{});
      axios.get(`${API}/attendance/employee/${user.id}`).then(r=>setAttendance(r.data)).catch(()=>{});
    }
  };

  useEffect(()=>{if(user)fetchAll();},[user]);

  const logout = ()=>{localStorage.removeItem("token");localStorage.removeItem("user");setUser(null);};
  const deleteEmployee = async(id)=>{if(!window.confirm("Delete?"))return;await axios.delete(`${API}/employees/${id}`);fetchAll();};
  const applyLeave = async(e)=>{e.preventDefault();await axios.post(`${API}/leave/apply`,leaveForm);alert("Leave applied!");fetchAll();};
  const handleLeaveAction = async(id,action)=>{await axios.put(`${API}/leave/approve/${id}`,{action,remarks:action,approved_by:user.id});fetchAll();};
  const allocateAsset = async(e)=>{e.preventDefault();await axios.post(`${API}/assets/allocate`,assetForm);alert("Asset allocated!");fetchAll();};
  const returnAsset = async(id)=>{await axios.put(`${API}/assets/return/${id}`);fetchAll();};
  const checkIn = async()=>{await axios.post(`${API}/attendance/checkin`,{employee_id:user.id});alert("Checked in!");fetchAll();};

  const unreadCount = notifications.filter(n=>!n.is_read).length;
  const filteredEmployees = employees.filter(e=>
    e.name?.toLowerCase().includes(search.toLowerCase())||
    e.email?.toLowerCase().includes(search.toLowerCase())||
    e.department_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Nav items based on role
  const navItems = [
    {key:"dashboard", icon:"📊", label:"Dashboard"},
    {key:"employees", icon:"👥", label:"Employees"},
    {key:"attendance", icon:"🕐", label:"Attendance"},
    {key:"leave", icon:"📅", label:"Leave"},
    {key:"assets", icon:"💻", label:"Assets"},
    ...(canViewReports ? [{key:"reports", icon:"📈", label:"Reports"}] : []),
    {key:"notifications", icon:"🔔", label:`Notifications${unreadCount>0?` (${unreadCount})`:""}`},
  ];

  if(!user) return <AuthPage onLogin={(u)=>setUser(u)}/>;

  return (
    <div style={{display:"flex"}}>
      {editEmp&&<EditModal emp={editEmp} departments={departments} onClose={()=>setEditEmp(null)} onSave={fetchAll}/>}

      <div className="sidebar">
        <div className="sidebar-logo"><h2>iSoftzone</h2><p>HRMS Platform</p></div>
        <div className="sidebar-nav">
          {navItems.map(n=>(
            <div key={n.key} className={`nav-item ${tab===n.key?"active":""}`} onClick={()=>setTab(n.key)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
        <div className="sidebar-user">
          <div className="avatar">{initials(user.name)}</div>
          <div className="info"><p>{user.name}</p><span>{user.role}</span></div>
          <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
        </div>
      </div>

      <div className="main">

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="stats-grid">
              <div className="stat-card stat-purple"><div className="stat-icon">👥</div><div className="stat-label">Total employees</div><div className="stat-value">{stats.totalEmployees||0}</div></div>
              <div className="stat-card stat-green"><div className="stat-icon">🏢</div><div className="stat-label">Departments</div><div className="stat-value">{stats.totalDepartments||0}</div></div>
              <div className="stat-card stat-amber"><div className="stat-icon">⏳</div><div className="stat-label">Pending leaves</div><div className="stat-value">{stats.pending||0}</div></div>
              <div className="stat-card stat-teal"><div className="stat-icon">✅</div><div className="stat-label">Approved leaves</div><div className="stat-value">{stats.approved||0}</div></div>
              <div className="stat-card stat-red"><div className="stat-icon">❌</div><div className="stat-label">Rejected leaves</div><div className="stat-value">{stats.rejected||0}</div></div>
              <div className="stat-card stat-purple"><div className="stat-icon">💻</div><div className="stat-label">Total assets</div><div className="stat-value">{assets.length}</div></div>
              <div className="stat-card stat-green"><div className="stat-icon">🕐</div><div className="stat-label">Present today</div><div className="stat-value">{todayAttendance.filter(a=>a.status==="Present").length}</div></div>
              <div className="stat-card stat-amber"><div className="stat-icon">💰</div><div className="stat-label">Salary expense</div><div className="stat-value" style={{fontSize:18}}>₹{Number(stats.totalSalary||0).toLocaleString("en-IN")}</div></div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div className="card">
                <div className="card-title">📊 Employees by Department</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptStats}>
                    <XAxis dataKey="department_name" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip/>
                    <Bar dataKey="total_employees" fill="#534AB7" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <div className="card-title">🥧 Leave Status Overview</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      {name:"Approved",value:Number(stats.approved||0)},
                      {name:"Pending",value:Number(stats.pending||0)},
                      {name:"Rejected",value:Number(stats.rejected||0)}
                    ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      <Cell fill="#0F6E56"/><Cell fill="#BA7517"/><Cell fill="#A32D2D"/>
                    </Pie>
                    <Tooltip/><Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div className="card">
                <div className="card-title">💰 Salary by Department</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptStats}>
                    <XAxis dataKey="department_name" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip formatter={(v)=>`₹${Number(v).toLocaleString("en-IN")}`}/>
                    <Bar dataKey="total_salary" fill="#1D9E75" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <div className="card-title">🕐 Today's Attendance Overview</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      {name:"Present",value:todayAttendance.filter(a=>a.status==="Present").length},
                      {name:"Late",value:todayAttendance.filter(a=>a.status==="Late").length},
                      {name:"Absent",value:todayAttendance.filter(a=>a.status==="Absent").length}
                    ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      <Cell fill="#0F6E56"/><Cell fill="#BA7517"/><Cell fill="#A32D2D"/>
                    </Pie>
                    <Tooltip/><Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div className="card">
                <div className="card-title">📅 Recent Leave Applications</div>
                {leaves.slice(0,5).map(l=>(
                  <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{l.employee_name}</div>
                      <div style={{fontSize:11,color:"#888"}}>{l.leave_name} · {l.total_days} days</div>
                    </div>
                    <span className={`pill ${l.status==="Approved"?"pill-green":l.status==="Rejected"?"pill-red":"pill-amber"}`}>{l.status}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">🕐 Today's Attendance</div>
                {todayAttendance.slice(0,5).map(a=>(
                  <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{a.employee_name}</div>
                      <div style={{fontSize:11,color:"#888"}}>In: {a.check_in?.slice(0,5)||"—"} · Out: {a.check_out?.slice(0,5)||"—"}</div>
                    </div>
                    <span className={`pill ${a.status==="Present"?"pill-green":a.status==="Late"?"pill-amber":"pill-red"}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EMPLOYEES ── */}
        {tab==="employees"&&(
          <div>
            <h1 className="page-title">Employees</h1>

            {/* Role info banner */}
            <div style={{background:"#EEEDFE",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#3C3489"}}>
              {isAdmin&&"👑 Admin — You can view, edit and delete all employees."}
              {isHR&&"👩‍💼 HR — You can view and edit employee details."}
              {isManager&&"👔 Manager — You can view all employees."}
              {isEmployee&&"👤 Employee — You can view the employee directory."}
            </div>

            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div className="card-title" style={{margin:0}}>👥 All employees — {filteredEmployees.length} total</div>
                <input placeholder="🔍 Search by name, email, department..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"8px 14px",border:"1px solid #e0e0e0",borderRadius:8,fontSize:13,width:300}}/>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Phone</th>
                    {(isAdmin||isHR)&&<th>Salary</th>}
                    <th>Role</th>
                    {canEditEmployee&&<th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp=>(
                    <tr key={emp.id}>
                      <td>
                        <div className="emp-cell">
                          {emp.profile_image?<img src={`http://localhost:5000/uploads/${emp.profile_image}`} alt={emp.name} style={{width:34,height:34,borderRadius:"50%",objectFit:"cover"}}/>:<div className="avatar">{initials(emp.name)}</div>}
                          <div><div style={{fontWeight:500}}>{emp.name}</div><div style={{fontSize:12,color:"#888"}}>{emp.email}</div></div>
                        </div>
                      </td>
                      <td>{emp.designation||"—"}</td>
                      <td><span className="pill pill-purple">{emp.department_name||"—"}</span></td>
                      <td>{emp.phone||"—"}</td>
                      {(isAdmin||isHR)&&<td>{emp.salary?`₹${Number(emp.salary).toLocaleString("en-IN")}`:"—"}</td>}
                      <td><span className={`pill ${emp.role==="admin"?"pill-red":emp.role==="hr"?"pill-green":emp.role==="manager"?"pill-amber":"pill-blue"}`}>{emp.role}</span></td>
                      {canEditEmployee&&(
                        <td>
                          <div className="actions-row">
                            <button className="btn btn-edit" onClick={()=>setEditEmp(emp)}>Edit</button>
                            {canDeleteEmployee&&<button className="btn btn-danger" onClick={()=>deleteEmployee(emp.id)}>Delete</button>}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        {tab==="attendance"&&(
          <div>
            <h1 className="page-title">Attendance</h1>
            <div className="card">
              <div className="card-title">🕐 My attendance</div>
              <button className="btn btn-primary" style={{marginBottom:16}} onClick={checkIn}>✅ Check In Now</button>
              <table>
                <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {attendance.map(a=>(
                    <tr key={a.id}>
                      <td>{a.date?.slice(0,10)}</td>
                      <td>{a.check_in?.slice(0,5)||"—"}</td>
                      <td>{a.check_out?.slice(0,5)||"—"}</td>
                      <td>{a.working_hours?`${Number(a.working_hours).toFixed(1)}h`:"—"}</td>
                      <td><span className={`pill ${a.status==="Present"?"pill-green":a.status==="Late"?"pill-amber":"pill-red"}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canViewAllAttendance&&(
              <div className="card">
                <div className="card-title">📋 Today's attendance — all employees</div>
                <table>
                  <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {todayAttendance.map(a=>(
                      <tr key={a.id}>
                        <td><strong>{a.employee_name}</strong></td>
                        <td>{a.check_in?.slice(0,5)||"—"}</td>
                        <td>{a.check_out?.slice(0,5)||"—"}</td>
                        <td>{a.working_hours?`${Number(a.working_hours).toFixed(1)}h`:"—"}</td>
                        <td><span className={`pill ${a.status==="Present"?"pill-green":a.status==="Late"?"pill-amber":"pill-red"}`}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── LEAVE ── */}
        {tab==="leave"&&(
          <div>
            <h1 className="page-title">Leave Management</h1>
            <div className="tabs">
              <button className={`tab ${leaveTab==="apply"?"active":""}`} onClick={()=>setLeaveTab("apply")}>Apply for leave</button>
              <button className={`tab ${leaveTab==="approvals"?"active":""}`} onClick={()=>setLeaveTab("approvals")}>All applications</button>
            </div>
            {leaveTab==="apply"&&(
              <div className="card">
                <div className="card-title">📝 New leave application</div>
                <form onSubmit={applyLeave}>
                  <div className="form-row">
                    <div className="form-group"><label>Employee</label>
                      <select onChange={e=>setLeaveForm({...leaveForm,employee_id:e.target.value})}>
                        <option value="">Select employee</option>
                        {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Leave type</label>
                      <select onChange={e=>setLeaveForm({...leaveForm,leave_type_id:e.target.value})}>
                        <option value="">Select type</option>
                        {leaveTypes.map(lt=><option key={lt.id} value={lt.id}>{lt.leave_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>From date</label><input type="date" onChange={e=>setLeaveForm({...leaveForm,from_date:e.target.value})}/></div>
                    <div className="form-group"><label>To date</label><input type="date" onChange={e=>setLeaveForm({...leaveForm,to_date:e.target.value})}/></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Total days</label><input type="number" onChange={e=>setLeaveForm({...leaveForm,total_days:e.target.value})}/></div>
                    <div className="form-group"><label>Reason</label><input onChange={e=>setLeaveForm({...leaveForm,reason:e.target.value})}/></div>
                  </div>
                  <button type="submit" className="btn btn-primary">Submit application</button>
                </form>
              </div>
            )}
            {leaveTab==="approvals"&&(
              <div className="card">
                <div className="card-title">📋 Leave applications</div>
                <table>
                  <thead><tr><th>Employee</th><th>Leave type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {leaves.map(l=>(
                      <tr key={l.id}>
                        <td><strong>{l.employee_name}</strong></td>
                        <td>{l.leave_name}</td>
                        <td>{l.from_date?.slice(0,10)}</td>
                        <td>{l.to_date?.slice(0,10)}</td>
                        <td>{l.total_days}</td>
                        <td>{l.reason}</td>
                        <td><span className={`pill ${l.status==="Approved"?"pill-green":l.status==="Rejected"?"pill-red":"pill-amber"}`}>{l.status}</span></td>
                        <td>{l.status==="Pending"&&canApproveLeave&&(
                          <div className="actions-row">
                            <button className="btn btn-success" onClick={()=>handleLeaveAction(l.id,"Approved")}>Approve</button>
                            <button className="btn btn-danger" onClick={()=>handleLeaveAction(l.id,"Rejected")}>Reject</button>
                          </div>
                        )}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ASSETS ── */}
        {tab==="assets"&&(
          <div>
            <h1 className="page-title">Asset Management</h1>

            {canAllocateAsset&&(
              <div className="card">
                <div className="card-title">🖥️ Allocate asset</div>
                <form onSubmit={allocateAsset}>
                  <div className="form-row">
                    <div className="form-group"><label>Asset</label>
                      <select onChange={e=>setAssetForm({...assetForm,asset_id:e.target.value})}>
                        <option value="">Select asset</option>
                        {assets.filter(a=>a.status==="Available").map(a=><option key={a.id} value={a.id}>{a.asset_name} ({a.asset_type})</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Employee</label>
                      <select onChange={e=>setAssetForm({...assetForm,employee_id:e.target.value})}>
                        <option value="">Select employee</option>
                        {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">Allocate asset</button>
                </form>
              </div>
            )}

            <div className="card">
              <div className="card-title">📋 All assets</div>
              <table>
                <thead><tr><th>Asset</th><th>Type</th><th>Serial No</th><th>Status</th></tr></thead>
                <tbody>
                  {assets.map(a=>(
                    <tr key={a.id}>
                      <td>{a.asset_name}</td><td>{a.asset_type}</td><td>{a.serial_number}</td>
                      <td><span className={`pill ${a.status==="Available"?"pill-green":"pill-amber"}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-title">📦 Asset allocations</div>
              <table>
                <thead><tr><th>Asset</th><th>Type</th><th>Employee</th><th>Date</th><th>Status</th>{canAllocateAsset&&<th>Actions</th>}</tr></thead>
                <tbody>
                  {allocations.map(a=>(
                    <tr key={a.id}>
                      <td>{a.asset_name}</td><td>{a.asset_type}</td><td>{a.employee_name}</td>
                      <td>{a.allocated_date?.slice(0,10)}</td>
                      <td><span className={`pill ${a.status==="Allocated"?"pill-amber":"pill-green"}`}>{a.status}</span></td>
                      {canAllocateAsset&&<td>{a.status==="Allocated"&&<button className="btn btn-success" onClick={()=>returnAsset(a.id)}>Return</button>}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REPORTS (Admin + HR only) ── */}
        {tab==="reports"&&canViewReports&&(
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <div className="card">
              <div className="card-title">🏢 Department report</div>
              <table>
                <thead><tr><th>Department</th><th>Employees</th><th>Avg Salary</th><th>Total Salary</th></tr></thead>
                <tbody>
                  {deptStats.map((d,i)=>(
                    <tr key={i}>
                      <td><span className="pill pill-purple">{d.department_name}</span></td>
                      <td>{d.total_employees}</td>
                      <td>₹{Number(d.avg_salary||0).toFixed(0)}</td>
                      <td>₹{Number(d.total_salary||0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="card-title">📅 Leave report</div>
              <table>
                <thead><tr><th>Employee</th><th>Leave type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
                <tbody>
                  {leaveReport.map((l,i)=>(
                    <tr key={i}>
                      <td>{l.employee_name}</td><td>{l.leave_name}</td>
                      <td>{l.from_date?.slice(0,10)}</td><td>{l.to_date?.slice(0,10)}</td>
                      <td>{l.total_days}</td>
                      <td><span className={`pill ${l.status==="Approved"?"pill-green":l.status==="Rejected"?"pill-red":"pill-amber"}`}>{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab==="notifications"&&(
          <div>
            <h1 className="page-title">Notifications</h1>
            <div className="card">
              {notifications.length===0
                ?<p style={{color:"#888",fontSize:14}}>No notifications yet.</p>
                :notifications.map(n=>(
                  <div key={n.id} style={{padding:"12px 0",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:20}}>🔔</span>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,color:n.is_read?"#888":"#1a1a1a",fontWeight:n.is_read?400:500}}>{n.message}</p>
                      <p style={{fontSize:12,color:"#aaa",marginTop:4}}>{n.created_at?.slice(0,16)}</p>
                    </div>
                    {!n.is_read&&<button className="btn btn-success" onClick={()=>axios.put(`${API}/notifications/read/${n.id}`).then(()=>axios.get(`${API}/notifications/${user.id}`).then(r=>setNotifications(r.data)))}>Mark read</button>}
                  </div>
                ))
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
}