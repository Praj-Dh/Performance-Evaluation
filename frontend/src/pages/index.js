import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        setLoggedIn(res.ok);
      } catch {
        setLoggedIn(false);
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <title>Performance Platform — Equity through Accountability</title>
        <meta name="description" content="Give every employee a voice and an objective framework for transparent, equitable, and effective performance management." />
      </Head>

      <div className="landing">
        {/* Header */}
        <header className="landing-header">
          <div className="landing-header-inner">
            <Link href="/dashboard" className="landing-logo">
              <span className="landing-logo-text">Performance Platform</span>
            </Link>
            <nav className={`landing-nav ${navOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
              <a href="#features" onClick={() => setNavOpen(false)}>Product</a>
              <a href="#philosophy" onClick={() => setNavOpen(false)}>How it works</a>
              <a href="#problems" onClick={() => setNavOpen(false)}>Problems we solve</a>
              <a href="#cta" onClick={() => setNavOpen(false)}>Outcomes</a>
            </nav>
            <div className="landing-header-actions">
              {loggedIn ? (
                <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
              ) : (
                <Link href="/login" className="btn btn-primary">Sign In</Link>
              )}
            </div>
            <button
              type="button"
              className={`landing-menu-toggle ${navOpen ? 'is-open' : ''}`}
              aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setNavOpen(!navOpen)}
            >
              <span />
              <span />
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-hero-content">
              <p className="landing-tag">Enterprise performance accountability</p>
              <h1 className="landing-hero-title">
                Data-driven
                <br />
                <strong className="landing-hero-accent">performance decisions</strong>
              </h1>
              <p className="landing-hero-desc">
                Replace memory-based reviews and gut feel with a continuous, evidence-backed view of how people really contribute across the entire review period.
              </p>
              <div className="landing-hero-buttons">
                <Link href="/login" className="btn btn-primary btn-lg">Sign In</Link>
                <a href="#features" className="btn btn-secondary btn-lg">Watch Demo</a>
              </div>
              <div className="landing-stats">
                <span className="landing-stat"><CheckIcon /> 5k+ users</span>
                <span className="landing-stat"><CheckIcon /> 99% satisfaction</span>
                <span className="landing-stat"><CheckIcon /> 360° feedback</span>
              </div>
            </div>
            <div className="landing-hero-visual">
              <div className="landing-dashboard-mock" aria-hidden="true">
                <div className="mock-row">
                  <span className="mock-label">Objective score</span>
                  <span className="mock-metric">4.6 / 5</span>
                </div>
                <div className="mock-bar" />
                <div className="mock-row">
                  <span className="mock-label">Collaboration & support</span>
                  <span className="mock-metric">Top 10%</span>
                </div>
                <div className="mock-bar" />
                <div className="mock-row">
                  <span className="mock-label">Reliability</span>
                  <span className="mock-metric">98% on‑time</span>
                </div>
                <div className="mock-bar" />
                <div className="mock-row">
                  <span className="mock-label">PR quality</span>
                  <span className="mock-metric">Low rework</span>
                </div>
                <div className="mock-bar" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="landing-section">
          <div className="landing-section-inner">
            <p className="landing-section-tag">What the platform does</p>
            <h2 className="landing-section-title">A single source of truth for performance</h2>
            <p className="landing-section-desc">
              PerformancePlatform brings together granular contribution data, rich qualitative context, and objective scoring so evaluations are fair, transparent, and defensible.
            </p>
            <div className="landing-cards">
              <div className="landing-card">
                <div className="landing-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <h3 className="landing-card-title">Granular contribution tracking</h3>
                <p className="landing-card-desc">
                  Pull requests, commits, issue closure rates, incidents, deployment and quality signals—captured continuously so reviews reflect the full period, not just the last sprint.
                </p>
              </div>
              <div className="landing-card">
                <div className="landing-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3 className="landing-card-title">360° feedback & recognition</h3>
                <p className="landing-card-desc">
                  Structured manager notes, peer feedback, and recognition points ensure collaboration, mentoring, and problem‑solving work are visible and credited.
                </p>
              </div>
              <div className="landing-card">
                <div className="landing-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <h3 className="landing-card-title">Objective evaluation engine</h3>
                <p className="landing-card-desc">
                  Customizable, weighted scoring models apply consistent rules to all data points, explicitly designed to mitigate recency bias and subjective distortion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section id="philosophy" className="landing-section landing-section-alt">
          <div className="landing-section-inner landing-section-split">
            <div className="landing-philosophy-content">
              <p className="landing-section-tag">Who it’s for</p>
              <h2 className="landing-section-title">Designed for modern, data‑minded organizations</h2>
              <p className="landing-philosophy-desc">
                Engineering leaders, HR and People teams, and functional managers use PerformancePlatform to move away from memory‑driven reviews toward always‑on, evidence‑based coaching.
              </p>
              <ul className="landing-list">
                <li><CheckIcon /> Engineering and product orgs that need defensible, data‑rich promotion and compensation decisions.</li>
                <li><CheckIcon /> HR teams looking to formalize performance frameworks without adding manual spreadsheets and one‑off docs.</li>
                <li><CheckIcon /> Individual contributors who want their collaboration, reliability, and problem‑solving work to be visible and rewarded.</li>
              </ul>
              <a href="#cta" className="landing-link">See how it fits your org</a>
            </div>
            <div className="landing-philosophy-visual">
              <div className="landing-trust-card">
                <CheckIcon />
                <span>Built on Trust</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problems */}
        <section id="problems" className="landing-section">
          <div className="landing-section-inner">
            <p className="landing-section-tag">Problems we solve</p>
            <h2 className="landing-section-title">From subjective reviews to accountable performance</h2>
            <div className="landing-cards">
              <div className="landing-card">
                <h3 className="landing-card-title">Inconsistent, memory‑based evaluations</h3>
                <p className="landing-card-desc">
                  Many organizations still rely on quarterly or annual reviews driven by whatever a manager remembers from recent work.
                  PerformancePlatform replaces this with time‑bounded, year‑round performance records so every decision is grounded in real data.
                </p>
              </div>
              <div className="landing-card">
                <h3 className="landing-card-title">Invisible contributions inside teams</h3>
                <p className="landing-card-desc">
                  Collaboration, mentoring, and problem‑solving often go unnoticed—especially in remote and hybrid teams.
                  Our platform systematically tracks task completion, collaboration events, and reliability metrics so impact is visible and measurable.
                </p>
              </div>
              <div className="landing-card">
                <h3 className="landing-card-title">Hard‑to‑justify people decisions</h3>
                <p className="landing-card-desc">
                  Promotions, demotions, and compensation changes are hard to defend without structured documentation.
                  PerformancePlatform generates clear scoring breakdowns and audit trails so HR and leadership can explain every decision with transparent, data‑driven evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="landing-section">
          <div className="landing-section-inner">
            <p className="landing-section-tag">What it looks like</p>
            <h2 className="landing-section-title">Preview the performance workspace</h2>
            <p className="landing-section-desc">
              High‑level scorecards, contribution timelines, and feedback streams give managers and ICs a shared, always‑on view of performance.
            </p>
            <div className="landing-gallery">
              <div className="landing-gallery-card">
                <div className="image-placeholder">
                  <span className="image-chip">Dashboard</span>
                </div>
                <h3>Scorecard overview</h3>
                <p>Weighted objective scores, trend lines, and historical context for each review period.</p>
              </div>
              <div className="landing-gallery-card">
                <div className="image-placeholder">
                  <span className="image-chip">Timeline</span>
                </div>
                <h3>Contribution timeline</h3>
                <p>Commits, pull requests, incidents, and tasks aligned on a single, filterable timeline.</p>
              </div>
              <div className="landing-gallery-card">
                <div className="image-placeholder">
                  <span className="image-chip">Feedback</span>
                </div>
                <h3>Feedback & recognition</h3>
                <p>360° feedback threads and recognition moments captured alongside the hard data.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="landing-section">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">Connect your existing tools</h2>
            <p className="landing-section-desc">Plug into where work already happens—no behavior change required.</p>
            <div className="landing-integrations">
              <span className="landing-integration-pill">
                <span className="integration-logo integration-logo--slack" aria-hidden="true" />
                <span>Slack</span>
              </span>
              <span className="landing-integration-pill">
                <span className="integration-logo integration-logo--jira" aria-hidden="true" />
                <span>Jira</span>
              </span>
              <span className="landing-integration-pill">
                <span className="integration-logo integration-logo--github" aria-hidden="true" />
                <span>GitHub</span>
              </span>
              <span className="landing-integration-pill">
                <span className="integration-logo integration-logo--figma" aria-hidden="true" />
                <span>Figma</span>
              </span>
              <span className="landing-integration-pill">
                <span className="integration-logo integration-logo--pagerduty" aria-hidden="true" />
                <span>PagerDuty</span>
              </span>
              <span className="landing-integration-pill">
                <span className="integration-logo integration-logo--salesforce" aria-hidden="true" />
                <span>Salesforce</span>
              </span>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="landing-section landing-section-alt">
          <div className="landing-section-inner landing-contact">
            <div className="landing-contact-copy">
              <p className="landing-section-tag">Contact us</p>
              <h2 className="landing-section-title">Talk to our team</h2>
              <p className="landing-section-desc">
                Share a bit about your organization and how you evaluate performance today.
                We’ll follow up with a short demo and a tailored rollout plan.
              </p>
              <ul className="landing-list">
                <li><CheckIcon /> Designed for teams of 25–5,000+ employees.</li>
                <li><CheckIcon /> Support for engineering, product, GTM, and operations functions.</li>
                <li><CheckIcon /> Rollout playbooks and sample performance frameworks included.</li>
              </ul>
            </div>
            <div className="landing-contact-form-card">
              <form className="landing-contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <label>
                    Full name
                    <input type="text" placeholder="Alex Rivera" />
                  </label>
                  <label>
                    Work email
                    <input type="email" placeholder="alex@company.com" />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Company
                    <input type="text" placeholder="Acme Inc." />
                  </label>
                  <label>
                    Team size
                    <select defaultValue="">
                      <option value="" disabled>Choose...</option>
                      <option value="1-25">1–25</option>
                      <option value="26-100">26–100</option>
                      <option value="101-500">101–500</option>
                      <option value="501+">501+</option>
                    </select>
                  </label>
                </div>
                <label className="form-full">
                  What would you like to improve?
                  <textarea rows={3} placeholder="For example: remove recency bias from engineering promotions." />
                </label>
                <button type="submit" className="btn btn-primary btn-lg form-submit">Request demo</button>
              </form>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="landing-cta">
          <div className="landing-cta-inner">
            <h2 className="landing-cta-title">Ready to transform your workforce?</h2>
            <p className="landing-cta-desc">Join other leading organizations seeing real results today.</p>
            <div className="landing-cta-buttons">
              <Link href="/login" className="btn btn-white">Get Started</Link>
              <a href="#features" className="btn btn-outline-white">Contact Sales</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <Link href="/dashboard" className="landing-footer-brand">
              <span className="landing-logo-icon">▣</span>
              <span className="landing-logo-text">Performance Platform</span>
              <p className="landing-footer-tagline">Equity through accountability.</p>
            </Link>
            <div className="landing-footer-links">
              <div className="landing-footer-col">
                <h4>Products</h4>
                <a href="#features">Features</a>
                <a href="#features">Pricing</a>
                <a href="#features">Security</a>
              </div>
              <div className="landing-footer-col">
                <h4>Company</h4>
                <a href="#philosophy">About Us</a>
                <a href="#cta">Contact</a>
              </div>
              <div className="landing-footer-col">
                <h4>Resources</h4>
                <a href="#testimonial">Blog</a>
                <a href="#testimonial">Support</a>
                <a href="#testimonial">Docs</a>
              </div>
              <div className="landing-footer-col landing-footer-newsletter">
                <h4>Newsletter</h4>
                <div className="landing-newsletter-form">
                  <input type="email" placeholder="Email address" aria-label="Email" />
                  <button type="button" className="btn btn-primary">Subscribe</button>
                </div>
              </div>
            </div>
            <div className="landing-footer-bottom">
              <span>© 2026 Performance Platform. All rights reserved.</span>
              <span>
                <a href="#">Terms of Service</a>
                <a href="#">Privacy Policy</a>
              </span>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: var(--color-surface);
        }
        .landing-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #ffffff;
          border-bottom: 1px solid var(--color-border);
          box-shadow: 0 1px 0 0 rgba(15, 23, 42, 0.03);
        }
        .landing-header-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 1rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }
        .landing-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: var(--color-text);
          font-weight: 600;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
          transition: color 0.2s ease;
        }
        .landing-logo:hover { color: var(--color-accent); text-decoration: none; }
        .landing-nav {
          display: flex;
          align-items: center;
          gap: 2.25rem;
        }
        .landing-nav a {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.9375rem;
          font-weight: 500;
          position: relative;
          padding: 0.25rem 0;
          transition: color 0.2s ease;
        }
        .landing-nav a::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: var(--color-accent);
          transform: scaleX(0);
          transition: transform 0.2s ease;
          border-radius: 1px;
        }
        .landing-nav a:hover { color: var(--color-accent); text-decoration: none; }
        .landing-nav a:hover::after { transform: scaleX(1); }
        .landing-header-actions { flex-shrink: 0; }
        .landing-menu-toggle {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid var(--color-border);
          background: #ffffff;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .landing-menu-toggle span {
          display: block;
          width: 18px;
          height: 2px;
          border-radius: 999px;
          background: var(--color-text);
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .landing-menu-toggle.is-open span:first-child {
          transform: translateY(2px) rotate(45deg);
        }
        .landing-menu-toggle.is-open span:last-child {
          transform: translateY(-2px) rotate(-45deg);
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.55rem 1.15rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .btn:hover { text-decoration: none; transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .btn-primary {
          background: var(--color-accent);
          color: #ffffff;
          border-color: var(--color-accent);
        }
        .btn-primary:hover {
          background: var(--color-accent-hover);
          border-color: var(--color-accent-hover);
          color: #ffffff;
        }
        .btn-secondary {
          background: #ffffff;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
        }
        .btn-secondary:hover {
          background: var(--color-surface-alt);
          color: var(--color-text);
          border-color: var(--color-border);
        }
        .btn-lg { padding: 0.8rem 1.75rem; font-size: 1rem; border-radius: 10px; }
        .btn-white {
          background: #ffffff;
          color: var(--color-accent);
          border-color: #ffffff;
        }
        .btn-white:hover {
          background: #f8fafc;
          color: var(--color-accent-hover);
        }
        .btn-outline-white {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.9);
        }
        .btn-outline-white:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-color: white;
        }
        @media (max-width: 900px) {
          .landing-header-inner {
            padding-inline: 1.25rem;
            gap: 1rem;
          }
          .landing-nav {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            padding: 0.75rem 1.25rem 1rem;
            background: #ffffff;
            border-bottom: 1px solid var(--color-border);
            box-shadow: 0 8px 20px -8px rgba(15, 23, 42, 0.18);
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.35rem;
            transform: translateY(-6px);
            opacity: 0;
            pointer-events: none;
            visibility: hidden;
          }
          .landing-nav.is-open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
          }
          .landing-nav a {
            font-size: 0.9rem;
          }
          .landing-header-actions {
            display: none;
          }
          .landing-menu-toggle {
            display: inline-flex;
          }
        }
        .landing-hero {
          padding: 4.5rem 1.75rem 4.5rem;
          background: linear-gradient(180deg, #f9fafb 0%, #eff6ff 100%);
          border-bottom: 1px solid var(--color-border-light);
          color: var(--color-text);
        }
        .landing-hero-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4.5rem;
          align-items: center;
        }
        @media (max-width: 900px) {
          .landing-hero-inner { grid-template-columns: 1fr; text-align: center; gap: 3rem; }
          .landing-hero-buttons { justify-content: center; }
          .landing-stats { justify-content: center; }
          .landing-hero { padding: 3.5rem 1.5rem 4.5rem; }
        }
        .landing-tag {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin: 0 0 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }
        .landing-hero-title {
          font-size: clamp(2.25rem, 4.5vw, 3.25rem);
          font-weight: 700;
          line-height: 1.15;
          color: var(--color-text);
          margin: 0 0 1.125rem;
          letter-spacing: -0.03em;
        }
        .landing-hero-accent {
          color: var(--color-accent);
          font-weight: 700;
        }
        .landing-hero-desc {
          font-size: 1.125rem;
          line-height: 1.65;
          color: var(--color-text-secondary);
          margin: 0 0 1.75rem;
          max-width: 520px;
        }
        @media (max-width: 900px) { .landing-hero-desc { margin-left: auto; margin-right: auto; } }
        .landing-hero-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2.25rem;
        }
        .landing-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
        }
        .landing-stat {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--color-success);
          font-weight: 500;
        }
        .landing-stat :global(svg) { flex-shrink: 0; filter: drop-shadow(0 1px 1px rgba(22, 163, 74, 0.3)); }
        .landing-hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 1rem;
        }
        .landing-dashboard-mock {
          width: 100%;
          max-width: 420px;
          border-radius: 14px;
          border: 1px solid var(--color-border);
          background: #ffffff;
          padding: 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .mock-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .mock-label {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
        .mock-bar {
          flex: 1;
          background: var(--color-accent-soft);
          border-radius: 999px;
          height: 6px;
        }
        .mock-metric {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }
        .landing-section {
          padding: 5rem 1.75rem;
        }
        .landing-section-alt {
          background: #f9fafb;
          border-top: 1px solid var(--color-border-light);
          border-bottom: 1px solid var(--color-border-light);
        }
        .landing-section-inner {
          max-width: 1180px;
          margin: 0 auto;
          text-align: center;
        }
        .landing-section-tag {
          font-size: 0.8125rem;
          color: var(--color-accent);
          font-weight: 700;
          margin: 0 0 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .landing-section-title {
          font-size: clamp(1.875rem, 3.2vw, 2.5rem);
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 0.875rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .landing-section-desc {
          font-size: 1.0625rem;
          color: var(--color-text-secondary);
          max-width: 580px;
          margin: 0 auto 3.5rem;
          line-height: 1.65;
        }
        .landing-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
          text-align: left;
        }
        @media (max-width: 768px) { .landing-cards { grid-template-columns: 1fr; } }
        .landing-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease;
        }
        .landing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
          border-color: var(--color-border);
        }
        .landing-card-icon {
          width: 40px;
          height: 40px;
          background: #eff6ff;
          color: var(--color-accent);
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .landing-card-icon svg { width: 26px; height: 26px; }
        .landing-card-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 0.5rem;
          letter-spacing: -0.01em;
        }
        .landing-card-desc {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.55;
          margin: 0;
        }
        .landing-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
          text-align: left;
        }
        @media (max-width: 900px) { .landing-gallery { grid-template-columns: 1fr; } }
        .landing-gallery-card {
          background: var(--color-surface);
          border-radius: 14px;
          border: 1px solid var(--color-border);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .landing-gallery-card h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--color-text);
        }
        .landing-gallery-card p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .image-placeholder {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          background: repeating-linear-gradient(
            135deg,
            #e5e7eb,
            #e5e7eb 8px,
            #f3f4f6 8px,
            #f3f4f6 16px
          );
          border: 1px solid var(--color-border);
          position: relative;
          overflow: hidden;
        }
        .image-chip {
          position: absolute;
          left: 0.9rem;
          top: 0.9rem;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.75);
          color: #f9fafb;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .landing-section-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          text-align: left;
        }
        @media (max-width: 900px) {
          .landing-section-split { grid-template-columns: 1fr; text-align: center; gap: 2.5rem; }
        }
        .landing-philosophy-desc {
          font-size: 1.0625rem;
          color: var(--color-text-secondary);
          line-height: 1.65;
          margin: 0 0 1.5rem;
        }
        .landing-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.25rem;
        }
        .landing-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          margin-bottom: 0.75rem;
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.45;
        }
        .landing-list li :global(svg) { color: var(--color-success); flex-shrink: 0; margin-top: 3px; }
        .landing-link {
          color: var(--color-accent);
          font-weight: 600;
          font-size: 0.9375rem;
          transition: color 0.2s ease;
        }
        .landing-link:hover { text-decoration: underline; color: var(--color-accent-hover); }
        .landing-philosophy-visual {
          min-height: 220px;
          border-radius: 14px;
          border: 1px dashed var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          font-size: 0.9rem;
          background: #ffffff;
        }
        .landing-trust-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 999px;
          border: 1px solid var(--color-border);
          background: #f9fafb;
          font-weight: 500;
        }
        .landing-trust-card :global(svg) { color: var(--color-success); }
        .landing-testimonial {
          background: #f8fafc;
          padding: 4.5rem 1.75rem;
        }
        .landing-testimonial-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .landing-quote-icon {
          font-size: 5rem;
          color: var(--color-accent-muted);
          line-height: 1;
          display: block;
          margin-bottom: -0.5rem;
          font-family: Georgia, serif;
        }
        .landing-quote {
          font-size: clamp(1.3rem, 2.2vw, 1.6rem);
          font-weight: 500;
          color: var(--color-text);
          line-height: 1.55;
          margin: 0 0 2rem;
          letter-spacing: -0.01em;
        }
        .landing-testimonial-author {
          display: flex;
          align-items: center;
          gap: 1.125rem;
          justify-content: center;
        }
        .landing-avatar {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid var(--color-border);
          background: #ffffff;
          color: var(--color-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .landing-testimonial-author strong { display: block; color: var(--color-text); font-size: 1rem; margin-bottom: 0.15rem; }
        .landing-testimonial-author span { font-size: 0.9rem; color: var(--color-text-muted); }
        .landing-integrations {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }
        .landing-integration-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 1.1rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          font-weight: 500;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
        }
        .landing-integration-pill:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
        }
        .integration-logo {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #e5e7eb;
          position: relative;
          overflow: hidden;
        }
        .integration-logo--slack {
          background: linear-gradient(135deg, #ec4899, #22c55e);
        }
        .integration-logo--jira {
          background: linear-gradient(135deg, #0ea5e9, #1d4ed8);
        }
        .integration-logo--github {
          border-radius: 999px;
          background: #111827;
        }
        .integration-logo--figma {
          background: radial-gradient(circle at 30% 30%, #ec4899 0, #ec4899 40%, transparent 41%),
                      radial-gradient(circle at 70% 30%, #22c55e 0, #22c55e 40%, transparent 41%),
                      radial-gradient(circle at 50% 70%, #6366f1 0, #6366f1 40%, transparent 41%);
        }
        .integration-logo--pagerduty {
          background: #16a34a;
        }
        .integration-logo--salesforce {
          border-radius: 999px;
          background: linear-gradient(135deg, #38bdf8, #1d4ed8);
        }

        .landing-contact {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
          gap: 3rem;
          align-items: flex-start;
          text-align: left;
        }
        @media (max-width: 900px) {
          .landing-contact {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .landing-contact-copy .landing-section-desc {
          margin-bottom: 1.75rem;
        }
        .landing-contact-form-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid var(--color-border);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          padding: 1.75rem 1.75rem 1.5rem;
        }
        .landing-contact-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .landing-contact-form label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }
        .landing-contact-form input,
        .landing-contact-form select,
        .landing-contact-form textarea {
          border-radius: 10px;
          border: 1px solid var(--color-border-input);
          padding: 0.55rem 0.75rem;
          font-size: 0.9rem;
          background: #f9fafb;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .landing-contact-form textarea {
          resize: vertical;
          min-height: 96px;
        }
        .landing-contact-form input:focus,
        .landing-contact-form select:focus,
        .landing-contact-form textarea:focus {
          outline: none;
          border-color: var(--color-accent);
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.08);
        }
        .form-row {
          display: flex;
          gap: 1rem;
        }
        .form-row > label {
          flex: 1;
        }
        @media (max-width: 700px) {
          .form-row {
            flex-direction: column;
          }
        }
        .form-full {
          width: 100%;
        }
        .form-submit {
          margin-top: 0.5rem;
          width: 100%;
        }
        .landing-cta {
          background: #0f172a;
          padding: 4rem 1.75rem;
          text-align: center;
        }
        .landing-cta-title {
          font-size: clamp(1.875rem, 3.2vw, 2.5rem);
          font-weight: 700;
          color: white;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
          position: relative;
        }
        .landing-cta-desc {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.92);
          margin: 0 0 2rem;
          position: relative;
        }
        .landing-cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
        }
        .landing-footer {
          background: #020617;
          color: var(--color-panel-muted);
          padding: 3rem 1.75rem 2.25rem;
        }
        .landing-footer-inner { max-width: 1180px; margin: 0 auto; }
        .landing-footer-brand {
          margin-bottom: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-decoration: none;
          color: inherit;
          width: fit-content;
        }
        .landing-footer-brand .landing-logo-icon {
          background: white;
          color: var(--color-accent);
          width: 32px;
          height: 32px;
        }
        .landing-footer-brand .landing-logo-text { color: white; font-size: 1.1rem; }
        .landing-footer-tagline {
          font-size: 0.9rem;
          color: var(--color-panel-muted);
          margin: 0;
        }
        .landing-footer-links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 768px) { .landing-footer-links { grid-template-columns: 1fr 1fr; gap: 2rem; } }
        .landing-footer-col h4 {
          font-size: 0.8125rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin: 0 0 1rem;
          letter-spacing: 0.02em;
        }
        .landing-footer-col a {
          display: block;
          font-size: 0.9rem;
          color: var(--color-panel-muted);
          margin-bottom: 0.5rem;
          transition: color 0.2s ease;
        }
        .landing-footer-col a:hover { color: white; }
        .landing-newsletter-form {
          display: flex;
          gap: 0.5rem;
        }
        .landing-newsletter-form input {
          flex: 1;
          min-width: 0;
          padding: 0.6rem 0.875rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 0.9rem;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .landing-newsletter-form input:focus {
          outline: none;
          border-color: var(--color-accent);
          background: rgba(255, 255, 255, 0.12);
        }
        .landing-newsletter-form input::placeholder { color: rgba(148, 163, 184, 0.9); }
        .landing-footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.875rem;
        }
        .landing-footer-bottom a {
          color: var(--color-panel-muted);
          margin-left: 1.25rem;
          transition: color 0.2s ease;
        }
        .landing-footer-bottom a:hover { color: white; }
      `}</style>
    </>
  );
}
