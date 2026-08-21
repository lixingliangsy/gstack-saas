import type { NextApiRequest, NextApiResponse } from "next";
import { submitFeedback, dispatchEmail } from "../../lib/feedback";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { category, body, email, attachment } = req.body || {};
  try {
    const fb = submitFeedback({ category, body, email, attachment });
    // 后台异步发送（不阻塞响应）；失败自动重试并入队
    dispatchEmail(fb).catch((e) => console.error("[feedback] dispatch error:", e?.message));
    return res.status(201).json({ ok: true, id: fb.id, emailStatus: fb.status });
  } catch (e: any) {
    const map: Record<string, [number, string]> = {
      BODY_TOO_SHORT: [400, "反馈内容至少 5 字"],
      BODY_TOO_LONG: [400, "反馈内容过长（上限 5000 字）"],
    };
    const [status, message] = map[e?.message] || [500, "提交失败"];
    return res.status(status).json({ error: message, code: e?.message });
  }
}
