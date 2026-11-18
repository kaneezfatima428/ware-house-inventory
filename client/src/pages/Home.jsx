import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  PackageCheck,
  ShieldCheck,
  Warehouse
} from 'lucide-react';

const features = [
  {
    icon: Boxes,
    title: 'Inventory in one place',
    description: 'Keep product and stock information organized and easy to find.'
  },
  {
    icon: Warehouse,
    title: 'Warehouse operations',
    description: 'Manage warehouse activity, stock movements, and supply requests.'
  },
  {
    icon: BarChart3,
    title: 'Clear order tracking',
    description: 'Follow orders and transactions across your day-to-day operations.'
  }
];

const Home = () => (
  <div className="min-h-screen bg-slate-950 text-white">
    <header className="border-b border-white/10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-3" aria-label="WareFlow home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <Boxes className="h-6 w-6" />
          </span>
          <span className="text-lg font-bold tracking-tight">WareFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>

    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2">
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
              <ShieldCheck className="h-4 w-4" />
              One workspace for your operations
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Keep your inventory moving.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              WareFlow brings products, warehouses, stock activity, and orders together in one
              straightforward workspace for your team.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400"
              >
                Create an account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-sm font-semibold text-white">Operations overview</p>
                <p className="mt-1 text-xs text-slate-400">A clearer view of daily work</p>
              </div>
              <span className="rounded-xl bg-indigo-400/10 p-3 text-indigo-300">
                <PackageCheck className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                ['Product catalog', 'Products organized'],
                ['Stock movements', 'Activity recorded'],
                ['Supply requests', 'Requests coordinated'],
                ['Order tracking', 'Orders followed']
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="mt-2 text-xs text-slate-400">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-indigo-500/10 p-4 text-sm text-indigo-100">
              <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-300" />
              Role-based workspaces for admins, managers, suppliers, and sales teams.
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Built for your workflow
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              The essentials, all connected.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <span className="inline-flex rounded-xl bg-indigo-400/10 p-3 text-indigo-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>

    <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-500">
      WareFlow Inventory &amp; Warehouse Platform
    </footer>
  </div>
);

export default Home;
