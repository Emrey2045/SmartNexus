// config/config.js
import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "development";

// Üretimde sessizce fallback'e düşmemek için zorunlu env kontrolü
const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
if (env === "production") {
  requiredEnv.push("REFRESH_TOKEN_PEPPER");
}

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Eksik environment variable: ${key}`);
  }
}

export const CONFIG = {
  env,
  port: Number(process.env.PORT) || 5000,
  appName: "SmartNexus API",

  databaseUrl: process.env.DATABASE_URL,
  logLevel: process.env.LOG_LEVEL || "info",

  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  // Refresh token hash için ekstra gizli değer (pepper)
  refreshTokenPepper: process.env.REFRESH_TOKEN_PEPPER || "",

  // CORS: virgülle ayrılmış origin listesi (boşsa dev'de serbest)
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
