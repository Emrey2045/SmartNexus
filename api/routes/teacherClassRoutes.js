import express from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

/* ===========================
   📋 Öğretmenin Sınıflarını Listele
=========================== */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        
        if (user.role !== "teacher") {
            return errorResponse(res, "Bu işlem için öğretmen yetkisi gerekli", 403);
        }

        const teacher = await prisma.teacher.findFirst({
            where: { userId: user.id },
        });

        if (!teacher) {
            return errorResponse(res, "Öğretmen bilgisi bulunamadı", 404);
        }

        const classes = await prisma.teacherClass.findMany({
            where: { teacherId: teacher.id },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { className: "asc" },
        });

        // Her sınıf için öğrenci sayısını ekle
        const classesWithStats = await Promise.all(
            classes.map(async (cls) => {
                const studentCount = await prisma.student.count({
                    where: {
                        schoolId: cls.schoolId,
                        grade: cls.className,
                    },
                });

                return {
                    ...cls,
                    studentCount,
                };
            })
        );

        return successResponse(res, classesWithStats, "Sınıflar başarıyla listelendi");
    } catch (err) {
        console.error("❌ /teacher-classes GET hatası:", err.message);
        return errorResponse(res, "Sınıflar listelenirken hata oluştu", 500);
    }
});

/* ===========================
   ➕ Öğretmene Sınıf Ekle
=========================== */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        
        if (user.role !== "teacher") {
            return errorResponse(res, "Bu işlem için öğretmen yetkisi gerekli", 403);
        }

        const { className } = req.body;

        if (!className || !className.trim()) {
            return errorResponse(res, "Sınıf adı zorunludur", 400);
        }

        const teacher = await prisma.teacher.findFirst({
            where: { userId: user.id },
        });

        if (!teacher) {
            return errorResponse(res, "Öğretmen bilgisi bulunamadı", 404);
        }

        // Aynı sınıf zaten var mı kontrol et
        const existing = await prisma.teacherClass.findFirst({
            where: {
                teacherId: teacher.id,
                className: className.trim(),
                schoolId: teacher.schoolId,
            },
        });

        if (existing) {
            return errorResponse(res, "Bu sınıf zaten eklenmiş", 400);
        }

        const teacherClass = await prisma.teacherClass.create({
            data: {
                teacherId: teacher.id,
                className: className.trim(),
                schoolId: teacher.schoolId,
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return successResponse(res, teacherClass, "Sınıf başarıyla eklendi");
    } catch (err) {
        console.error("❌ /teacher-classes POST hatası:", err.message);
        return errorResponse(res, "Sınıf eklenirken hata oluştu", 500);
    }
});

/* ===========================
   ❌ Öğretmenden Sınıf Sil
=========================== */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        
        if (user.role !== "teacher") {
            return errorResponse(res, "Bu işlem için öğretmen yetkisi gerekli", 403);
        }

        const classId = parseInt(req.params.id);

        const teacher = await prisma.teacher.findFirst({
            where: { userId: user.id },
        });

        if (!teacher) {
            return errorResponse(res, "Öğretmen bilgisi bulunamadı", 404);
        }

        const teacherClass = await prisma.teacherClass.findUnique({
            where: { id: classId },
        });

        if (!teacherClass) {
            return errorResponse(res, "Sınıf bulunamadı", 404);
        }

        // Öğretmen sadece kendi sınıflarını silebilir
        if (teacherClass.teacherId !== teacher.id) {
            return errorResponse(res, "Bu sınıf size ait değil", 403);
        }

        await prisma.teacherClass.delete({
            where: { id: classId },
        });

        return successResponse(res, null, "Sınıf başarıyla silindi");
    } catch (err) {
        console.error("❌ /teacher-classes/:id DELETE hatası:", err.message);
        return errorResponse(res, "Sınıf silinirken hata oluştu", 500);
    }
});

export default router;

