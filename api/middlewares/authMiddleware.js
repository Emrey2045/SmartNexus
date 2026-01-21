// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/responseHelper.js";
import { CONFIG } from "../config/config.js";

/* ===========================
   ✅ Token Doğrulama Middleware
=========================== */
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Yetkilendirme gerekli", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, CONFIG.jwtSecret);

        // normalize: prisma Int bekler
        req.user = {
            id: Number(decoded.id),
            role: decoded.role,
        };

        if (!req.user.id || !req.user.role) {
            return errorResponse(res, "Token içeriği geçersiz", 401);
        }

        next();
    } catch (err) {
        console.error("JWT doğrulama hatası:", err.message);
        return errorResponse(res, "Geçersiz veya süresi dolmuş token", 401);
    }
};

/* ===========================
   🔒 Sadece Admin Erişimi
=========================== */
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return errorResponse(res, "Bu işlem için admin yetkisi gerekli", 403);
    }
    next();
};
