import "server-only";
import { KJUR } from "jsrsasign";

export async function getData(slug: string, role: number) {
  const JWT = await generateSignature(slug, role);
  return JWT;
}

// 取得Video SDK JWT才能創建與加入Session，role_type若為1則代表此人為Session主持人或共同主人，為0參與者
// Authorize：https://developers.zoom.us/docs/video-sdk/auth/#generate-a-video-sdk-jwt
// 權限說明：https://developers.zoom.us/docs/video-sdk/web/sessions/#user-roles-and-actions
function generateSignature(sessionName: string, role: number) {
  if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
    throw new Error("Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET");
  }
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: "HS256", typ: "JWT" };
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;
  const oPayload = {
    app_key: sdkKey, tpc: sessionName, role_type: role, version: 1, iat: iat, exp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);
  return sdkJWT;
}
