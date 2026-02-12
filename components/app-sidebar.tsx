"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
    MessageSquare,
    User,
    BookOpen,
    Users,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Shield,
} from "lucide-react";

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        href: "/home-test",
        label: "Chat",
        icon: <MessageSquare className="w-5 h-5" />,
    },
    {
        href: "/profile",
        label: "Mi Perfil",
        icon: <User className="w-5 h-5" />,
    },
    {
        href: "/admin/knowledge",
        label: "Conocimiento",
        icon: <BookOpen className="w-5 h-5" />,
        adminOnly: true,
    },
    {
        href: "/admin/users",
        label: "Usuarios",
        icon: <Users className="w-5 h-5" />,
        adminOnly: true,
    },
];

export default function AppSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [role, setRole] = useState<string>("user");
    const [mounted, setMounted] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    useEffect(() => {
        setMounted(true);

        // Load saved sidebar state (default: collapsed)
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) setCollapsed(JSON.parse(saved));
        // If no saved state, default stays true (collapsed)

        // Get user role
        const fetchRole = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                if (profile) setRole(profile.role);
            }
        };
        fetchRole();
    }, []);

    const toggleCollapsed = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/auth/login";
    };

    const isAdmin = role === "admin";
    const filteredItems = navItems.filter(
        (item) => !item.adminOnly || isAdmin
    );

    // Close mobile sidebar on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    if (!mounted) return null;

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-slate-400 hover:text-[#00E599] transition-colors"
                aria-label="Abrir menú"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full
          bg-[#060D17]/95 backdrop-blur-xl
          border-r border-white/5
          flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[68px]" : "w-[220px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
            >
                {/* Logo / Brand */}
                <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center shrink-0">
                        <span className="text-[#00E599] text-sm font-black">S</span>
                    </div>
                    {!collapsed && (
                        <span className="ml-3 text-base font-bold text-white tracking-tight">
                            Sonora
                        </span>
                    )}
                </div>

                {/* Admin badge */}
                {isAdmin && !collapsed && (
                    <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                            Admin
                        </span>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${isActive
                                        ? "bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/15"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }
                `}
                            >
                                <span className={`shrink-0 transition-colors ${isActive ? "text-[#00E599]" : "text-slate-500 group-hover:text-slate-300"}`}>
                                    {item.icon}
                                </span>
                                {!collapsed && <span>{item.label}</span>}
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00E599] rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Separator if admin */}
                    {isAdmin && (
                        <div className="my-3">
                            {collapsed ? (
                                <div className="mx-auto w-6 h-px bg-white/10" />
                            ) : (
                                <div className="flex items-center gap-2 px-3">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold">
                                        Admin
                                    </span>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                {/* Bottom actions */}
                <div className="p-2 border-t border-white/5 space-y-1">
                    {/* Collapse toggle (desktop only) */}
                    <button
                        onClick={toggleCollapsed}
                        className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                        title={collapsed ? "Expandir" : "Colapsar"}
                    >
                        {collapsed ? (
                            <ChevronRight className="w-5 h-5 shrink-0" />
                        ) : (
                            <>
                                <ChevronLeft className="w-5 h-5 shrink-0" />
                                <span>Colapsar</span>
                            </>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
                        title={collapsed ? "Cerrar sesión" : undefined}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
