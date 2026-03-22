import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const FAQ_ITEMS = [
  {
    q: 'What should I log in "Log Event"?',
    a: 'Log mentoring, knowledge sharing, peer support, and other collaboration that contributes to your team. The goal is to create a clear record of your impact so reviews are based on evidence, not just recent work.',
  },
  {
    q: 'How often should I log collaboration?',
    a: 'Log events regularly—weekly or after meaningful activities—so your full contribution is visible. This reduces recency bias and helps your manager see your consistent impact over time.',
  },
  {
    q: 'Who can see my logged events and reviews?',
    a: 'Your manager and designated reviewers use your events and reviews for evaluations. Your profile and visibility settings in Settings control what others can see. Check with your admin for your organization\'s policy.',
  },
  {
    q: 'How do I request feedback from my manager?',
    a: 'From your dashboard or reviews area you can request feedback. Your manager will receive a notification and can submit a review for you. You\'ll get a notification when the review is ready to view.',
  },
  {
    q: 'What happens after my manager submits a review?',
    a: 'You receive a notification and can view the review under My Reviews. The feedback is stored with your performance history and can inform your goals and future collaboration logs.',
  },
  {
    q: 'Who can see my goals?',
    a: 'Your manager and anyone with access to your performance data (per your organization\'s policy) can see goals. Use Goal Management to set and track objectives that align with your team.',
  },
  {
    q: 'How do I add team members or update my team? (Managers)',
    a: 'Team structure is typically managed by admins. Use the Company Directory to find people; for adding or changing team membership, contact your admin or use the Admin area if you have admin rights.',
  },
  {
    q: 'Is my collaboration log private?',
    a: 'Logged events are used for performance evaluation by your manager and reviewers. They are not public to the whole company. See Settings and your organization\'s policy for details.',
  },
  {
    q: 'What\'s the difference between Performance History and Impact Trends?',
    a: 'Performance History shows your review outcomes and scores over time. Impact Trends focuses on how your contribution mix (e.g. mentoring, delivery) changes across periods, helping you see patterns and balance.',
  },
  {
    q: 'How do I contact sales for plans or pricing?',
    a: <>Use <Link href="/contact-sales">Contact sales</Link> to inquire about plans, enterprise options, or pricing. We\'ll respond within 1–2 business days.</>,
  },
  {
    q: 'How quickly does support respond?',
    a: 'We aim to respond to support requests within 1–2 business days. For urgent account or access issues, include that in your message. Check the <Link href="/faq">FAQ</Link> first for quick answers.',
  },
  {
    q: 'How do I change my password or email?',
    a: <>Go to <Link href="/settings">Settings</Link> to update your profile, notification preferences, and account details. Password and security options are available there.</>,
  },
  {
    q: 'I don\'t see my manager or some team members. What should I do?',
    a: <>Use the <Link href="/directory">Company Directory</Link> to find people across the organization. If your reporting structure is wrong, contact your admin or HR to update it.</>,
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="faq-item">
      <button type="button" className="faq-question" onClick={onToggle} aria-expanded={isOpen}>
        {item.q}
        <span className="faq-icon">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          {typeof item.a === 'string' ? <p>{item.a}</p> : <div className="faq-answer-body">{item.a}</div>}
        </div>
      )}
      <style jsx>{`
        .faq-item {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          margin-bottom: 0.75rem;
          overflow: hidden;
          background: var(--color-surface);
        }
        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.25rem;
          text-align: left;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--color-text);
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s ease;
        }
        .faq-question:hover { background: var(--color-surface-alt); }
        .faq-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: var(--color-accent);
          font-weight: 400;
        }
        .faq-answer {
          padding: 0 1.25rem 1.25rem;
          border-top: 1px solid var(--color-border-light);
        }
        .faq-answer p,
        .faq-answer-body {
          margin: 0.75rem 0 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}

export default function FAQ() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(0);

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
        <title>FAQ — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        breadcrumb={<><Link href="/dashboard">Dashboard</Link> <span className="sep">›</span> Help <span className="sep">›</span> FAQ</>}
        title="Frequently Asked Questions"
        subtitle="Common questions about the Performance Platform"
      >
        <div className="faq-page">
          <p className="faq-intro">
            Can&apos;t find what you need? <Link href="/contact-support">Contact support</Link>, <Link href="/contact-sales">contact sales</Link> for plans and pricing, or see <Link href="/getting-started">Getting Started</Link> for a guided overview.
          </p>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
        <style jsx>{`
          .faq-page { max-width: 640px; }
          .faq-intro {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            margin: 0 0 1.5rem;
            line-height: 1.6;
          }
          .faq-list { margin-top: 1rem; }
        `}</style>
      </AppLayout>
    </>
  );
}
