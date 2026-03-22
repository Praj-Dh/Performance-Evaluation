import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function ContactSales() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    message: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact-sales.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData.company,
          role: formData.role,
          message: formData.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="layout loading-only">
        <div className="loading-state"><p>Loading…</p></div>
        <style jsx>{`
          .loading-only { display: flex; min-height: 100vh; background: var(--color-surface-alt); }
          .loading-state { flex: 1; display: flex; align-items: center; justify-content: center; }
        `}</style>
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <Head>
        <title>Contact Sales — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        breadcrumb={<><Link href="/dashboard">Dashboard</Link> <span className="sep">›</span> Help <span className="sep">›</span> Contact Sales</>}
        title="Contact Sales"
        subtitle="Inquire about plans, pricing, or enterprise options"
      >
        <div className="contact-page">
          {submitted ? (
            <div className="contact-success">
              <p>We&apos;ve received your inquiry and sent a confirmation to your email. We typically respond within 1–2 business days.</p>
              <button type="button" className="btn-secondary" onClick={() => setSubmitted(false)}>
                Send another inquiry
              </button>
            </div>
          ) : (
            <>
              <section className="contact-intro">
                <p>
                  Interested in plans, pricing, or enterprise options? Fill out the form below and we&apos;ll get back to you within 1–2 business days.
                </p>
                <p>
                  For technical support or account help, use <Link href="/contact-support">Contact support</Link> or check the <Link href="/faq">FAQ</Link>.
                </p>
              </section>

              <form className="contact-form" onSubmit={handleSubmit}>
                {submitError && (
                  <div className="contact-error" role="alert">
                    {submitError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="contact-company">Company / organization</label>
                  <input
                    id="contact-company"
                    type="text"
                    placeholder="Your company name"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-role">Your role</label>
                  <input
                    id="contact-role"
                    type="text"
                    placeholder="e.g. HR Manager, Team Lead"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us about your needs: team size, use case, timeline..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Submit inquiry'}
                </button>
              </form>
            </>
          )}
        </div>
        <style jsx>{`
          .contact-page { max-width: 560px; }
          .contact-intro {
            margin-bottom: 2rem;
          }
          .contact-intro p {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.6;
            margin: 0 0 0.75rem;
          }
          .contact-form {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-xl);
            padding: 1.5rem 1.75rem;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
          }
          .form-group {
            margin-bottom: 1.25rem;
          }
          .form-group label {
            display: block;
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--color-text);
            margin-bottom: 0.375rem;
          }
          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 0.625rem 0.75rem;
            font-size: 0.9375rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-family: inherit;
            background: var(--color-surface);
            color: var(--color-text);
            box-sizing: border-box;
          }
          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: var(--color-accent);
            box-shadow: 0 0 0 2px var(--color-accent-soft);
          }
          .form-group textarea {
            resize: vertical;
            min-height: 120px;
          }
          .btn-primary {
            display: inline-block;
            padding: 0.625rem 1.25rem;
            font-size: 0.9375rem;
            font-weight: 600;
            color: #fff;
            background: var(--color-accent);
            border: none;
            border-radius: var(--radius-md);
            cursor: pointer;
            font-family: inherit;
            transition: background 0.2s ease;
          }
          .btn-primary:hover { background: var(--color-accent-hover); }
          .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
          .contact-success {
            background: var(--color-accent-soft);
            border: 1px solid var(--color-accent-muted);
            border-radius: var(--radius-xl);
            padding: 1.5rem 1.75rem;
          }
          .contact-success p {
            margin: 0 0 1rem;
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.6;
          }
          .btn-secondary {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-accent);
            background: transparent;
            border: 1px solid var(--color-accent-muted);
            border-radius: var(--radius-md);
            cursor: pointer;
            font-family: inherit;
          }
          .btn-secondary:hover { background: var(--color-accent-soft); }
          .contact-error {
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
            color: #b91c1c;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
