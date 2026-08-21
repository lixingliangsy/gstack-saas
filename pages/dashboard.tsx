import Head from "next/head";
import Layout from "../components/Layout";
import Tool from "../components/Tool";
import { PRODUCT } from "../lib/product";

export default function Dashboard() {
  return (
    <Layout title={`${PRODUCT.name} · 控制台`}>
      <Head>
        <title>{`${PRODUCT.name} · 出海合规扫描`}</title>
        <meta name="description" content="出海合规 / 市场准入扫描控制台" />
      </Head>
      <Tool />
    </Layout>
  );
}
