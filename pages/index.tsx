import type { GetServerSideProps } from "next";

/**
 * 营销首页复用 deliverables/gstack/site/index.html（已复制到 public/index.html）。
 * 此处仅做服务端重定向，零转换风险，100% 复用现有资产。
 * 后续如需把营销页迁入 TSX，可在此渲染 pages 并保留设计 token。
 */
export default function Home() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { destination: "/index.html", permanent: false } };
};
