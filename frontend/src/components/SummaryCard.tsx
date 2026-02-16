"use client";

import Link from "next/link";

interface Props {
  href: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
}

export default function SummaryCard({ href, title, value, subtitle, color, icon }: Props) {
  return (
    <Link href={href} className={`block rounded-2xl border bg-gray-900 p-6 transition-all hover:scale-[1.02] hover:shadow-lg ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-xl bg-gray-800/50">
          {icon}
        </div>
      </div>
    </Link>
  );
}
