import express from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

/* ===========================
   📝 Öğrenci Raporu Gönder (Öğretmen & Müdür)
   POST /student-reports
   body: { studentId, title, content }
=========================== */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== "teacher" && user.role !== "manager") {
            return errorResponse(res, "Bu işlem için öğretmen veya müdür yetkisi gerekli", 403);
        }

        const { studentId, title, content } = req.body;

        if (!studentId || !title || !content) {
            return errorResponse(res, "studentId, başlık ve içerik zorunludur", 400);
        }

        const student = await prisma.student.findUnique({
            where: { id: Number(studentId) },
            include: { school: true },
        });

        if (!student) {
            return errorResponse(res, "Öğrenci bulunamadı", 404);
        }

        // Yetki kontrolü
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({
                where: { managerId: user.id },
            });

            if (!managerSchool || managerSchool.id !== student.schoolId) {
                return errorResponse(res, "Bu öğrenciye rapor göndermek için yetkiniz yok", 403);
            }
        }

        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({
                where: { userId: user.id },
            });

            if (!teacher) {
                return errorResponse(res, "Öğretmen kaydı bulunamadı", 404);
            }

            // Öğretmen: aynı okul ve sınıf (grade) kontrolü
            if (teacher.schoolId !== student.schoolId) {
                return errorResponse(res, "Bu öğrenci sizin okulunuza ait değil", 403);
            }

            // TeacherClass tablosu varsa onu da destekle (geriye dönük uyumluluk)
            const teacherClass = await prisma.teacherClass.findFirst({
                where: { teacherId: teacher.id, className: student.grade },
            });

            if (!teacherClass && teacher.className && teacher.className !== student.grade) {
                return errorResponse(res, "Bu öğrenci sizin sınıfınıza ait değil", 403);
            }
        }

        const report = await prisma.studentReport.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                studentId: student.id,
                schoolId: student.schoolId,
                createdByUserId: user.id,
            },
            include: {
                student: { select: { id: true, name: true, grade: true } },
                school: { select: { id: true, name: true } },
                createdByUser: { select: { id: true, name: true, role: true, email: true } },
            },
        });

        return successResponse(res, report, "Öğrenci raporu başarıyla gönderildi", 201);
    } catch (err) {
        console.error("❌ /student-reports POST hatası:", err.message);
        return errorResponse(res, "Öğrenci raporu gönderilirken hata oluştu", 500);
    }
});

/* ===========================
   📄 Öğrenci Raporlarını Listele
   GET /student-reports/student/:studentId
   (teacher/manager: yetkisi dahilindeki öğrenci, parent/student: kendi öğrencisi)
=========================== */
router.get("/student/:studentId", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const studentId = Number(req.params.studentId);

        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            return errorResponse(res, "Öğrenci bulunamadı", 404);
        }

        // Görüntüleme yetkisi
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            if (!managerSchool || managerSchool.id !== student.schoolId) {
                return errorResponse(res, "Bu raporlara erişim yetkiniz yok", 403);
            }
        } else if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (!teacher || teacher.schoolId !== student.schoolId) {
                return errorResponse(res, "Bu raporlara erişim yetkiniz yok", 403);
            }
            const teacherClass = await prisma.teacherClass.findFirst({
                where: { teacherId: teacher.id, className: student.grade },
            });
            if (!teacherClass && teacher.className && teacher.className !== student.grade) {
                return errorResponse(res, "Bu raporlara erişim yetkiniz yok", 403);
            }
        } else if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({ where: { userId: user.id } });
            if (!parent || student.parentId !== parent.id) {
                return errorResponse(res, "Bu raporlara erişim yetkiniz yok", 403);
            }
        } else if (user.role === "student") {
            const s = await prisma.student.findFirst({ where: { userId: user.id } });
            if (!s || s.id !== student.id) {
                return errorResponse(res, "Bu raporlara erişim yetkiniz yok", 403);
            }
        } else {
            return errorResponse(res, "Bu raporlara erişim yetkiniz yok", 403);
        }

        const reports = await prisma.studentReport.findMany({
            where: { studentId },
            include: {
                createdByUser: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return successResponse(res, reports, "Öğrenci raporları listelendi");
    } catch (err) {
        console.error("❌ /student-reports/student/:studentId GET hatası:", err.message);
        return errorResponse(res, "Öğrenci raporları alınırken hata oluştu", 500);
    }
});

export default router;
