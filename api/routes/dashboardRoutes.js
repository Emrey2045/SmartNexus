import express from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleGuard } from "../middlewares/roleGuard.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

/* ===========================
   📊 Admin: Genel İstatistikler
=========================== */
router.get("/overview", authMiddleware, roleGuard("admin"), async (req, res) => {
    try {
        const [totalSchools, totalTeachers, totalStudents, totalParents] = await Promise.all([
            prisma.school.count(),
            prisma.teacher.count(),
            prisma.student.count(),
            prisma.parent.count()
        ]);

        return successResponse(res, {
            totalSchools,
            totalTeachers,
            totalStudents,
            totalParents
        }, "Genel istatistikler getirildi");
    } catch (err) {
        console.error("DASHBOARD OVERVIEW ERROR:", err);
        return errorResponse(res, "Genel istatistikler alınırken hata oluştu");
    }
});

/* ===========================
   🏫 Manager: Kendi Okulunun İstatistikleri
=========================== */
router.get("/school-stats", authMiddleware, roleGuard("manager"), async (req, res) => {
    try {
        const school = await prisma.school.findFirst({ where: { managerId: req.user.id } });
        if (!school) return errorResponse(res, "Yöneticiye bağlı okul bulunamadı", 404);

        const [teachers, students, parents] = await Promise.all([
            prisma.teacher.count({ where: { schoolId: school.id } }),
            prisma.student.count({ where: { schoolId: school.id } }),
            prisma.parent.count({
                where: { students: { some: { schoolId: school.id } } }
            })
        ]);

        return successResponse(res, {
            school: school.name,
            teachers,
            students,
            parents
        }, "Okul istatistikleri getirildi");
    } catch (err) {
        console.error("DASHBOARD SCHOOL-STATS ERROR:", err);
        return errorResponse(res, "Okul istatistikleri alınırken hata oluştu");
    }
});

/* ===========================
   👩‍🏫 Teacher: Kendi Sınıfının İstatistikleri
=========================== */
router.get("/class-stats", authMiddleware, roleGuard("teacher"), async (req, res) => {
    try {
        const teacher = await prisma.teacher.findFirst({
            where: { userId: req.user.id },
            include: { school: true },
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
                school: teacher.school?.name || "",
                students,
                parents,
            },
            "Sınıf istatistikleri getirildi"
        );
    } catch (err) {
        console.error("DASHBOARD CLASS-STATS ERROR:", err);
        return errorResponse(res, "Sınıf istatistikleri alınırken hata oluştu", 500);
    }
});

export default router;
