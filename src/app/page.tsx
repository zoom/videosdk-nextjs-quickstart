"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [sessionName, setSessionName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("create");
  const router = useRouter();

  const handleSession = () => {
    const role = mode === "create" ? "1" : "0";
    const encodedPassword = encodeURIComponent(password);
    router.push(`/call/${sessionName}?role=${role}&password=${encodedPassword}`);
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
      <Input
        type="password"
        className="w-full max-w-xs mb-4"
        placeholder="輸入會話密碼（可選）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
        注意：創建會話時若有使用密碼，加入會話時如果輸入不同密碼，會導致無法加入任何會議。
      </p>
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
