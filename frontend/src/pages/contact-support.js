import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function ContactSupport() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
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
      const res = await fetch(`${API_BASE}/api/contact-support.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          subject: formData.subject,
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
        <title>Contact Support — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        breadcrumb={<><Link href="/dashboard">Dashboard</Link> <span className="sep">›</span> Help <span className="sep">›</span> Contact Support</>}
        title="Contact Support"
        subtitle="Get help from the Performance Platform team"
      >
        <div className="contact-page">
          {submitted ? (
            <div className="contact-success">
              <p>We&apos;ve received your request and sent a confirmation to your email. We typically respond within 1–2 business days.</p>
              <button type="button" className="btn-secondary" onClick={() => setSubmitted(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <>
              <section className="contact-intro">
                <p>
                  For technical issues, account questions, or feedback, use the form below. We respond within 1–2 business days. Include any error messages or steps to reproduce so we can help faster.
                </p>
                <p>
                  Before contacting us, check the <Link href="/faq">FAQ</Link> and <Link href="/getting-started">Getting Started</Link> guide—you may find a quick answer there. For plans and pricing, use <Link href="/contact-sales">Contact sales</Link>.
                </p>
              </section>

              <form className="contact-form" onSubmit={handleSubmit}>
                {submitError && (
                  <div className="contact-error" role="alert">
                    {submitError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="contact-category">Category</label>
                  <select
                    id="contact-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="general">General inquiry</option>
                    <option value="technical">Technical issue</option>
                    <option value="account">Account &amp; access</option>
                    <option value="feedback">Feedback &amp; suggestions</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    type="text"
                    placeholder="Brief description of your request"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Describe your question or issue in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Submit request'}
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
          .form-group select,
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
          .form-group select:focus,
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
          .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
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
