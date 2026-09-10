import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../components/Layout";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "注册失败");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="注册">
      <Head>
        <title>注册 · GotoDeck</title>
      </Head>
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">创建账号</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">邮箱</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">密码（至少 8 位）</label>
            <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30" />
          </div>
          {error && <p role="alert" className="text-sm text-orange-700">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60">
            {loading ? "创建中…" : "创建账号"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">已有账号？<a href="/login" className="text-blue-600 font-medium">登录</a></p>
      </div>
    </Layout>
  );
}
