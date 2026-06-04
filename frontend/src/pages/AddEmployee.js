import { useState, useEffect } from "react";
import axios from "axios";

function AddEmployee() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", department_id: "" });
  const [departments, setDepartments] = useState([]);
  const [image, setImage] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/employees/departments/all")
      .then(res => setDepartments(res.data));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("department_id", form.department_id);
    if (image) formData.append("profile_image", image);

    await axios.post("http://localhost:5000/api/employees", formData);
    alert("Employee Added!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Employee</h2>
      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="phone" placeholder="Phone" onChange={handleChange} />
      <select name="department_id" onChange={handleChange}>
        <option value="">Select Department</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <button type="submit">Add Employee</button>
    </form>
  );
}

export default AddEmployee;