import { getData } from "@/data/getToken";
import dynamic from "next/dynamic";
import Script from "next/script";

const Videocall = dynamic<{ slug: string; JWT: string; role: number, password?: string }>(
  () => import("../../../components/Videocall"),
  { ssr: false },
);

const Page = async ({ 
  params,
  searchParams 
}: { 
  params: { slug: string };
  searchParams: { role?: string; password?: string };
}) => {
  const roleParam = searchParams.role;
  let role = roleParam ? parseInt(roleParam, 10) : 0;
  const password = searchParams.password;

  // 取得 JWT token
  const jwt = await getData(params.slug, role);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Videocall 
        slug={params.slug} 
        JWT={jwt} 
        role={role} 
        password={password} 
      />
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
    </main>
  );
};

export default Page;
