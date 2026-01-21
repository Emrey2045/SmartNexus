import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function StudentReportSend() {
    const [role, setRole] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        studentId: "",
        title: "",
        content: "",
    });

    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setRole(payload.role);
            } catch (e) {
                console.error("Token çözümleme hatası:", e);
            }
        }
    }, [token]);

    const canSend = useMemo(() => role === "teacher" || role === "manager", [role]);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await axios.get("http://localhost:5000/students", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // responseHelper: { success, data, message }
                setStudents(res.data?.data || []);
            } catch (err) {
                setError(err.response?.data?.message || "Öğrenciler alınamadı");
            } finally {
                setLoading(false);
            }
        };

        if (token && canSend) fetchStudents();
        else setLoading(false);
    }, [token, canSend]);

    const handleChange = (e) => {
        setSuccess("");
        setError("");
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.studentId || !form.title || !form.content) {
            setError("Öğrenci, başlık ve içerik zorunludur.");
            return;
        }

        setSaving(true);
        try {
            await axios.post(
                "http://localhost:5000/student-reports",
                {
                    studentId: Number(form.studentId),
                    title: form.title,
                    content: form.content,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess("Rapor başarıyla gönderildi ✅");
            setForm({ studentId: "", title: "", content: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Rapor gönderilemedi");
        } finally {
            setSaving(false);
        }
    };

    if (!canSend) {
        return (
            <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800">Öğrenci Raporu Gönder</h2>
                <p className="mt-2 text-gray-600">Bu sayfaya yalnızca öğretmen ve müdür erişebilir.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-indigo-700 mb-1">Öğrenci Raporu Gönder</h2>
            <p className="text-gray-600 mb-6">
                Seçtiğiniz öğrenci için yazılı rapor oluşturup gönderebilirsiniz.
            </p>

            {loading ? (
                <p className="text-gray-600">Yükleniyor...</p>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">
                            {success}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
                        <select
                            name="studentId"
                            value={form.studentId}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">Öğrenci seçin</option>
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} {s.grade ? `(${s.grade})` : ""}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Öğretmen sadece kendi sınıfındaki öğrencileri görür.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Örn: 1. Dönem Davranış Değerlendirmesi"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2 min-h-[160px]"
                            placeholder="Rapor içeriğini yazın..."
                        />
                    </div>

                    <button
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded disabled:opacity-60"
                        type="submit"
                    >
                        {saving ? "Gönderiliyor..." : "Raporu Gönder"}
                    </button>
                </form>
            )}
        </div>
    );
}
