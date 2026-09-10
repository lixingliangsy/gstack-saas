import Head from 'next/head'

export default function Page() {
  return (
    <>
      <Head>
        <title>GStack — How it works</title>
        <meta name="description" content="GStack turns your growth data into actionable go-to-market decisions in three steps." />
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-slate-900">GStack</a>
            <nav className="hidden md:flex gap-6 text-sm font-semibold text-slate-500">
              <a href="/features" className="hover:text-slate-900">Features</a>
              <a href="/pricing" className="hover:text-slate-900">Pricing</a>
              <a href="/product" className="hover:text-slate-900">Product</a>
              <a href="/login" className="hover:text-slate-900">Login</a>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold text-slate-900">How it works</h1>
          <p className="mt-3 text-slate-600">All-in-one growth console for going global — input your data, run the analysis, and act with confidence.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-bold text-indigo-600">Step 1</div>
              <h3 className="mt-1 font-semibold text-slate-900">Input</h3>
              <p className="mt-2 text-sm text-slate-600">Connect your traffic, revenue, and product data sources — or paste them in directly. GStack ingests Shopify, Stripe, Plausible, PostHog, and any REST/JSON feed.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-bold text-indigo-600">Step 2</div>
              <h3 className="mt-1 font-semibold text-slate-900">Run</h3>
              <p className="mt-2 text-sm text-slate-600">GStack normalises your metrics, segments channels by geography, and surfaces the signals that matter — from CAC payback to LTV cohorts.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-bold text-indigo-600">Step 3</div>
              <h3 className="mt-1 font-semibold text-slate-900">Act</h3>
              <p className="mt-2 text-sm text-slate-600">Export dashboards, schedule reports, or send webhooks to Slack and Zapier — so every stakeholder sees the same numbers in real time.</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">Free tier includes up to 3 data sources and 10k monthly events. No credit card required.</p>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-wrap gap-6">
            <a href="/features" className="hover:text-slate-900">Features</a>
            <a href="/pricing" className="hover:text-slate-900">Pricing</a>
            <a href="/product" className="hover:text-slate-900">Product</a>
            <a href="/security" className="hover:text-slate-900">Security</a>
            <a href="/use-cases" className="hover:text-slate-900">Use cases</a>
            <a href="/integrations" className="hover:text-slate-900">Integrations</a>
            <a href="/login" className="hover:text-slate-900">Login</a>
          </div>
        </footer>
      </div>
    </>
  )
}
