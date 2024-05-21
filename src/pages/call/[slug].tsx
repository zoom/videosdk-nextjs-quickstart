import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Videocall = dynamic<{ slug: string; JWT: string }>(
  () => import("../../components/Videocall"),
  { ssr: false }
);

export default function Page() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const [jwt, setJWT] = useState("");

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    if (!jwt) {
      const getToken = async () => {
        const res = await fetch(`/api/getToken?sessionName=${slug}&role=1`, {
          signal,
        });
        const data = await res.json();
        setJWT(data.sdkJWT);
      };
      getToken();
    }
    return () => {
      abortController.abort("UseEffect cleanup");
    };
  }, [jwt, slug]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {!jwt ? <div>Loading...</div> : <Videocall slug={slug} JWT={jwt} />}
    </main>
  );
}
