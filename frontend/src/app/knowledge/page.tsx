"use client";

import dynamic from "next/dynamic";

const KnowledgeBase = dynamic(() => import("@/components/KnowledgeBase"), { ssr: false });

export default function KnowledgePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Knowledge</h1>
        <p className="text-gray-500 text-sm mt-0.5">Semantic search & knowledge base</p>
      </div>

      <KnowledgeBase />
    </div>
  );
}
