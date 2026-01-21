import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Schools from "./pages/Schools.jsx";
import SchoolDetail from "./pages/SchoolDetail.jsx";
import Teachers from "./pages/Teachers.jsx";
import Students from "./pages/Students.jsx";
import StudentDetail from "./pages/StudentDetail.jsx";
import Parents from "./pages/Parents.jsx";
import Reports from "./pages/Reports.jsx";
import StudentReportSend from "./pages/StudentReportSend.jsx";
import Chat from "./pages/Chat.jsx";
import Classes from "./pages/Classes.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public (themed) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schools" element={<Schools />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/parents" element={<Parents />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/student-reports/new" element={<StudentReportSend />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/schools/:id" element={<SchoolDetail />} />
            <Route path="/students/:id" element={<StudentDetail />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
