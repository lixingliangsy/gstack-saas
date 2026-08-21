/**
 * pages/embed/chat.tsx —— 客服组件的全屏宿主页（供 public/widget.js 的 iframe 加载）
 * 跨站嵌入时通过 iframe 隔离，API 调用同源（gstack 域名），规避 CORS。
 */
import ChatWidget from "@/components/ChatWidget";
import { SUPPORT } from "@/lib/support.config";

export default function EmbedChat() {
  return (
    <div style={{ height: "100vh", width: "100vw", background: "#f1f5f9" }}>
      <ChatWidget
        embed
        productName={SUPPORT.productName}
        brandColor={SUPPORT.brandColor}
        sessionKeyPrefix={SUPPORT.productSlug}
      />
    </div>
  );
}
