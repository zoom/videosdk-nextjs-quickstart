import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type VideoClient } from "@zoom/videosdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
