import { getData } from "@/data/getToken";
import dynamic from "next/dynamic";
import Script from "next/script";

const Videocall = dynamic<{ slug: string; JWT: string; role: number }>(
  () => import("../../../components/Videocall"),
  { ssr: false },
);

export default async function Page({ 
  params,
  searchParams 
}: { 
  params: { slug: string };
  searchParams: { role?: string };
}) {
  const roleParam = searchParams.role;
  const role = roleParam ? parseInt(roleParam, 10) : 0; // 將 role 轉換為數字，默認為 0

  // 確保 role 只能是 0 或 1
  const validRole = role === 1 ? 1 : 0;

  const jwt = await getData(params.slug, validRole);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Videocall slug={params.slug} JWT={jwt} role={validRole} />
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
    </main>
  );
}