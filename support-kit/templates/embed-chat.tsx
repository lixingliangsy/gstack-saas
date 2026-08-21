/**
 * embed/chat.tsx 模板 —— 跨站嵌入宿主页
 */
import ChatWidget from "../../components/ChatWidget";
import { SUPPORT } from "../../lib/support.config";

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
