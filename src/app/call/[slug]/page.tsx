import { getData } from "@/data/getToken";
import VideochatClientWrapper from "@/components/VideochatClientWrapper";

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const jwt = await getData(params.slug);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* this component is defined separately as it imports the ZoomSDK and needs to be a client component */}
      <VideochatClientWrapper slug={params.slug} JWT={jwt} />
    </main>
  );
}
