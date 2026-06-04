import { useState, useEffect } from "react";
import axios from "axios";

function LeaveApply() {
  const [form, setForm] = useState({
    employee_id: "", leave_type_id: "",
    from_date: "", to_date: "", total_days: "", reason: ""
  });
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/leave/types")
      .then(res => setLeaveTypes(res.data));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/leave/apply", form);
    alert("Leave Applied!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Apply for Leave</h2>
      <input name="employee_id" placeholder="Employee ID" onChange={handleChange} />
      <select name="leave_type_id" onChange={handleChange}>
        <option value="">Select Leave Type</option>
        {leaveTypes.map(lt => (
          <option key={lt.id} value={lt.id}>{lt.leave_name}</option>
        ))}
      </select>
      <input type="date" name="from_date" onChange={handleChange} />
      <input type="date" name="to_date" onChange={handleChange} />
      <input name="total_days" placeholder="Total Days" onChange={handleChange} />
      <input name="reason" placeholder="Reason" onChange={handleChange} />
      <button type="submit">Apply Leave</button>
    </form>
  );
}

export default LeaveApply;