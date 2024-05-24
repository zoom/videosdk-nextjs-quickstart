import { getData } from "@/data/getToken";
import dynamic from "next/dynamic";
import Script from "next/script";

const Videocall = dynamic<{ slug: string; JWT: string }>(
  () => import("../../../components/Videocall"),
  { ssr: false },
);

export default async function Page({ params }: { params: { slug: string } }) {
  const jwt = await getData(params.slug);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Videocall slug={params.slug} JWT={jwt} />
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
    </main>
  );
}
