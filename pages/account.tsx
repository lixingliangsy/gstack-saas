import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../components/Layout";

type PubUser = { id: string; email: string; plan: "free" | "pro" | "enterprise"; role: "user" | "admin" };

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<PubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [byok, setByok] = useState("");
  const [byokMsg, setByokMsg] = useState<string | null>(null);
  const [byokSaving, setByokSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setUser(d.user);
        else router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function saveByok() {
    setByokSaving(true);
    setByokMsg(null);
    try {
      const res = await fetch("/api/byok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: byok }),
      });
      const json = await res.json();
      setByokMsg(json.ok ? json.message : json.error);
      if (json.ok) setByok("");
    } catch {
      setByokMsg("网络错误");
    } finally {
      setByokSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) return <Layout title="账号"><div className="px-4 py-16 text-center text-slate-500">加载中…</div></Layout>;

  return (
    <Layout title="账号">
      <Head><title>账号 · GStack</title></Head>
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">我的账号</h1>
        {user && (
          <dl className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">邮箱</dt><dd className="font-medium text-slate-900">{user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">套餐</dt><dd className="font-medium text-slate-900">{user.plan.toUpperCase()}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">角色</dt><dd className="font-medium text-slate-900">{user.role === "admin" ? "管理员" : "用户"}</dd></div>
          </dl>
        )}

        {user?.plan === "enterprise" && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">BYOK 自带密钥</h2>
            <p className="mt-1 text-sm text-slate-500">密钥仅保存在服务端，不会下发到客户端。</p>
            <textarea value={byok} onChange={(e) => setByok(e.target.value)} rows={2} placeholder="sk-..."
              className="mt-3 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30" />
            <button onClick={saveByok} disabled={byokSaving || !byok}
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {byokSaving ? "保存中…" : "保存密钥"}
            </button>
            {byokMsg && <p className="mt-2 text-sm text-slate-600">{byokMsg}</p>}
          </section>
        )}

        {user?.plan !== "enterprise" && (
          <p className="mt-6 text-sm text-slate-600">
            需要 BYOK 自带密钥？<a href="/pricing.html" className="text-blue-600 font-medium">升级到 Enterprise</a>。
          </p>
        )}

        <button onClick={logout}
          className="mt-8 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          退出登录
        </button>
      </div>
    </Layout>
  );
}
