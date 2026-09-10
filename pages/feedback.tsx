import Head from "next/head";
import Layout from "../components/Layout";
import FeedbackForm from "../components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <Layout title="反馈">
      <Head>
        <title>反馈 · GotoDeck</title>
        <meta name="description" content="向我们提交反馈、建议或问题" />
      </Head>
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">提交反馈</h1>
        <p className="mt-2 text-slate-600">你的建议会直接发送到团队邮箱，帮助我们把产品做得更好。</p>
        <div className="mt-6">
          <FeedbackForm />
        </div>
      </div>
    </Layout>
  );
}
