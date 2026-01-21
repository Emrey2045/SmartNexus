import { useEffect, useState } from "react";
import axios from "axios";

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState(null);
    const [newStudent, setNewStudent] = useState({
        name: "",
        grade: "",
        schoolId: "",
    });

    const token = localStorage.getItem("accessToken");

    // Role kontrolü
    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setUserRole(payload.role);
            } catch (e) {
                console.error("Token çözümleme hatası:", e);
            }
        }
    }, [token]);

    const fetchStudents = async () => {
        try {
            const res = await axios.get("http://localhost:5000/students", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudents(res.data.data || []);
        } catch (err) {
            console.error("Öğrenciler yüklenirken hata:", err);
            setError("Öğrenciler yüklenemedi ❌");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newStudent.name || !newStudent.grade) return;
        try {
            await axios.post("http://localhost:5000/students", newStudent, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNewStudent({ name: "", grade: "", schoolId: "" });
            fetchStudents();
        } catch (err) {
            console.error("Ekleme hatası:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu öğrenciyi silmek istiyor musun?")) return;
        try {
            await axios.delete(`http://localhost:5000/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchStudents();
        } catch (err) {
            console.error("Silme hatası:", err);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Yükleniyor...
            </div>
        );

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                {error}
            </div>
        );

    // Öğrenci ekleme yetkisi kontrolü
    const canAddStudent = ["teacher", "manager", "admin"].includes(userRole);
    // Öğrenci silme yetkisi kontrolü (ekleme yetkisi olanlar silebilir)
    const canDeleteStudent = canAddStudent;

    // Role göre bilgilendirme mesajı
    const getRoleInfo = () => {
        if (userRole === "teacher") {
            return "Sadece kendi sınıfınızın öğrencilerini görebilirsiniz.";
        } else if (userRole === "manager") {
            return "Sadece kendi okulunuzun öğrencilerini görebilirsiniz.";
        } else if (userRole === "student") {
            return "Sadece kendi bilgilerinizi görebilirsiniz.";
        } else if (userRole === "parent") {
            return "Sadece kendi çocuklarınızın bilgilerini görebilirsiniz.";
        }
        return null;
    };

    const roleInfo = getRoleInfo();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">🎓 Öğrenciler</h1>
            
            {roleInfo && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6 max-w-4xl mx-auto">
                    <p className="text-sm">💡 <strong>Bilgi:</strong> {roleInfo}</p>
                </div>
            )}

            {/* Yeni öğrenci ekleme formu - Sadece teacher, manager ve admin görebilir */}
            {canAddStudent && (
                <form
                    onSubmit={handleAdd}
                    className="max-w-xl mx-auto bg-white shadow-md rounded-xl p-6 mb-8"
                >
                <div className="grid md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="İsim"
                        value={newStudent.name}
                        onChange={(e) =>
                            setNewStudent({ ...newStudent, name: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Sınıf (örn: 7A)"
                        value={newStudent.grade}
                        onChange={(e) =>
                            setNewStudent({ ...newStudent, grade: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Okul ID"
                        value={newStudent.schoolId}
                        onChange={(e) =>
                            setNewStudent({ ...newStudent, schoolId: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                </div>
                <button
                    type="submit"
                    className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all"
                >
                    Ekle
                </button>
            </form>
            )}

            {/* Liste */}
            {students.length === 0 ? (
                <p className="text-center text-gray-600">Henüz öğrenci yok</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <div
                            key={student.id}
                            className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition relative"
                        >
                            <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                                {student.name}
                            </h2>
                            <p className="text-gray-600">
                                <strong>Sınıf:</strong> {student.grade}
                            </p>
                            <p className="text-gray-600">
                                <strong>Okul ID:</strong> {student.schoolId}
                            </p>
                            {canDeleteStudent && (
                                <button
                                    onClick={() => handleDelete(student.id)}
                                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                    ✖
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
