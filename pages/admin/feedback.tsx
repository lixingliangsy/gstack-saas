import { useEffect, useState } from "react";
import Head from "next/head";
import Layout from "../../components/Layout";

type Fb = {
  id: string;
  category: string;
  body: string;
  email?: string;
  attachmentName?: string;
  status: string;
  createdAt?: string;
};

const STATUS_LABEL: Record<string, string> = {
  received: "已收到",
  emailed: "已邮件",
  queued: "待重发",
  failed: "失败",
};

export default function AdminFeedback() {
  const [items, setItems] = useState<Fb[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then((r) => (r.ok ? r.json() : (setForbidden(true), null)))
      .then((d) => d?.items && setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="反馈管理">
      <Head><title>反馈管理 · GStack</title></Head>
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">用户反馈</h1>
        {forbidden && <p className="mt-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">需要管理员权限。</p>}
        {loading && <p className="mt-4 text-slate-500">加载中…</p>}
        {!loading && !forbidden && items.length === 0 && <p className="mt-4 text-slate-500">暂无反馈。</p>}
        <ul className="mt-6 space-y-3">
          {items.map((f) => (
            <li key={f.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">{f.category}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{STATUS_LABEL[f.status] || f.status}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{f.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                {f.email || "匿名"} · {f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}
                {f.attachmentName ? ` · 附件: ${f.attachmentName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
