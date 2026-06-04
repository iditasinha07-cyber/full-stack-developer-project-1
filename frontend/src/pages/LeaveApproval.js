import { useEffect, useState } from "react";
import axios from "axios";

function LeaveApproval() {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/leave")
      .then(res => setLeaves(res.data));
  }, []);

  const handleAction = async (id, action) => {
    await axios.put(`http://localhost:5000/api/leave/approve/${id}`, {
      action,
      remarks: action === "Approved" ? "Looks good" : "Not approved",
      approved_by: 1
    });
    alert(`Leave ${action}`);
    window.location.reload();
  };

  return (
    <div>
      <h2>Leave Approvals</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Employee</th><th>Leave Type</th><th>From</th>
            <th>To</th><th>Days</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map(l => (
            <tr key={l.id}>
              <td>{l.employee_name}</td>
              <td>{l.leave_name}</td>
              <td>{l.from_date}</td>
              <td>{l.to_date}</td>
              <td>{l.total_days}</td>
              <td>{l.status}</td>
              <td>
                {l.status === "Pending" && (
                  <>
                    <button onClick={() => handleAction(l.id, "Approved")}>✅ Approve</button>
                    <button onClick={() => handleAction(l.id, "Rejected")}>❌ Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeaveApproval;
