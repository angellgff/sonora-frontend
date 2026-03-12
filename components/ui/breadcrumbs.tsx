"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="flex items-center gap-1.5 text-xs font-medium mb-6" aria-label="Breadcrumb">
            <Link href="/dashboard" className="text-slate-500 hover:text-[#00E599] transition-colors">
                Inicio
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    {item.href ? (
                        <Link href={item.href} className="text-slate-500 hover:text-[#00E599] transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-slate-300">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
