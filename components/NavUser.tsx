"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserInfo {
  id: string;
  email: string;
  plan: string;
  role: string;
}

export default function NavUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.user) {
            setUser(data.user);
          }
        }
      } catch (e) {
        console.error("Failed to fetch session:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  if (loading) {
    return <nav className="flex gap-4 items-center text-sm"><span className="text-gray-400">加载中...</span></nav>;
  }

  if (!user) {
    return (
      <nav className="flex gap-4 items-center text-sm">
        <Link href="/login" className="px-3 py-1 rounded border" style={{ borderColor: "var(--slate-300)", color: "var(--slate-700)" }}>
          登录
        </Link>
        <Link href="/signup" className="px-3 py-2 rounded-md text-white" style={{ background: "var(--blue-600)" }}>
          注册
        </Link>
      </nav>
    );
  }

  const planLabel = user.plan === "pro" ? "Pro" : user.plan === "enterprise" ? "Enterprise" : "Free";
  const planColor = user.plan === "free" ? "var(--slate-500)" : "var(--emerald-600)";

  return (
    <nav className="flex gap-4 items-center text-sm">
      <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--slate-100)", color: planColor }}>
        {planLabel}
      </span>
      <Link href="/dashboard" className="px-3 py-1 rounded border" style={{ borderColor: "var(--slate-300)", color: "var(--slate-700)" }}>
        控制台
      </Link>
      <Link href="/account" className="px-3" style={{ color: "var(--slate-700)" }}>
        {user.email}
      </Link>
      <button 
        onClick={handleLogout}
        className="px-3 py-1 rounded text-sm"
        style={{ color: "var(--red-600)" }}
      >
        退出
      </button>
    </nav>
  );
}
