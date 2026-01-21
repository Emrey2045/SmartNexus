import { useEffect, useState } from "react";
import axios from "axios";
import { GraduationCap, Plus, X, Users } from "lucide-react";
import { toast } from "react-toastify";

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [adding, setAdding] = useState(false);

    const token = localStorage.getItem("accessToken");

    // Sınıfları getir
    const fetchClasses = async () => {
        try {
            const res = await axios.get("http://localhost:5000/teacher-classes", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClasses(res.data.data || []);
        } catch (err) {
            console.error("Sınıflar yüklenirken hata:", err);
            setError("Sınıflar yüklenemedi ❌");
        } finally {
            setLoading(false);
        }
    };

    // Sınıf ekle
    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) {
            toast.error("Sınıf adı zorunludur");
            return;
        }

        setAdding(true);
        try {
            await axios.post(
                "http://localhost:5000/teacher-classes",
                { className: newClassName },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Sınıf başarıyla eklendi");
            setShowAddModal(false);
            setNewClassName("");
            fetchClasses();
        } catch (err) {
            console.error("Sınıf eklenirken hata:", err);
            toast.error("Sınıf eklenemedi: " + (err.response?.data?.message || "Bilinmeyen hata"));
        } finally {
            setAdding(false);
        }
    };

    // Sınıf sil
    const handleDeleteClass = async (id, className) => {
        if (!window.confirm(`${className} sınıfını silmek istediğinize emin misiniz?`)) return;

        try {
            await axios.delete(`http://localhost:5000/teacher-classes/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Sınıf başarıyla silindi");
            fetchClasses();
        } catch (err) {
            console.error("Sınıf silinirken hata:", err);
            toast.error("Sınıf silinemedi: " + (err.response?.data?.message || "Bilinmeyen hata"));
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Başlık */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                        <GraduationCap size={32} className="text-indigo-600" />
                        Sınıflarım
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Yönettiğiniz sınıfları görüntüleyin ve yönetin
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
                >
                    <Plus size={18} />
                    Sınıf Ekle
                </button>
            </div>

            {/* Bilgilendirme */}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg mb-6">
                <p className="text-sm">
                    💡 <strong>Bilgi:</strong> Birden fazla sınıf yönetebilirsiniz. Her sınıf için ayrı rapor gönderebilir ve öğrencileri takip edebilirsiniz.
                </p>
            </div>

            {/* Sınıf Listesi */}
            {classes.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-8 text-center">
                    <GraduationCap size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">
                        Henüz sınıf eklenmemiş.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        İlk Sınıfınızı Ekleyin
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div
                            key={cls.id}
                            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100 relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full">
                                    <GraduationCap size={24} />
                                </div>
                                <button
                                    onClick={() => handleDeleteClass(cls.id, cls.className)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-indigo-700 mb-2">
                                {cls.className}
                            </h2>

                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <strong>Okul:</strong> {cls.school?.name || "—"}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users size={16} />
                                    <strong>Öğrenci Sayısı:</strong> {cls.studentCount || 0}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sınıf Ekleme Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
                        <button
                            onClick={() => {
                                setShowAddModal(false);
                                setNewClassName("");
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                                <Plus size={24} />
                                Yeni Sınıf Ekle
                            </h2>

                            <form onSubmit={handleAddClass} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Sınıf Adı
                                    </label>
                                    <input
                                        type="text"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        placeholder="Örn: 7A, 8B, 9C"
                                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Sınıf adını girin (örn: 7A, 8B, 9C)
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setNewClassName("");
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adding}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                        {adding ? "Ekleniyor..." : "Sınıf Ekle"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

