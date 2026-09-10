import Head from 'next/head'

export default function Page() {
  return (
    <>
      <Head>
        <title>GotoDeck — Use cases</title>
        <meta name="description" content="How indie founders, agencies, and SMB growth teams use GotoDeck to go global with a single growth console." />
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-slate-900">GotoDeck</a>
            <nav className="hidden md:flex gap-6 text-sm font-semibold text-slate-500">
              <a href="/features" className="hover:text-slate-900">Features</a>
              <a href="/pricing" className="hover:text-slate-900">Pricing</a>
              <a href="/product" className="hover:text-slate-900">Product</a>
              <a href="/login" className="hover:text-slate-900">Login</a>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold text-slate-900">Use cases</h1>
          <p className="mt-3 text-slate-600">GotoDeck is built for teams that need a growth console without the overhead of a BI platform.</p>

          <div className="mt-10 space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Indie founders</h2>
              <p className="mt-3 text-sm text-slate-600">
                Solo bootstrappers use GotoDeck to replace three or four dashboards — Stripe, Plausible, App Store Connect, Google Analytics — with a single console that shows revenue, traction, and funnel health at a glance.
              </p>
              <ul className="mt-4 text-sm text-slate-600 list-disc pl-6 space-y-1">
                <li>Validate a new country without spinning up a new Stripe account or hiring an analyst.</li>
                <li>Track MRR, new logos, and refund rates across iOS, Android, and the web in one view.</li>
                <li>Get weekly digests in plain English — no SQL required.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Agencies & studios</h2>
              <p className="mt-3 text-sm text-slate-600">
                Agencies managing 5–50 client accounts use GotoDeck to deliver transparent reporting without building a custom data stack for each engagement.
              </p>
              <ul className="mt-4 text-sm text-slate-600 list-disc pl-6 space-y-1">
                <li>Provision client workspaces with role-based access in under two minutes.</li>
                <li>White-label dashboards and schedule branded PDF reports to stakeholders automatically.</li>
                <li>Share webhook outputs directly into the client's Slack or Teams channel.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">SMB growth teams</h2>
              <p className="mt-3 text-sm text-slate-600">
                Growth, finance, and ops leaders at venture-backed or profitable SMBs use GotoDeck to align on the same numbers across time zones and tools.
              </p>
              <ul className="mt-4 text-sm text-slate-600 list-disc pl-6 space-y-1">
                <li>Run cohort, retention, and geographic segmentation without relying on engineering.</li>
                <li>Forecast cash flow for multi-country expansion using the built-in scenario modeller.</li>
                <li>Integrate GotoDeck API calls into internal tools and existing data warehouses.</li>
              </ul>
            </section>
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-wrap gap-6">
            <a href="/features" className="hover:text-slate-900">Features</a>
            <a href="/pricing" className="hover:text-slate-900">Pricing</a>
            <a href="/product" className="hover:text-slate-900">Product</a>
            <a href="/how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="/security" className="hover:text-slate-900">Security</a>
            <a href="/integrations" className="hover:text-slate-900">Integrations</a>
            <a href="/login" className="hover:text-slate-900">Login</a>
          </div>
        </footer>
      </div>
    </>
  )
}
