import type { AppProps } from "next/app";
import "@/styles/globals.css";
import ChatWidget from "@/components/ChatWidget";
import { SUPPORT } from "@/lib/support.config";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <ChatWidget
        productName={SUPPORT.productName}
        brandColor={SUPPORT.brandColor}
        sessionKeyPrefix={SUPPORT.productSlug}
      />
    </>
  );
}
