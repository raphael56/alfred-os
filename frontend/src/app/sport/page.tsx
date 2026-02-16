"use client";

import dynamic from "next/dynamic";

const GarminDashboard = dynamic(() => import("@/components/GarminDashboard"), { ssr: false });
const SportHistory = dynamic(() => import("@/components/SportHistory"), { ssr: false });

export default function SportPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sport</h1>
        <p className="text-gray-500 text-sm mt-0.5">Garmin data & training history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GarminDashboard />
        <SportHistory />
      </div>
    </div>
  );
}
