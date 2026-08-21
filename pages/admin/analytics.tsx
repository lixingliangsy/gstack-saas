import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";

type Metrics = {
  users: { total: number; byPlan: Record<string, number> };
  feedback: { total: number; byCategory: Record<string, number> };
  runs: { total: number };
  chats: { sessions: number; turns: number };
  subscriptions: { total: number; byPlan: Record<string, number> };
};

const UMAMI_SHARE_URL = process.env.NEXT_PUBLIC_UMAMI_SHARE_URL || "";

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span className="font-medium text-slate-900">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "#2563EB" }} />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
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
    <Layout title="数据看板">
      <Head><title>数据看板 · GStack</title></Head>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">数据看板</h1>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">← 返回总览</Link>
        </div>

        {forbidden && <p className="mt-6 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">需要管理员权限。</p>}
        {loading && <p className="mt-6 text-slate-500">加载中…</p>}

        {m && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-medium text-slate-700">套餐分布</h3>
              <div className="mt-3">
                {Object.entries(m.users.byPlan).map(([k, v]) => (
                  <Bar key={k} label={k} value={v} total={m.users.total} />
                ))}
                {m.users.total === 0 && <p className="text-sm text-slate-400">暂无用户</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-medium text-slate-700">反馈分类分布</h3>
              <div className="mt-3">
                {Object.entries(m.feedback.byCategory).map(([k, v]) => (
                  <Bar key={k} label={k} value={v} total={m.feedback.total} />
                ))}
                {m.feedback.total === 0 && <p className="text-sm text-slate-400">暂无反馈</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-medium text-slate-700">核心指标</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-slate-600">合规扫描运行</span><span className="font-medium">{m.runs.total}</span></li>
                <li className="flex justify-between"><span className="text-slate-600">客服会话 / 轮次</span><span className="font-medium">{m.chats.sessions} / {m.chats.turns}</span></li>
                <li className="flex justify-between"><span className="text-slate-600">订阅事件</span><span className="font-medium">{m.subscriptions.total}</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-medium text-slate-700">网站流量（Umami）</h3>
              {UMAMI_SHARE_URL ? (
                <iframe
                  src={UMAMI_SHARE_URL}
                  title="Umami 看板"
                  className="mt-3 h-72 w-full rounded-lg border border-slate-100"
                />
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  未配置 Umami 共享看板。设置 <code>NEXT_PUBLIC_UMAMI_SHARE_URL</code> 后此处嵌入实时流量。
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
