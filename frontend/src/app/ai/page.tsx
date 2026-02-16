"use client";

import dynamic from "next/dynamic";

const AiUsage = dynamic(() => import("@/components/AiUsage"), { ssr: false });

export default function AiPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI</h1>
        <p className="text-gray-500 text-sm mt-0.5">OpenClaw AI usage & analytics</p>
      </div>

      <AiUsage />
    </div>
  );
}
