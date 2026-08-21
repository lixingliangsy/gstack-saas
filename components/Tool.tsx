"use client";

import { useState } from "react";
import { PRODUCT, type ProductInput } from "../lib/product";

type StepInfo = { id: string; label: string };

export default function Tool() {
  const inputs: ProductInput[] = PRODUCT.inputs || [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [useMock, setUseMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [ruleHits, setRuleHits] = useState<Array<{ id: string; title: string; severity: string }>>([]);

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: values, useMock }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError({ message: json.error || "请求失败", code: json.code });
        return;
      }
      setDemo(!!json.demo);
      setResult(json.result || "");
      setRuleHits(Array.isArray(json.ruleHits) ? json.ruleHits : []);
    } catch (e: any) {
      setError({ message: e?.message || "网络错误" });
    } finally {
      setLoading(false);
    }
  }

  const steps: StepInfo[] = [
    { id: "intake", label: "采集信息" },
    { id: "classify", label: "识别监管" },
    { id: "assess", label: "映射义务" },
    { id: "report", label: "生成报告" },
  ];

  return (
    <section aria-labelledby="tool-title" className="mx-auto w-full max-w-3xl px-4 py-10">
      <h2 id="tool-title" className="text-2xl font-bold text-slate-900">
        出海合规 / 市场准入扫描
      </h2>
      <p className="mt-2 text-slate-600">
        填写你的产品与目标市场，自动生成 GDPR / VAT / 消费者保护 / 应用商店 / 支付监管的就绪度报告。
      </p>

      <form
        className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        {inputs.map((f) => (
          <div key={f.key}>
            <label htmlFor={f.key} className="block text-sm font-medium text-slate-700">
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={f.key}
                name={f.key}
                rows={3}
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            ) : f.type === "select" ? (
              <select
                id={f.key}
                name={f.key}
                value={values[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                <option value="">— 选择 —</option>
                {(f.options || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={f.key}
                name={f.key}
                type="text"
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            )}
          </div>
        ))}

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={useMock}
            onChange={(e) => setUseMock(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          演示模式（不调用模型，仅看规则引擎效果）
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "扫描中…" : "开始扫描"}
        </button>
      </form>

      {/* 进度指示（装饰性，模型调用时展示四步） */}
      <ol className="mt-6 flex flex-wrap gap-2" aria-hidden="true">
        {steps.map((s) => (
          <li key={s.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {s.label}
          </li>
        ))}
      </ol>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-800"
        >
          <strong className="font-semibold">{error.code ? `[${error.code}] ` : ""}出错了：</strong>
          {error.message}
          {error.code === "AI_NOT_CONFIGURED" && " 可勾选「演示模式」查看规则引擎效果。"}
          {error.code === "QUOTA_EXCEEDED" && " 公平额度已用尽，请升级套餐。"}
        </div>
      )}

      {result && (
        <div className="mt-6">
          {demo && (
            <p className="mb-2 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              演示模式 · 仅规则引擎，未调用模型
            </p>
          )}
          {ruleHits.length > 0 && (
            <ul className="mb-4 space-y-2">
              {ruleHits.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span
                    className={
                      "inline-block h-2 w-2 rounded-full " +
                      (h.severity === "high" ? "bg-red-500" : h.severity === "medium" ? "bg-orange-500" : "bg-yellow-400")
                    }
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs text-slate-500">{h.id}</span>
                  <span className="text-slate-800">{h.title}</span>
                </li>
              ))}
            </ul>
          )}
          <pre
            aria-live="polite"
            className="measure overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-900 p-5 text-sm leading-relaxed text-slate-100"
          >
            {result}
          </pre>
        </div>
      )}
    </section>
  );
}
