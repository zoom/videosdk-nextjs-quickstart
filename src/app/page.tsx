"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [sessionName, setSessionName] = useState("");
  const [mode, setMode] = useState("create"); // 'create' 或 'join'
  const router = useRouter();

  const handleSession = () => {
    if (mode === "create") {
      router.push(`/call/${sessionName}?role=1`); // 創建會話時，role 固定為 1（主持人）
    } else {
      router.push(`/call/${sessionName}?role=0`); // 加入會話時，role 固定為 0（參與者）
    }
  };

  return (
    <main className="flex flex-col items-center justify-between p-24">
      <h1 className="text-3xl font-bold text-center my-4">
        Zoom VideoSDK Next.js Quickstart
      </h1>
      <div className="flex space-x-4 mb-4">
        <Button
          onClick={() => setMode("create")}
          variant={mode === "create" ? "default" : "outline"}
        >
          創建會話
        </Button>
        <Button
          onClick={() => setMode("join")}
          variant={mode === "join" ? "default" : "outline"}
        >
          加入會話
        </Button>
      </div>
      <Input
        type="text"
        className="w-full max-w-xs mb-4"
        placeholder={mode === "create" ? "輸入新會話名稱" : "輸入要加入的會話名稱"}
        value={sessionName}
        onChange={(e) => setSessionName(e.target.value)}
      />
      <Button
        className="w-full max-w-xs"
        disabled={!sessionName}
        onClick={handleSession}
      >
        {mode === "create" ? "創建會話" : "加入會話"}
      </Button>
    </main>
  );
}