import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employee.js";
import leaveRoutes from "./routes/leave.js";
import assetRoutes from "./routes/assets.js";
import notificationRoutes from "./routes/notifications.js";
import reportRoutes from "./routes/reports.js";
import attendanceRoutes from "./routes/attendance.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "iSoftzone HRMS API is running" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});