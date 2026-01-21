import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/dashboard");
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

      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Giriş Yap</h2>
      <p className="text-sm text-gray-600 text-center mb-6">
        Hesabınla giriş yap ve panele devam et.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600 text-center">
        Hesabın yok mu?{" "}
        <Link className="font-semibold text-indigo-600 hover:text-indigo-700 transition" to="/register">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
