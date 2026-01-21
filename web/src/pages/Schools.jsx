import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, X } from "lucide-react";

export default function Schools() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const token = localStorage.getItem("accessToken");
    const navigate = useNavigate(); // 👈 yönlendirme için

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

    // 🔹 Okulları getir
    const fetchSchools = async () => {
        try {
            const res = await axios.get("http://localhost:5000/schools", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSchools(res.data.data || []);
        } catch (err) {
            console.error("Okullar yüklenirken hata:", err);
            setError("Okullar yüklenemedi ❌");
        } finally {
            setLoading(false);
        }
    };

    // Manager için okul detayına erişim kontrolü
    const handleSchoolClick = (school) => {
        if (userRole === "manager" && !school.isMySchool) {
            alert("Sadece kendi okulunuzun detaylarına erişebilirsiniz.");
            return;
        }
        navigate(`/schools/${school.id}`);
    };

    // 🔹 Yeni okul ekle
    const handleAddSchool = async (e) => {
        e.preventDefault();
        if (!newSchoolName.trim()) return;

        try {
            await axios.post(
                "http://localhost:5000/schools",
                { name: newSchoolName },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setShowModal(false);
            setNewSchoolName("");
            setSuccessMsg("✅ Okul başarıyla eklendi!");
            fetchSchools();
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error("Okul eklenirken hata:", err);
            setError("❌ Okul eklenemedi, tekrar deneyin.");
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Yükleniyor...
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Başlık */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        🏫 Okullar
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Okulların listesini görüntüle, yeni okul ekle veya düzenle.
                    </p>
                </div>

                {/* Ekle Butonu - Sadece admin görebilir */}
                {userRole === "admin" && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        <span>Okul Ekle</span>
                    </button>
                )}
            </div>

            {/* Başarı Mesajı */}
            {successMsg && (
                <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded-lg mb-6 text-center">
                    {successMsg}
                </div>
            )}

            {/* Hata Mesajı */}
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-6 text-center">
                    {error}
                </div>
            )}

            {/* Okul Listesi */}
            {schools.length === 0 ? (
                <p className="text-center text-gray-600">
                    Henüz kayıtlı okul yok
                </p>
            ) : (
                <>
                    {userRole === "manager" && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6">
                            <p className="text-sm">
                                💡 <strong>Bilgi:</strong> Tüm okulları görebilirsiniz, ancak sadece kendi okulunuzun detaylarına erişebilirsiniz.
                            </p>
                        </div>
                    )}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {schools.map((school) => {
                            const isMySchool = userRole === "manager" && school.isMySchool;
                            const canViewDetails = userRole === "admin" || isMySchool || (userRole !== "manager");
                            
                            return (
                                <div
                                    key={school.id}
                                    onClick={() => handleSchoolClick(school)}
                                    className={`bg-white p-6 rounded-2xl shadow hover:shadow-lg transition ${
                                        canViewDetails ? "cursor-pointer hover:bg-indigo-50" : "cursor-not-allowed opacity-75"
                                    } ${isMySchool ? "ring-2 ring-indigo-500" : ""}`}
                                >
                                    {isMySchool && (
                                        <div className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded mb-2 inline-block">
                                            Kendi Okulum
                                        </div>
                                    )}
                                    <h2 className="text-2xl font-semibold text-indigo-700 mb-3">
                                        {school.name}
                                    </h2>

                                    <p className="text-gray-600 mb-2">
                                        <strong>Öğrenci Sayısı:</strong>{" "}
                                        {school.students?.length || school.students || 0}
                                    </p>
                                    <p className="text-gray-600 mb-2">
                                        <strong>Öğretmen Sayısı:</strong>{" "}
                                        {school.teachers?.length || school.teachers || 0}
                                    </p>
                                    <p className="text-gray-600">
                                        <strong>Yönetici:</strong>{" "}
                                        {school.manager?.name || "Atanmamış"}
                                    </p>
                                    {!canViewDetails && (
                                        <p className="text-red-500 text-sm mt-2">
                                            ⚠️ Detaylara erişim yetkiniz yok
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* 🎯 Modal (Popup) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md relative animate-fadeIn">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-indigo-700 mb-4">
                            🏫 Yeni Okul Ekle
                        </h2>

                        <form onSubmit={handleAddSchool}>
                            <input
                                type="text"
                                placeholder="Okul adı giriniz..."
                                value={newSchoolName}
                                onChange={(e) => setNewSchoolName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                            <div className="flex justify-end mt-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
