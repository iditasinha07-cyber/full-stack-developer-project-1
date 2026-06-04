import { useEffect, useState } from "react";
import axios from "axios";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/employees")
      .then(res => setEmployees(res.data));
  }, []);

  const deleteEmployee = async (id) => {
    await axios.delete(`http://localhost:5000/api/employees/${id}`);
    setEmployees(employees.filter(e => e.id !== id));
  };

  return (
    <div>
      <h2>Employees</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.phone}</td>
              <td>{emp.department_name}</td>
              <td>
                <button onClick={() => deleteEmployee(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeList;