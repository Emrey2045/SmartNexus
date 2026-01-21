import { createContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import API from "../api/axiosInstance.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const isAuthenticated = !!accessToken;

  // İstersen /auth/me ile user çekebilirsin. Şimdilik token varsa auth kabul.
  useEffect(() => {
    // Token varsa user bilgisini çekmek istersen aç:
    // if (accessToken) fetchMe();
  }, [accessToken]);

  const login = async (email, password) => {
    try {
      const res = await API.post("/auth/login", { email, password });
      const { accessToken, refreshToken, user } = res.data.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setUser(user);

      toast.success("Giriş başarılı");
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Giriş başarısız";
      toast.error(msg);
      return false;
    }
  };

  // Öğrenci rolünde kayıt olurken okulId ve sınıf(grade) bilgileri de alınır.
  const register = async (
    name,
    email,
    password,
    role = "student",
    adminPassword = "",
    schoolId = "",
    grade = ""
  ) => {
    try {
      const payload = { name, email, password, role, adminPassword };
      if (role === "student" || role === "manager") {
        payload.schoolId = schoolId;
      }
      if (role === "student") {
        payload.grade = grade;
      }

      const res = await API.post("/auth/register", payload);
      toast.success(res.data.message || "Kayıt başarılı");
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Kayıt başarısız";
      toast.error(msg);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    toast.info("Çıkış yapıldı");
    window.location.href = "/login";
  };

  const value = useMemo(
    () => ({ user, setUser, isAuthenticated, login, register, logout }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
