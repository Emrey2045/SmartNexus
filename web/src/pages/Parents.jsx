import { useEffect, useState } from "react";
import axios from "axios";

export default function Parents() {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState(null);
    const [newParent, setNewParent] = useState({
        name: "",
        email: "",
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

    const fetchParents = async () => {
        try {
            const res = await axios.get("http://localhost:5000/parents", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setParents(res.data.data || []);
        } catch (err) {
            console.error("Veliler yüklenirken hata:", err);
            setError("Veliler yüklenemedi ❌");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newParent.name) return;
        try {
            await axios.post("http://localhost:5000/parents", newParent, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNewParent({ name: "", email: "" });
            fetchParents();
        } catch (err) {
            console.error("Ekleme hatası:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu veliyi silmek istiyor musun?")) return;
        try {
            await axios.delete(`http://localhost:5000/parents/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchParents();
        } catch (err) {
            console.error("Silme hatası:", err);
        }
    };

    useEffect(() => {
        fetchParents();
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

    // Veli ekleme yetkisi kontrolü
    const canAddParent = ["teacher", "manager", "admin"].includes(userRole);
    // Veli silme yetkisi kontrolü (ekleme yetkisi olanlar silebilir)
    const canDeleteParent = canAddParent;

    // Role göre bilgilendirme mesajı
    const getRoleInfo = () => {
        if (userRole === "teacher") {
            return "Sadece kendi sınıfınızın öğrencilerinin velilerini görebilirsiniz.";
        } else if (userRole === "manager") {
            return "Sadece kendi okulunuzun öğrencilerinin velilerini görebilirsiniz.";
        } else if (userRole === "parent") {
            return "Sadece kendi bilgilerinizi görebilirsiniz.";
        }
        return null;
    };

    const roleInfo = getRoleInfo();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">👩‍👧 Veliler</h1>
            
            {roleInfo && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6 max-w-4xl mx-auto">
                    <p className="text-sm">💡 <strong>Bilgi:</strong> {roleInfo}</p>
                </div>
            )}

            {/* Veli ekleme formu - Sadece teacher, manager ve admin görebilir */}
            {canAddParent && (
                <form
                    onSubmit={handleAdd}
                    className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-6 mb-8"
                >
                <div className="grid md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="İsim"
                        value={newParent.name}
                        onChange={(e) =>
                            setNewParent({ ...newParent, name: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    <input
                        type="email"
                        placeholder="E-posta"
                        value={newParent.email}
                        onChange={(e) =>
                            setNewParent({ ...newParent, email: e.target.value })
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

            {parents.length === 0 ? (
                <p className="text-center text-gray-600">Henüz veli yok</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parents.map((parent) => (
                        <div
                            key={parent.id}
                            className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition relative"
                        >
                            <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                                {parent.name}
                            </h2>
                            <p className="text-gray-600">
                                <strong>E-posta:</strong> {parent.email || "—"}
                            </p>
                            <p className="text-gray-600">
                                <strong>Öğrenci Sayısı:</strong>{" "}
                                {parent.students ? parent.students.length : 0}
                            </p>
                            {canDeleteParent && (
                                <button
                                    onClick={() => handleDelete(parent.id)}
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
