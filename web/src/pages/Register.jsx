import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [adminPassword, setAdminPassword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Admin için özel şifre kontrolü
    if (role === "admin" && adminPassword !== "admin123") {
      toast.error("Admin kaydı için özel şifre yanlış!");
      return;
    }
    
        // Müdür için okulId kontrolü
    if (role === "manager" && !schoolId) {
      toast.error("Müdür kaydı için Okul ID zorunludur!");
      return;
    }

setLoading(true);
    const ok = await register(name, email, password, role, adminPassword, schoolId, grade);
    setLoading(false);
    if (ok) navigate("/login");
  };

  return (
    <div>
      {/* Animated Logo */}
      <div className="flex justify-center mb-6">
        <div className="text-center relative">
          <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-pulse">
            SmartNexus
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mx-auto rounded-full animate-pulse"></div>
          {/* Floating particles around logo */}
          <div className="absolute -top-2 -left-2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute -top-1 -right-3 w-2 h-2 bg-purple-400 rounded-full animate-bounce opacity-60 animation-delay-300"></div>
          <div className="absolute -bottom-1 left-0 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-60 animation-delay-600"></div>
          <div className="absolute -bottom-1 right-0 w-2 h-2 bg-indigo-400 rounded-full animate-bounce opacity-60 animation-delay-900"></div>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-900 {
          animation-delay: 0.9s;
        }
      `}</style>

      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Kayıt Ol</h2>
      <p className="text-sm text-gray-600 text-center mb-6">
        Yeni hesap oluştur ve panele giriş yap.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Emre Yılmaz"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="emre@example.com"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Şifre</label>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Rol</label>
          <select
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setAdminPassword(""); // Rol değişince admin şifresini temizle
              // Rol değişince öğrenci alanlarını temizle
              setSchoolId("");
              setGrade("");
            }}
          >
            <option value="student">Öğrenci</option>
            <option value="teacher">Öğretmen</option>
            <option value="manager">Müdür</option>
            <option value="parent">Veli</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Öğrenci için okulId ve sınıf bilgisi */}
        {(role === "student" || role === "manager") && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Okul ID <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                type="number"
                min="1"
                placeholder="1"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Müdür veya öğrencinin bağlı olacağı okulun ID bilgisini giriniz.
              </p>
            </div>

            {role === "student" && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Sınıf (Grade) <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                type="text"
                placeholder="5-A"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Örn: 5-A, 8-B, 11-C
              </p>
            </div>
          )}

                      </div>
        )}

        {/* Admin için özel şifre alanı */}
        {role === "admin" && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              Admin Özel Şifre <span className="text-red-500">*</span>
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              type="password"
              placeholder="Admin özel şifresini giriniz"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Admin kaydı için özel şifre gereklidir.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600 text-center">
        Zaten hesabın var mı?{" "}
        <Link className="font-semibold text-indigo-600 hover:text-indigo-700 transition" to="/login">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
