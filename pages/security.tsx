import Head from 'next/head'

export default function Page() {
  return (
    <>
      <Head>
        <title>GotoDeck — Security & Compliance</title>
        <meta name="description" content="GotoDeck security posture: GDPR, VAT, PCI-DSS, SOC 2, and data-residency commitments for cross-border SaaS teams." />
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
          <h1 className="text-3xl font-bold text-slate-900">Security & Compliance</h1>
          <p className="mt-3 text-slate-600">GotoDeck is designed for teams selling across jurisdictions without breaking the rules. Here is what we stand behind.</p>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Data protection</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong className="text-slate-900">GDPR.</strong> GotoDeck processes personal data only as your processor or on your behalf as controller. We provide a Data Processing Addendum (DPA) on request and support data export, correction, and erasure workflows.</li>
              <li><strong className="text-slate-900">Encryption at rest & in transit.</strong> All production data is encrypted with AES-256 at rest. Transport is enforced over TLS 1.2+ with HSTS preload.</li>
              <li><strong className="text-slate-900">Access control.</strong> Role-based access control (RBAC) with SSO via SAML and Google Workspace. Audit logs are retained for 90 days on all paid plans.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Payments & tax</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong className="text-slate-900">PCI-DSS Level 1.</strong> We do not store or transmit card data. All payments are handled by Stripe, a PCI-DSS Level 1 Service Provider.</li>
              <li><strong className="text-slate-900">VAT & sales tax.</strong> GotoDeck is registered for VAT in the EU (VIES-validated) and collects VAT on applicable digital-service sales. US customers are not charged sales tax at this time.</li>
              <li><strong className="text-slate-900">Invoicing.</strong> Every transaction produces a machine-readable invoice with VAT ID breakdown where required. Export to PDF or download the invoice pack from your billing page.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Operational security</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong className="text-slate-900">SOC 2 Type II.</strong> Annual third-party audit covering security, availability, and confidentiality trust services criteria. The current report is available to enterprise customers under NDA.</li>
              <li><strong className="text-slate-900">Data residency.</strong> Production infrastructure runs on AWS Frankfurt (eu-central-1). Enterprise customers can request a US or APAC region on dedicated plans.</li>
              <li><strong className="text-slate-900">Incident response.</strong> A 24/7 incident-response playbook is maintained. All Severity 1 incidents are disclosed within 72 hours to affected customers and regulators as required.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Responsible disclosure</h2>
            <p className="mt-3 text-sm text-slate-600">
              If you discover a security issue in GotoDeck, please report it to <a className="text-indigo-600 hover:underline" href="mailto:security@gstack.io">security@gstack.io</a>. We acknowledge every report within 48 hours and aim to ship a fix or mitigation within 14 days for validated issues.
            </p>
          </section>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-wrap gap-6">
            <a href="/features" className="hover:text-slate-900">Features</a>
            <a href="/pricing" className="hover:text-slate-900">Pricing</a>
            <a href="/product" className="hover:text-slate-900">Product</a>
            <a href="/how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="/use-cases" className="hover:text-slate-900">Use cases</a>
            <a href="/integrations" className="hover:text-slate-900">Integrations</a>
            <a href="/login" className="hover:text-slate-900">Login</a>
          </div>
        </footer>
      </div>
    </>
  )
}
