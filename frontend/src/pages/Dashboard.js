import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    axios.get("http://localhost:5000/api/employees/dashboard/stats")
      .then(res => setStats(res.data));
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Total Employees: {stats.totalEmployees}</p>
      <p>Total Departments: {stats.totalDepartments}</p>
    </div>
  );
}

export default Dashboard;
