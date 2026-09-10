import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";

type U = { id: string; email: string; plan: string; role: string; createdAt?: string };

export default function AdminUsers() {
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users" + (q ? `?q=${encodeURIComponent(q)}` : ""))
      .then((r) => (r.ok ? r.json() : (setForbidden(true), null)))
      .then((d) => d?.users && setUsers(d.users))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <Layout title="用户管理">
      <Head><title>用户管理 · GotoDeck</title></Head>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">← 返回总览</Link>
        </div>

        {forbidden && <p className="mt-6 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">需要管理员权限。</p>}
        {loading && <p className="mt-6 text-slate-500">加载中…</p>}

        {!loading && !forbidden && (
          <>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="按邮箱搜索…"
              className="mt-6 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3">邮箱</th>
                    <th className="px-4 py-3">套餐</th>
                    <th className="px-4 py-3">角色</th>
                    <th className="px-4 py-3">注册时间</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">无用户</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-900">{u.email}</td>
                      <td className="px-4 py-3 text-slate-600">{u.plan}</td>
                      <td className="px-4 py-3 text-slate-600">{u.role}</td>
                      <td className="px-4 py-3 text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
