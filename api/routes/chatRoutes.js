import express from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

/* ===========================
   📋 Kullanıcının Erişebileceği Kanalları Listele
=========================== */
router.get("/channels", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let channels = [];

        if (user.role === "admin") {
            // Admin tüm kanalları görebilir
            channels = await prisma.chatChannel.findMany({
                include: {
                    school: true,
                    messages: {
                        take: 1,
                        orderBy: { createdAt: "desc" },
                        include: { user: { select: { id: true, name: true, role: true } } },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        } else if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({
                where: { userId: user.id },
            });

            if (teacher) {
                // Öğretmenler arası kanal
                const teachersChannel = await prisma.chatChannel.findFirst({
                    where: {
                        type: "teachers",
                        schoolId: teacher.schoolId,
                    },
                });

                // Öğretmenler + Müdür kanalı
                const teachersManagerChannel = await prisma.chatChannel.findFirst({
                    where: {
                        type: "teachers_manager",
                        schoolId: teacher.schoolId,
                    },
                });

                // Kendi sınıfının kanalı
                if (teacher.className) {
                    const classChannel = await prisma.chatChannel.findFirst({
                        where: {
                            type: "class",
                            schoolId: teacher.schoolId,
                            className: teacher.className,
                        },
                    });

                    if (classChannel) channels.push(classChannel);
                }

                if (teachersChannel) channels.push(teachersChannel);
                if (teachersManagerChannel) channels.push(teachersManagerChannel);
            }
        } else if (user.role === "manager") {
            const school = await prisma.school.findFirst({
                where: { managerId: user.id },
            });

            if (school) {
                // Öğretmenler + Müdür kanalı
                const teachersManagerChannel = await prisma.chatChannel.findFirst({
                    where: {
                        type: "teachers_manager",
                        schoolId: school.id,
                    },
                });

                if (teachersManagerChannel) channels.push(teachersManagerChannel);
            }
        } else if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({
                where: { userId: user.id },
                include: { students: true },
            });

            if (parent && parent.students.length > 0) {
                // Çocuklarının sınıf kanalları
                for (const student of parent.students) {
                    if (student.grade) {
                        const classChannel = await prisma.chatChannel.findFirst({
                            where: {
                                type: "class",
                                schoolId: student.schoolId,
                                className: student.grade,
                            },
                        });

                        if (classChannel && !channels.find((c) => c.id === classChannel.id)) {
                            channels.push(classChannel);
                        }
                    }
                }
            }
        } else if (user.role === "student") {
            const student = await prisma.student.findFirst({
                where: { userId: user.id },
            });

            if (student && student.grade) {
                const classChannel = await prisma.chatChannel.findFirst({
                    where: {
                        type: "class",
                        schoolId: student.schoolId,
                        className: student.grade,
                    },
                });

                if (classChannel) channels.push(classChannel);
            }
        }

        // Son mesaj bilgisiyle birlikte döndür
        const channelsWithLastMessage = await Promise.all(
            channels.map(async (channel) => {
                const lastMessage = await prisma.message.findFirst({
                    where: { channelId: channel.id },
                    orderBy: { createdAt: "desc" },
                    include: { user: { select: { id: true, name: true, role: true } } },
                });

                return {
                    ...channel,
                    lastMessage: lastMessage || null,
                };
            })
        );

        return successResponse(res, channelsWithLastMessage, "Kanallar başarıyla listelendi");
    } catch (err) {
        console.error("❌ /chats/channels GET hatası:", err.message);
        return errorResponse(res, "Kanallar listelenirken hata oluştu", 500);
    }
});

/* ===========================
   📨 Kanal Mesajlarını Getir
=========================== */
router.get("/channels/:id/messages", authMiddleware, async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const user = req.user;

        const channel = await prisma.chatChannel.findUnique({
            where: { id: channelId },
            include: { school: true },
        });

        if (!channel) return errorResponse(res, "Kanal bulunamadı", 404);

        // Erişim kontrolü
        const hasAccess = await checkChannelAccess(user, channel);
        if (!hasAccess) {
            return errorResponse(res, "Bu kanala erişim yetkiniz yok", 403);
        }

        const messages = await prisma.message.findMany({
            where: { channelId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return successResponse(res, messages, "Mesajlar başarıyla getirildi");
    } catch (err) {
        console.error("❌ /chats/channels/:id/messages GET hatası:", err.message);
        return errorResponse(res, "Mesajlar getirilirken hata oluştu", 500);
    }
});

/* ===========================
   ✉️ Mesaj Gönder
=========================== */
router.post("/channels/:id/messages", authMiddleware, async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const { content } = req.body;
        const user = req.user;

        if (!content || !content.trim()) {
            return errorResponse(res, "Mesaj içeriği boş olamaz", 400);
        }

        const channel = await prisma.chatChannel.findUnique({
            where: { id: channelId },
        });

        if (!channel) return errorResponse(res, "Kanal bulunamadı", 404);

        // Erişim kontrolü
        const hasAccess = await checkChannelAccess(user, channel);
        if (!hasAccess) {
            return errorResponse(res, "Bu kanala mesaj gönderme yetkiniz yok", 403);
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                channelId,
                userId: user.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        email: true,
                    },
                },
            },
        });

        return successResponse(res, message, "Mesaj başarıyla gönderildi");
    } catch (err) {
        console.error("❌ /chats/channels/:id/messages POST hatası:", err.message);
        return errorResponse(res, "Mesaj gönderilirken hata oluştu", 500);
    }
});

/* ===========================
   ➕ Kanal Oluştur (İlk kurulum için)
=========================== */
router.post("/channels", authMiddleware, async (req, res) => {
    try {
        const { name, type, schoolId, className } = req.body;
        const user = req.user;

        if (!name || !type) {
            return errorResponse(res, "Kanal adı ve tipi zorunludur", 400);
        }

        // Sadece admin ve manager kanal oluşturabilir
        if (user.role !== "admin" && user.role !== "manager") {
            return errorResponse(res, "Kanal oluşturma yetkiniz yok", 403);
        }

        // Manager sadece kendi okuluna kanal oluşturabilir
        if (user.role === "manager" && schoolId) {
            const school = await prisma.school.findFirst({
                where: { managerId: user.id, id: schoolId },
            });
            if (!school) {
                return errorResponse(res, "Sadece kendi okulunuza kanal oluşturabilirsiniz", 403);
            }
        }

        const channel = await prisma.chatChannel.create({
            data: {
                name,
                type,
                schoolId: schoolId || null,
                className: className || null,
            },
            include: { school: true },
        });

        return successResponse(res, channel, "Kanal başarıyla oluşturuldu");
    } catch (err) {
        console.error("❌ /chats/channels POST hatası:", err.message);
        return errorResponse(res, "Kanal oluşturulurken hata oluştu", 500);
    }
});

/* ===========================
   🔐 Kanal Erişim Kontrolü
=========================== */
async function checkChannelAccess(user, channel) {
    if (user.role === "admin") return true;

    if (channel.type === "teachers") {
        // Sadece öğretmenler
        if (user.role !== "teacher") return false;
        const teacher = await prisma.teacher.findFirst({
            where: { userId: user.id, schoolId: channel.schoolId },
        });
        return !!teacher;
    }

    if (channel.type === "teachers_manager") {
        // Öğretmenler ve müdür
        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({
                where: { userId: user.id, schoolId: channel.schoolId },
            });
            return !!teacher;
        }
        if (user.role === "manager") {
            const school = await prisma.school.findFirst({
                where: { managerId: user.id, id: channel.schoolId },
            });
            return !!school;
        }
        return false;
    }

    if (channel.type === "class") {
        // Sınıf kanalı: öğretmen, veliler, öğrenciler
        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({
                where: {
                    userId: user.id,
                    schoolId: channel.schoolId,
                    className: channel.className,
                },
            });
            return !!teacher;
        }

        if (user.role === "student") {
            const student = await prisma.student.findFirst({
                where: {
                    userId: user.id,
                    schoolId: channel.schoolId,
                    grade: channel.className,
                },
            });
            return !!student;
        }

        if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({
                where: { userId: user.id },
                include: { students: true },
            });
            if (!parent) return false;
            return parent.students.some(
                (s) => s.schoolId === channel.schoolId && s.grade === channel.className
            );
        }

        return false;
    }

    return false;
}

export default router;

