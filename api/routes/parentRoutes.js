import express from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

/* ===========================
   👨‍👩‍👧 Velileri Listeleme
=========================== */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let parents = [];

        if (user.role === "admin") {
            parents = await prisma.parent.findMany({
                include: { students: true, user: true },
            });
        } else if (user.role === "manager") {
            const school = await prisma.school.findFirst({ where: { managerId: user.id } });
            if (school) {
                parents = await prisma.parent.findMany({
                    where: { students: { some: { schoolId: school.id } } },
                    include: { students: true, user: true },
                });
            }
        } else if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (teacher) {
                parents = await prisma.parent.findMany({
                    where: {
                        students: {
                            some: { grade: teacher.className, schoolId: teacher.schoolId },
                        },
                    },
                    include: { students: true, user: true },
                });
            }
        } else if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({
                where: { userId: user.id },
                include: { students: true, user: true },
            });
            if (parent) parents = [parent];
        } else {
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);
        }

        return successResponse(res, parents, "Veliler başarıyla listelendi");
    } catch (err) {
        console.error("❌ /parents GET hatası:", err.message);
        return errorResponse(res, "Veliler listelenirken hata oluştu");
    }
});

/* ===========================
   🔍 Tekil Veli Detayı
=========================== */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const parentId = parseInt(req.params.id);
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: { students: { include: { school: true } }, user: true },
        });

        if (!parent) return errorResponse(res, "Veli bulunamadı", 404);

        const user = req.user;

        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({
                where: { managerId: user.id },
            });
            const hasAccess = parent.students.some((s) => s.schoolId === managerSchool?.id);
            if (!hasAccess) return errorResponse(res, "Bu veli sizin okulunuza ait değil", 403);
        }

        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            const hasAccess = parent.students.some(
                (s) => s.schoolId === teacher?.schoolId && s.grade === teacher?.className
            );
            if (!hasAccess) return errorResponse(res, "Bu veli sizin sınıfınıza ait değil", 403);
        }

        if (user.role === "parent" && parent.userId !== user.id) {
            return errorResponse(res, "Kendi dışınızdaki velilere erişemezsiniz", 403);
        }

        return successResponse(res, parent, "Veli bilgileri getirildi");
    } catch (err) {
        console.error("❌ /parents/:id hatası:", err.message);
        return errorResponse(res, "Veli bilgileri alınamadı");
    }
});

/* ===========================
   ➕ Yeni Veli Ekleme
=========================== */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!["admin", "manager", "teacher"].includes(user.role)) {
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);
        }

        const { name, phone, email, userId, studentIds } = req.body;
        if (!name) return errorResponse(res, "Veli ismi gerekli", 400);

        // Manager yalnızca kendi okuluna ait öğrencilere veli ekleyebilir
        if (user.role === "manager" && studentIds?.length) {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            const invalidStudents = await prisma.student.findMany({
                where: {
                    id: { in: studentIds },
                    schoolId: { not: managerSchool?.id },
                },
            });
            if (invalidStudents.length > 0) {
                return errorResponse(res, "Bu öğrenciler sizin okulunuza ait değil", 403);
            }
        }

        // Teacher yalnızca kendi sınıfındaki öğrencilere veli ekleyebilir
        if (user.role === "teacher" && studentIds?.length) {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (teacher) {
                const invalidStudents = await prisma.student.findMany({
                    where: {
                        id: { in: studentIds },
                        OR: [
                            { schoolId: { not: teacher.schoolId } },
                            { grade: { not: teacher.className } },
                        ],
                    },
                });
                if (invalidStudents.length > 0) {
                    return errorResponse(res, "Bu öğrenciler sizin sınıfınıza ait değil", 403);
                }
            }
        }

        const newParent = await prisma.parent.create({
            data: {
                name,
                phone: phone || null,
                email: email || null,
                ...(userId && { user: { connect: { id: userId } } }),
                ...(studentIds?.length && {
                    students: { connect: studentIds.map((id) => ({ id })) },
                }),
            },
            include: { students: true, user: true },
        });

        return successResponse(res, newParent, "Yeni veli başarıyla eklendi");
    } catch (err) {
        console.error("❌ /parents POST hatası:", err.message);
        return errorResponse(res, "Veli eklenirken hata oluştu");
    }
});

/* ===========================
   ✏️ Veli Güncelleme
=========================== */
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin" && user.role !== "manager") {
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);
        }

        const parentId = parseInt(req.params.id);
        const { name, phone, email, userId, studentIds } = req.body;

        const existing = await prisma.parent.findUnique({
            where: { id: parentId },
            include: { students: true },
        });
        if (!existing) return errorResponse(res, "Veli bulunamadı", 404);

        // Manager sadece kendi okulundaki veliyi güncelleyebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            const hasAccess = existing.students.some((s) => s.schoolId === managerSchool?.id);
            if (!hasAccess) return errorResponse(res, "Bu veli sizin okulunuza ait değil", 403);
        }

        const updated = await prisma.parent.update({
            where: { id: parentId },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(email && { email }),
                ...(userId && { user: { connect: { id: userId } } }),
                ...(studentIds?.length && {
                    students: { set: studentIds.map((id) => ({ id })) },
                }),
            },
            include: { students: true, user: true },
        });

        return successResponse(res, updated, "Veli bilgileri güncellendi");
    } catch (err) {
        console.error("❌ /parents PATCH hatası:", err.message);
        return errorResponse(res, "Veli güncellenirken hata oluştu");
    }
});

/* ===========================
   ❌ Veli Silme
=========================== */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!["admin", "manager", "teacher"].includes(user.role)) {
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);
        }

        const parentId = parseInt(req.params.id);
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            include: { students: true },
        });
        if (!parent) return errorResponse(res, "Veli bulunamadı", 404);

        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            const hasAccess = parent.students.some((s) => s.schoolId === managerSchool?.id);
            if (!hasAccess) return errorResponse(res, "Bu veli sizin okulunuza ait değil", 403);
        }

        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (teacher) {
                const hasAccess = parent.students.some(
                    (s) => s.schoolId === teacher.schoolId && s.grade === teacher.className
                );
                if (!hasAccess) return errorResponse(res, "Bu veli sizin sınıfınıza ait değil", 403);
            }
        }

        await prisma.parent.delete({ where: { id: parentId } });
        return successResponse(res, null, "Veli başarıyla silindi");
    } catch (err) {
        console.error("❌ /parents DELETE hatası:", err.message);
        return errorResponse(res, "Veli silinirken hata oluştu");
    }
});

export default router;
