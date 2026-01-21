// utils/tokenHash.js
import crypto from "crypto";
import { CONFIG } from "../config/config.js";

/**
 * Refresh token'ı DB'de düz metin saklamak yerine hashleyerek saklarız.
 * Böylece DB sızıntısında refresh tokenlar doğrudan kullanılamaz.
 */
export function hashRefreshToken(token) {
  const pepper = CONFIG.refreshTokenPepper || "";
  return crypto.createHash("sha256").update(token + pepper).digest("hex");
}
