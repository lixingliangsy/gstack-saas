import React from "react";
import Link from "next/link";
import { PRODUCT } from "@/lib/product";
import NavUser from "./NavUser";

/**
 * 应用内页外壳（区别于 public/ 下的静态营销页）。
 * 用于登录/控制台/后台等需要 Next.js 渲染的页面。
 */
export default function Layout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-sans)" }}>
      <a className="skip-link" href="#main">跳到主内容</a>
      <header className="border-b" style={{ borderColor: "var(--slate-200)" }}>
        <div className="container-g flex items-center justify-between" style={{ height: 64 }}>
          <Link href="/" className="font-bold text-lg" style={{ color: "var(--blue-700)" }}>
            {PRODUCT.name}
          </Link>
          <NavUser />
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t text-sm" style={{ borderColor: "var(--slate-200)", color: "var(--slate-500)" }}>
        <div className="container-g py-8">
          © {new Date().getFullYear()} {PRODUCT.name}. 保留所有权利。
        </div>
      </footer>
    </div>
  );
}
