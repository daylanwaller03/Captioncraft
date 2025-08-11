import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold">CaptionCraft</h1>
      <p className="mt-4 text-lg">AI captions that make your posts go viral</p>
      <Link href="/dashboard">
        <button className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg">
          Try it Free
        </button>
      </Link>
    </div>
  );
}