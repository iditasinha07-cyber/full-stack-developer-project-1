import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/EmployeeList";
import AddEmployee from "./pages/AddEmployee";
import LeaveApply from "./pages/LeaveApply";
import LeaveApproval from "./pages/LeaveApproval";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Full Stack HRMS System</h1>
      <Dashboard />
      <hr />
      <AddEmployee />
      <hr />
      <EmployeeList />
      <hr />
      <LeaveApply />
      <hr />
      <LeaveApproval />
      <hr />
      <Signup />
      <hr />
      <Login />
    </div>
  );
}

export default App;