import type { AppProps } from "next/app";
import Head from 'next/head';
import Script from 'next/script';
import "@/styles/globals.css";
import ChatWidget from "@/components/ChatWidget";
import { SUPPORT } from "@/lib/support.config";

const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_ID
const UMAMI_URL = (process.env.NEXT_PUBLIC_UMAMI_URL || 'https://analytics.umami.is').replace(/\/$/, '')

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{SUPPORT.productName}</title>
      </Head>
      {UMAMI_ID && (
        <Script
          async
          src={`${UMAMI_URL}/script.js`}
          data-website-id={UMAMI_ID}
          strategy="afterInteractive"
        />
      )}
      <Component {...pageProps} />
      <ChatWidget
        productName={SUPPORT.productName}
        brandColor={SUPPORT.brandColor}
        sessionKeyPrefix={SUPPORT.productSlug}
      />
    </>
  );
}
