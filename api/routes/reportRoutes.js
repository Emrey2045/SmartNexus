import express from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

/* ===========================
   📊 Öğretmen: Kendi Sınıfının İstatistikleri
=========================== */
router.get("/class-stats", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "teacher") {
            return errorResponse(res, "Bu işlem için öğretmen yetkisi gerekli", 403);
        }

        const teacher = await prisma.teacher.findFirst({
            where: { userId: user.id },
        });

        if (!teacher || !teacher.className) {
            return errorResponse(res, "Öğretmen bilgisi veya sınıf bilgisi bulunamadı", 404);
        }

        const [students, parents] = await Promise.all([
            prisma.student.count({
                where: {
                    schoolId: teacher.schoolId,
                    grade: teacher.className,
                },
            }),
            prisma.parent.count({
                where: {
                    students: {
                        some: {
                            schoolId: teacher.schoolId,
                            grade: teacher.className,
                        },
                    },
                },
            }),
        ]);

        return successResponse(
            res,
            {
                className: teacher.className,
                schoolId: teacher.schoolId,
                students,
                parents,
            },
            "Sınıf istatistikleri getirildi"
        );
    } catch (err) {
        console.error("❌ /reports/class-stats GET hatası:", err.message);
        return errorResponse(res, "Sınıf istatistikleri alınırken hata oluştu", 500);
    }
});

/* ===========================
   📝 Rapor Gönder (Öğretmen)
=========================== */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "teacher") {
            return errorResponse(res, "Bu işlem için öğretmen yetkisi gerekli", 403);
        }

        const { title, content, className } = req.body;

        if (!title || !content) {
            return errorResponse(res, "Başlık ve içerik zorunludur", 400);
        }

        const teacher = await prisma.teacher.findFirst({
            where: { userId: user.id },
        });

        if (!teacher) {
            return errorResponse(res, "Öğretmen bilgisi bulunamadı", 404);
        }

        // Sınıf kontrolü - TeacherClass'tan kontrol et veya className parametresinden al
        let reportClassName = className;
        
        if (!reportClassName) {
            // Eğer className gönderilmemişse, öğretmenin eski className'ini kullan (geriye dönük uyumluluk)
            if (teacher.className) {
                reportClassName = teacher.className;
            } else {
                return errorResponse(res, "Sınıf bilgisi gerekli", 400);
            }
        } else {
            // Gönderilen sınıfın öğretmene ait olup olmadığını kontrol et
            const teacherClass = await prisma.teacherClass.findFirst({
                where: {
                    teacherId: teacher.id,
                    className: reportClassName.trim(),
                    schoolId: teacher.schoolId,
                },
            });

            // Eğer TeacherClass'ta yoksa ama teacher.className ile eşleşiyorsa kabul et (geriye dönük uyumluluk)
            if (!teacherClass && teacher.className !== reportClassName.trim()) {
                return errorResponse(res, "Bu sınıf size ait değil", 403);
            }
        }

        const report = await prisma.report.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                className: reportClassName.trim(),
                schoolId: teacher.schoolId,
                teacherId: teacher.id,
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                        className: true,
                    },
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return successResponse(res, report, "Rapor başarıyla gönderildi");
    } catch (err) {
        console.error("❌ /reports POST hatası:", err.message);
        return errorResponse(res, "Rapor gönderilirken hata oluştu", 500);
    }
});

/* ===========================
   📋 Raporları Listele
=========================== */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let reports = [];

        if (user.role === "admin") {
            // Admin tüm raporları görebilir
            reports = await prisma.report.findMany({
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            subject: true,
                            className: true,
                        },
                    },
                    school: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        } else if (user.role === "manager") {
            // Manager kendi okulunun raporlarını görebilir
            const school = await prisma.school.findFirst({
                where: { managerId: user.id },
            });

            if (school) {
                reports = await prisma.report.findMany({
                    where: { schoolId: school.id },
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                className: true,
                            },
                        },
                        school: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });
            }
        } else if (user.role === "teacher") {
            // Öğretmen sadece kendi raporlarını görebilir
            const teacher = await prisma.teacher.findFirst({
                where: { userId: user.id },
            });

            if (teacher) {
                reports = await prisma.report.findMany({
                    where: { teacherId: teacher.id },
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                className: true,
                            },
                        },
                        school: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });
            }
        } else if (user.role === "parent") {
            // Veli çocuğunun sınıfının raporlarını görebilir
            const parent = await prisma.parent.findFirst({
                where: { userId: user.id },
                include: { students: true },
            });

            if (parent && parent.students.length > 0) {
                const classNames = [...new Set(parent.students.map((s) => s.grade))];
                const schoolIds = [...new Set(parent.students.map((s) => s.schoolId))];

                reports = await prisma.report.findMany({
                    where: {
                        className: { in: classNames },
                        schoolId: { in: schoolIds },
                    },
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                className: true,
                            },
                        },
                        school: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });
            }
        }

        return successResponse(res, reports, "Raporlar başarıyla listelendi");
    } catch (err) {
        console.error("❌ /reports GET hatası:", err.message);
        return errorResponse(res, "Raporlar listelenirken hata oluştu", 500);
    }
});

/* ===========================
   🔍 Tekil Rapor Detayı
=========================== */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        const user = req.user;

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                        className: true,
                    },
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!report) return errorResponse(res, "Rapor bulunamadı", 404);

        // Erişim kontrolü
        if (user.role === "admin") {
            // Admin tüm raporları görebilir
        } else if (user.role === "manager") {
            const school = await prisma.school.findFirst({
                where: { managerId: user.id },
            });
            if (!school || school.id !== report.schoolId) {
                return errorResponse(res, "Bu rapora erişim yetkiniz yok", 403);
            }
        } else if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({
                where: { userId: user.id },
            });
            if (!teacher || teacher.id !== report.teacherId) {
                return errorResponse(res, "Bu rapora erişim yetkiniz yok", 403);
            }
        } else if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({
                where: { userId: user.id },
                include: { students: true },
            });
            const hasAccess =
                parent &&
                parent.students.some(
                    (s) => s.schoolId === report.schoolId && s.grade === report.className
                );
            if (!hasAccess) {
                return errorResponse(res, "Bu rapora erişim yetkiniz yok", 403);
            }
        } else {
            return errorResponse(res, "Bu rapora erişim yetkiniz yok", 403);
        }

        return successResponse(res, report, "Rapor detayı getirildi");
    } catch (err) {
        console.error("❌ /reports/:id GET hatası:", err.message);
        return errorResponse(res, "Rapor detayı alınırken hata oluştu", 500);
    }
});

export default router;

