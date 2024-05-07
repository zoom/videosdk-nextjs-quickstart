import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { KJUR } from "jsrsasign";
import { type VideoClient } from "@zoom/videosdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// For safari desktop browsers, you need to start audio after the media-sdk-change event is triggered
export const WorkAroundForSafari = async (client: typeof VideoClient) => {
  let audioDecode: boolean;
  let audioEncode: boolean;
  client.on("media-sdk-change", (payload) => {
    console.log("media-sdk-change", payload);
    if (payload.type === "audio" && payload.result === "success") {
      if (payload.action === "encode") {
        audioEncode = true;
      } else if (payload.action === "decode") {
        audioDecode = true;
      }
      if (audioEncode && audioDecode) {
        console.log("start audio");
        void client.getMediaStream().startAudio();
      }
    }
  });
};

export function generateSignature(sessionName: string, role: number) {
  if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
    throw new Error("Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET");
  }
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: "HS256", typ: "JWT" };
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;
  const oPayload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    version: 1,
    iat: iat,
    exp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);
  return sdkJWT;
}