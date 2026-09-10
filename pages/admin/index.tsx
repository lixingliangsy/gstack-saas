import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";

type Metrics = {
  users: { total: number; byPlan: Record<string, number>; byRole: Record<string, number> };
  subscriptions: { total: number; byPlan: Record<string, number> };
  feedback: { total: number; byCategory: Record<string, number>; byStatus: Record<string, number> };
  runs: { total: number };
  chats: { sessions: number; turns: number };
};

function Card({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function Dist({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      <ul className="mt-3 space-y-2">
        {entries.length === 0 && <li className="text-sm text-slate-400">无数据</li>}
        {entries.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{k}</span>
            <span className="font-medium text-slate-900">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminIndex() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => (r.ok ? r.json() : (setForbidden(true), null)))
      .then((d) => d?.metrics && setM(d.metrics))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="后台总览">
      <Head><title>后台总览 · GotoDeck</title></Head>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">后台总览</h1>
          <div className="flex gap-2 text-sm">
            <Link href="/admin/users" className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">用户</Link>
            <Link href="/admin/feedback" className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">反馈</Link>
            <Link href="/admin/analytics" className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">看板</Link>
          </div>
        </div>

        {forbidden && <p className="mt-6 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">需要管理员权限。</p>}
        {loading && <p className="mt-6 text-slate-500">加载中…</p>}

        {m && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              <Card label="注册用户" value={m.users.total} hint={`管理员 ${m.users.byRole.admin || 0}`} />
              <Card label="合规扫描运行" value={m.runs.total} />
              <Card label="用户反馈" value={m.feedback.total} hint={`待处理 ${m.feedback.byStatus.received || 0}`} />
              <Card label="客服会话" value={m.chats.sessions} hint={`累计 ${m.chats.turns} 轮`} />
              <Card label="订阅事件" value={m.subscriptions.total} />
              <Card label="Pro/企业用户" value={(m.users.byPlan.pro || 0) + (m.users.byPlan.enterprise || 0)} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Dist title="用户套餐分布" data={m.users.byPlan} />
              <Dist title="反馈分类分布" data={m.feedback.byCategory} />
              <Dist title="反馈状态分布" data={m.feedback.byStatus} />
              <Dist title="订阅档位分布" data={m.subscriptions.byPlan} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
