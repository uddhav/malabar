/**
 * Home Page / Landing Page
 * Introduction to Malabar Finance with link to dashboard
 */

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Malabar Finance
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Your Credit Card
            <br />
            Billing Cycles
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Track billing cycles by actual statement dates, optimize rewards,
            and automate tax deductions—all in one place.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            View Dashboard
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Billing Cycle Tracking
            </h3>
            <p className="text-gray-600">
              Track by actual billing cycle dates, not calendar months. Know
              exactly when statements close and payments are due.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Pattern-based cycle detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                6-month future projections
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Confidence scoring
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Rewards Optimization
            </h3>
            <p className="text-gray-600">
              Get real-time recommendations for which card to use to maximize
              rewards at each merchant.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Category bonus tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Rotating category alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">→</span>
                Spending cap monitoring
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Tax Deduction Automation
            </h3>
            <p className="text-gray-600">
              ML-driven categorization of business expenses with 83-96%
              accuracy, maintaining IRS compliance.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-purple-600">→</span>
                Automatic transaction categorization
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">→</span>
                Human-in-the-loop validation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">→</span>
                IRS Schedule C export
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Highlights */}
        <div className="mt-20 bg-white rounded-xl p-8 shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Built with Modern Technology
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <TechCard title="Next.js 15" description="App Router with React Server Components" />
            <TechCard title="Plaid API" description="Secure bank connection & enrichment" />
            <TechCard title="PostgreSQL" description="Reliable data storage with Prisma ORM" />
            <TechCard title="TypeScript" description="Type-safe development" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start tracking your billing cycles today
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-gray-600 text-sm">
          <p>
            Malabar Finance MVP • Built with Next.js, TypeScript, and Plaid API
          </p>
          <p className="mt-2">
            Phase 1: Core Infrastructure Complete
          </p>
        </footer>
      </main>
    </div>
  )
}

function TechCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
