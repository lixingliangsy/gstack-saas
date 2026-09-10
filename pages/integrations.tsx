import Head from 'next/head'

export default function Page() {
  return (
    <>
      <Head>
        <title>GStack — Integrations & API</title>
        <meta name="description" content="GStack integrations, export targets, REST API, and webhook documentation for growth teams going global." />
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
          <h1 className="text-3xl font-bold text-slate-900">Integrations & API</h1>
          <p className="mt-3 text-slate-600">Connect your stack, export anywhere, or automate with webhooks — GStack speaks the tools you already use.</p>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Native integrations</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
              <li className="rounded-lg border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-900">Stripe</span> — MRR, churn, refunds, tax
              </li>
              <li className="rounded-lg border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-900">Shopify</span> — Orders, AOV, product catalog
              </li>
              <li className="rounded-lg border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-900">Plausible / GA4</span> — Sessions, traffic sources, UTMs
              </li>
              <li className="rounded-lg border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-900">PostHog</span> — Events, funnels, feature flags
              </li>
              <li className="rounded-lg border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-900">App Store Connect</span> — Sales, reviews, territories
              </li>
              <li className="rounded-lg border border-slate-200 bg-white p-4">
                <span className="font-semibold text-slate-900">Google Play Console</span> — Installs, ratings, revenue
              </li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Export targets</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 list-disc pl-6">
              <li><strong className="text-slate-900">CSV / JSON</strong> — Every view can be exported as a flat file with one click.</li>
              <li><strong className="text-slate-900">PDF reports</strong> — White-labelled, scheduled to email stakeholders.</li>
              <li><strong className="text-slate-900">Slack & Teams</strong> — Daily or weekly digest posts to any channel.</li>
              <li><strong className="text-slate-900">Zapier / Make (Integromat)</strong> — Trigger actions when thresholds or anomalies fire.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">REST API</h2>
            <p className="mt-3 text-sm text-slate-600">
              The GStack REST API is RESTful, rate-limited, and authenticated with bearer tokens generated from your workspace settings.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 list-disc pl-6">
              <li>Base URL: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">https://api.gstack.io/v1</code></li>
              <li>Endpoints for metrics, segments, reports, and webhooks.</li>
              <li>Schema documented via OpenAPI 3.0 — import into Postman or Insomnia with a single click.</li>
              <li>Sandbox mode is available on every plan, so you can integrate before going live.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Webhooks</h2>
            <p className="mt-3 text-sm text-slate-600">
              Subscribe to metric changes, anomaly alerts, or scheduled reports. Payloads are signed with HMAC-SHA256 and delivered with at-least-once semantics.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 list-disc pl-6">
              <li>Custom webhook URL per workspace or per event type.</li>
              <li>Delivery retries with exponential backoff (up to 7 days).</li>
              <li>Event log and replay available from the dashboard.</li>
            </ul>
          </section>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-wrap gap-6">
            <a href="/features" className="hover:text-slate-900">Features</a>
            <a href="/pricing" className="hover:text-slate-900">Pricing</a>
            <a href="/product" className="hover:text-slate-900">Product</a>
            <a href="/how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="/security" className="hover:text-slate-900">Security</a>
            <a href="/use-cases" className="hover:text-slate-900">Use cases</a>
            <a href="/login" className="hover:text-slate-900">Login</a>
          </div>
        </footer>
      </div>
    </>
  )
}
