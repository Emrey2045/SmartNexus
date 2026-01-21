import { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import {
    TrendingUp,
    Users,
    GraduationCap,
    School,
    Award,
    FileText,
    Send,
    X,
} from "lucide-react";
import { toast } from "react-toastify";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function Reports() {
    const [stats, setStats] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportTitle, setReportTitle] = useState("");
    const [reportContent, setReportContent] = useState("");
    const [reportClassName, setReportClassName] = useState("");
    const [sendingReport, setSendingReport] = useState(false);
    const [reports, setReports] = useState([]);
    const [showReportsList, setShowReportsList] = useState(false);
    const [teacherClasses, setTeacherClasses] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setRole(payload.role);

            // Role göre endpoint seç
            let endpoint = "";
            if (payload.role === "admin") {
                endpoint = "http://localhost:5000/dashboard/overview";
            } else if (payload.role === "manager") {
                endpoint = "http://localhost:5000/dashboard/school-stats";
            } else if (payload.role === "teacher") {
                endpoint = "http://localhost:5000/dashboard/class-stats";
            } else {
                setLoading(false);
                setError("Bu sayfaya erişim yetkiniz yok");
                return;
            }

            axios
                .get(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    setStats(res.data.data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Raporlar yüklenirken hata:", err);
                    setError("Raporlar yüklenemedi");
                    setLoading(false);
                });

            // Raporları yükle
            fetchReports();
            
            // Öğretmen ise sınıflarını yükle
            if (payload.role === "teacher") {
                fetchTeacherClasses();
            }
        } catch (e) {
            console.error("Token çözümleme hatası:", e);
            setLoading(false);
            setError("Token hatası");
        }
    }, []);

    // Raporları getir
    const fetchReports = async () => {
        const token = localStorage.getItem("accessToken");
        try {
            const res = await axios.get("http://localhost:5000/reports", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReports(res.data.data || []);
        } catch (err) {
            console.error("Raporlar listelenirken hata:", err);
        }
    };

    // Öğretmen sınıflarını getir
    const fetchTeacherClasses = async () => {
        const token = localStorage.getItem("accessToken");
        try {
            const res = await axios.get("http://localhost:5000/teacher-classes", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTeacherClasses(res.data.data || []);
            // İlk sınıfı varsayılan olarak seç
            if (res.data.data && res.data.data.length > 0) {
                setReportClassName(res.data.data[0].className);
            }
        } catch (err) {
            console.error("Sınıflar yüklenirken hata:", err);
        }
    };

    // Rapor gönder
    const handleSendReport = async (e) => {
        e.preventDefault();
        if (!reportTitle.trim() || !reportContent.trim()) {
            toast.error("Başlık ve içerik zorunludur");
            return;
        }

        if (role === "teacher" && !reportClassName) {
            toast.error("Lütfen bir sınıf seçin");
            return;
        }

        setSendingReport(true);
        const token = localStorage.getItem("accessToken");
        try {
            await axios.post(
                "http://localhost:5000/reports",
                {
                    title: reportTitle,
                    content: reportContent,
                    className: reportClassName || undefined,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Rapor başarıyla gönderildi");
            setShowReportModal(false);
            setReportTitle("");
            setReportContent("");
            setReportClassName(teacherClasses.length > 0 ? teacherClasses[0].className : "");
            fetchReports();
        } catch (err) {
            console.error("Rapor gönderilirken hata:", err);
            toast.error("Rapor gönderilemedi: " + (err.response?.data?.message || "Bilinmeyen hata"));
        } finally {
            setSendingReport(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p>Raporlar yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                <div className="text-center">
                    <p className="text-xl font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                <p>Veri bulunamadı</p>
            </div>
        );
    }

    // Grafik verileri hazırla
    const distributionData =
        role === "admin"
            ? [
                  { name: "Okullar", value: stats.totalSchools || 0 },
                  { name: "Öğretmenler", value: stats.totalTeachers || 0 },
                  { name: "Öğrenciler", value: stats.totalStudents || 0 },
                  { name: "Veliler", value: stats.totalParents || 0 },
              ]
            : role === "teacher"
            ? [
                  { name: "Öğrenciler", value: stats.students || 0 },
                  { name: "Veliler", value: stats.parents || 0 },
              ]
            : [
                  { name: "Öğretmenler", value: stats.teachers || 0 },
                  { name: "Öğrenciler", value: stats.students || 0 },
                  { name: "Veliler", value: stats.parents || 0 },
              ];

    // Örnek aylık veri
    const monthlyData = [
        { month: "Ocak", students: 120, teachers: 15 },
        { month: "Şubat", students: 135, teachers: 16 },
        { month: "Mart", students: 150, teachers: 17 },
        { month: "Nisan", students: 145, teachers: 18 },
        { month: "Mayıs", students: 160, teachers: 18 },
        { month: "Haziran", students: 155, teachers: 19 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Başlık */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                        <BarChart size={32} className="text-indigo-600" />
                        Raporlar ve İstatistikler
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Sistem genelinde detaylı raporlar ve analizler
                    </p>
                </div>
                <div className="flex gap-3">
                    {role === "teacher" && (
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-lg"
                        >
                            <FileText size={18} />
                            Rapor Gönder
                        </button>
                    )}
                    <button
                        onClick={() => setShowReportsList(!showReportsList)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-lg"
                    >
                        <FileText size={18} />
                        {showReportsList ? "İstatistikleri Göster" : "Gönderilen Raporlar"}
                    </button>
                </div>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {distributionData.map((item, index) => (
                    <div
                        key={item.name}
                        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    {item.name}
                                </p>
                                <p className="text-3xl font-bold text-indigo-600">
                                    {item.value}
                                </p>
                            </div>
                            <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full">
                                {index === 0 && <School size={24} />}
                                {index === 1 && <Users size={24} />}
                                {index === 2 && <GraduationCap size={24} />}
                                {index === 3 && <Award size={24} />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Grafikler */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Dağılım Grafiği */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" />
                        Genel Dağılım
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={distributionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                                dataKey="value"
                                fill="#4F46E5"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pasta Grafiği */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        Dağılım Oranları
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={distributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {distributionData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Aylık Trend */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Aylık Trend Analizi
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="students"
                            stroke="#4F46E5"
                            strokeWidth={3}
                            name="Öğrenci Sayısı"
                        />
                        <Line
                            type="monotone"
                            dataKey="teachers"
                            stroke="#10B981"
                            strokeWidth={3}
                            name="Öğretmen Sayısı"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Gönderilen Raporlar Listesi */}
            {showReportsList && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mt-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        📋 Gönderilen Raporlar
                    </h2>
                    {reports.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            Henüz rapor gönderilmemiş.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {report.title}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{report.content}</p>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        <span>
                                            👨‍🏫 {report.teacher?.name} ({report.teacher?.subject})
                                        </span>
                                        <span>🎓 Sınıf: {report.className}</span>
                                        <span>🏫 {report.school?.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Rapor Gönderme Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative">
                        <button
                            onClick={() => setShowReportModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                                <FileText size={24} />
                                Sınıf Raporu Gönder
                            </h2>

                            <form onSubmit={handleSendReport} className="space-y-4">
                                {role === "teacher" && teacherClasses.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Sınıf Seçin
                                        </label>
                                        <select
                                            value={reportClassName}
                                            onChange={(e) => setReportClassName(e.target.value)}
                                            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            required
                                        >
                                            {teacherClasses.map((cls) => (
                                                <option key={cls.id} value={cls.className}>
                                                    {cls.className}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Rapor Başlığı
                                    </label>
                                    <input
                                        type="text"
                                        value={reportTitle}
                                        onChange={(e) => setReportTitle(e.target.value)}
                                        placeholder={role === "teacher" && reportClassName ? `${reportClassName} Sınıfı Aylık Raporu` : "Örn: 7A Sınıfı Aylık Raporu"}
                                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Rapor İçeriği
                                    </label>
                                    <textarea
                                        value={reportContent}
                                        onChange={(e) => setReportContent(e.target.value)}
                                        placeholder="Rapor detaylarını buraya yazın..."
                                        rows={10}
                                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReportModal(false);
                                            setReportTitle("");
                                            setReportContent("");
                                            setReportClassName(teacherClasses.length > 0 ? teacherClasses[0].className : "");
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingReport}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                        {sendingReport ? "Gönderiliyor..." : "Raporu Gönder"}
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

