// routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";
import { CONFIG } from "../config/config.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import rateLimit from "express-rate-limit";
import { hashRefreshToken } from "../utils/tokenHash.js";

const router = express.Router();
// Rate limit: brute-force engellemek için (özellikle login/refresh)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dk
  max: 20, // IP başına 20 deneme
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// prisma singleton: ../lib/prisma.js

/* ============================
   🧱 KULLANICI KAYDI (Register)
============================ */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, adminPassword, schoolId, grade } = req.body;

        if (!name || !email || !password) {
            return errorResponse(res, "Name, email ve password zorunludur", 400);
        }

        // Geçerli roller
        const validRoles = ["student", "teacher", "manager", "parent", "admin"];
        const userRole = role || "student";
        
        if (!validRoles.includes(userRole)) {
            return errorResponse(res, "Geçersiz rol. Geçerli roller: student, teacher, manager, parent, admin", 400);
        }

        // Admin kaydı için özel şifre kontrolü
        if (userRole === "admin") {
            if (!adminPassword || adminPassword !== "admin123") {
                return errorResponse(res, "Admin kaydı için özel şifre yanlış veya eksik", 403);
            }
        }

        // Email kontrolü
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return errorResponse(res, "Bu e-posta adresiyle kayıtlı bir kullanıcı var", 400);

        // Şifre hashleme
        const hashedPassword = await bcrypt.hash(password, 10);

        // Öğrenci rolünde kayıt olurken okulId + sınıf(grade) zorunlu olsun
        if (userRole === "student") {
            if (!schoolId || !grade?.trim()) {
                return errorResponse(res, "Öğrenci kaydı için schoolId ve grade zorunludur", 400);
            }

            const school = await prisma.school.findUnique({
                where: { id: Number(schoolId) },
                select: { id: true },
            });
            if (!school) {
                return errorResponse(res, "Geçersiz schoolId: Okul bulunamadı", 400);
            }
        }

        

        // Müdür rolünde kayıt olurken schoolId zorunlu olsun (müdür direkt okuluna atanır)
        if (userRole === "manager") {
            if (!schoolId) {
                return errorResponse(res, "Müdür kaydı için schoolId zorunludur", 400);
            }

            const school = await prisma.school.findUnique({
                where: { id: Number(schoolId) },
                select: { id: true, managerId: true },
            });

            if (!school) {
                return errorResponse(res, "Geçersiz schoolId: Okul bulunamadı", 400);
            }

            if (school.managerId) {
                return errorResponse(res, "Bu okulda zaten bir müdür atanmış", 400);
            }
        }

// Kullanıcı oluştur
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: userRole,
            },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

                // Müdür kaydı: Okula managerId olarak ata
        if (userRole === "manager") {
            await prisma.school.update({
                where: { id: Number(schoolId) },
                data: { managerId: newUser.id },
            });
        }

// Öğrenci kaydı: User ile ilişkilendir
        if (userRole === "student") {
            await prisma.student.create({
                data: {
                    name: name.trim(),
                    grade: grade.trim(),
                    school: { connect: { id: Number(schoolId) } },
                    user: { connect: { id: newUser.id } },
                },
            });
        }

        return successResponse(res, newUser, "Kullanıcı başarıyla oluşturuldu");
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return errorResponse(res, "Kullanıcı oluşturulurken bir hata oluştu", 500);
    }
});

/* ============================
   🔑 GİRİŞ (Login)
============================ */
router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, "Email ve password zorunludur", 400);
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return errorResponse(res, "Kullanıcı bulunamadı", 404);

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return errorResponse(res, "Geçersiz şifre", 401);

        if (!CONFIG.jwtSecret || !CONFIG.jwtRefreshSecret)
            return errorResponse(res, "Sunucu yapılandırma hatası: JWT_SECRET eksik", 500);

        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            CONFIG.jwtSecret,
            { expiresIn: "2h" }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            CONFIG.jwtRefreshSecret,
            { expiresIn: "7d" }
        );

        // Refresh token'ı veritabanına kaydet
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashRefreshToken(refreshToken) },
        });


        console.log(`[LOGIN SUCCESS] ${user.email} - Token üretildi`);

        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };

        return successResponse(
            res,
            { accessToken, refreshToken, user: safeUser },
            "Giriş başarılı"
        );
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return errorResponse(res, "Giriş yapılırken bir hata oluştu", 500);
    }
});

/* ============================
   👤 KULLANICI BİLGİLERİ (/me)
============================ */
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

        if (!user) return errorResponse(res, "Kullanıcı bulunamadı", 404);
        return successResponse(res, user, "Kullanıcı bilgisi getirildi");
    } catch (err) {
        console.error("ME ERROR:", err);
        return errorResponse(res, "Kullanıcı bilgisi alınamadı", 500);
    }
});

/* ============================
   ♻️ TOKEN YENİLEME (/refresh)
============================ */
router.post("/refresh", refreshLimiter, async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, "Refresh token gerekli", 400);

    try {
        const decoded = jwt.verify(refreshToken, CONFIG.jwtRefreshSecret);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        const incomingHash = hashRefreshToken(refreshToken);
        if (!user || user.refreshToken !== incomingHash) {
            return errorResponse(res, "Geçersiz veya eşleşmeyen refresh token", 403);
        }

        // 🔁 Yeni access & refresh token üret
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            CONFIG.jwtSecret,
            { expiresIn: "2h" }
        );

        const newRefreshToken = jwt.sign(
            { id: user.id },
            CONFIG.jwtRefreshSecret,
            { expiresIn: "7d" }
        );

        // DB'deki refresh token'ı güncelle
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashRefreshToken(newRefreshToken) },
        });

        console.log(`[TOKEN REFRESH] ${user.email} için yeni token üretildi`);

        return successResponse(
            res,
            { accessToken: newAccessToken, refreshToken: newRefreshToken },
            "Token başarıyla yenilendi"
        );
    } catch (err) {
        console.error("REFRESH ERROR:", err);
        return errorResponse(res, "Refresh token geçersiz veya süresi dolmuş", 403);
    }
});

/* ============================
   🔐 ŞİFRE DEĞİŞTİRME (/change-password)
============================ */
router.post("/change-password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword)
            return errorResponse(res, "Eski ve yeni şifre gereklidir", 400);

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return errorResponse(res, "Kullanıcı bulunamadı", 404);

        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) return errorResponse(res, "Eski şifre hatalı", 401);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        console.log(`[PASSWORD CHANGE] ${user.email} şifresini güncelledi`);

        return successResponse(res, null, "Şifre başarıyla değiştirildi");
    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);
        return errorResponse(res, "Şifre değiştirilirken bir hata oluştu", 500);
    }
});

/* ============================
   🚪 LOGOUT
============================ */
router.post("/logout", authMiddleware, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null },
        });

        console.log(`[LOGOUT] ${req.user.id} çıkış yaptı`);
        return successResponse(res, null, "Çıkış başarılı");
    } catch (err) {
        console.error("LOGOUT ERROR:", err);
        return errorResponse(res, "Çıkış yapılırken hata oluştu", 500);
    }
});


export default router;
