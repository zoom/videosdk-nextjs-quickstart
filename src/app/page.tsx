"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [sessionName, setSessionName] = useState("");
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-between p-24">
      <h1 className="text-3xl font-bold text-center my-4">
        Zoom VideoSDK Next.js Quickstart
      </h1>
      <Input
        type="text"
        className="w-full max-w-xs"
        placeholder="Session Name"
        value={sessionName}
        onChange={(e) => setSessionName(e.target.value)}
      />
      <Button
        className="w-full max-w-xs mt-8"
        disabled={!sessionName}
        onClick={() => router.push(`/call/${sessionName}`)}
      >
        Create Session
      </Button>
    </main>
  );
}
