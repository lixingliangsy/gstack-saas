/**
 * lib/byok.ts —— 企业自带密钥（Bring Your Own Key，server-only）
 * 仅 Enterprise 用户可设置；密钥经 lib/store.ts 持久化，绝不出现在客户端包。
 */
import { getStore, uid, type Entity } from "./store";

export interface ByokRecord extends Entity {
  id: string;
  slug: string;
  userId: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  updatedAt?: string;
}

const COLL = "byok";

export async function getByokKey(slug: string, userId?: string): Promise<string | null> {
  const rec = await getStore().findBy<ByokRecord>(COLL, (r) => r.slug === slug && (!userId || r.userId === userId));
  return rec?.apiKey || null;
}

export async function setByokKey(
  slug: string,
  userId: string,
  apiKey: string,
  opts: { baseUrl?: string; model?: string } = {}
): Promise<void> {
  const existing = await getStore().findBy<ByokRecord>(COLL, (r) => r.slug === slug && r.userId === userId);
  if (existing) {
    await getStore().update<ByokRecord>(COLL, existing.id, {
      apiKey,
      baseUrl: opts.baseUrl,
      model: opts.model,
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  const rec: ByokRecord = {
    id: uid("byok"),
    slug,
    userId,
    apiKey,
    baseUrl: opts.baseUrl,
    model: opts.model,
    updatedAt: new Date().toISOString(),
  };
  await getStore().insert<ByokRecord>(COLL, rec);
}

export async function clearByokKey(slug: string, userId: string): Promise<void> {
  const rec = await getStore().findBy<ByokRecord>(COLL, (r) => r.slug === slug && r.userId === userId);
  if (rec) await getStore().remove(COLL, rec.id);
}
