import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function PeersChat() {
  const router = useRouter();
  const { with: peerId, name: peerNameFromQuery } = router.query;
  const [user, setUser] = useState(null);
  const [peerName, setPeerName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch the logged-in user
  useEffect(() => {
    if (!router.isReady) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setPeerName(typeof peerNameFromQuery === 'string' ? decodeURIComponent(peerNameFromQuery) : 'Teammate');
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, peerNameFromQuery]);

  // 2. NEW: Fetch chat history from the database
  useEffect(() => {
    if (!user || !peerId) return;
    
    const fetchChatHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat.php?user_id=${user.id}&peer_id=${peerId}`, {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.success && data.messages) {
          // Format the backend data to match the frontend UI expectations
          const formattedMessages = data.messages.map((msg) => ({
            id: msg.id,
            sender: msg.sender_id === user.id ? 'me' : 'peer',
            text: msg.message,
            at: msg.created_at
          }));
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    fetchChatHistory();
    
    // Optional: Refresh chat every 5 seconds for real-time feel
    const intervalId = setInterval(fetchChatHistory, 5000);
    return () => clearInterval(intervalId);
    
  }, [user, peerId]);

  // 3. UPDATED: Send message to the backend database
  const handleSend = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !user || !peerId) return;

    // Optimistically update the UI instantly
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender: 'me', text, at: new Date().toISOString() },
    ]);
    setMessage('');

    // Send the actual message to the database
    try {
      await fetch(`${API_BASE}/api/chat.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: parseInt(peerId),
          message: text
        })
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (loading || !user) {
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

  const displayName = peerName || 'Teammate';

  return (
    <>
      <Head>
        <title>Chat with {displayName} — Peers</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="peers"
        breadcrumb={
          <>
            <Link href="/peers">People › Peers</Link>
            <span className="sep">›</span> Chat with {displayName}
          </>
        }
        title={`Chat with ${displayName}`}
        subtitle="Conversation with your teammate"
      >
        <section className="peers-chat-section">
          {!peerId ? (
            <div className="card empty-chat-card">
              <p>Select a peer from the <Link href="/peers">Peers</Link> page to start a conversation.</p>
            </div>
          ) : (
            <>
              <div className="chat-header card">
                <Link href="/peers" className="back-link">← Back to Peers</Link>
                <h2 className="chat-with-title">Chat with {displayName}</h2>
                <p className="chat-hint">Messages are stored in the database and synced in real-time.</p>
              </div>
              <div className="chat-window card">
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="chat-placeholder">
                      <span className="placeholder-icon">💬</span>
                      <p>No messages yet. Say hello to start the conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`chat-bubble ${msg.sender === 'me' ? 'bubble-me' : 'bubble-peer'}`}
                      >
                        <span className="bubble-text">{msg.text}</span>
                        <span className="bubble-time">
                          {new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSend} className="chat-form">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="chat-input"
                    aria-label="Message"
                  />
                  <button type="submit" className="chat-send-btn" disabled={!message.trim()}>
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        <style jsx>{`
          .peers-chat-section { max-width: 640px; }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
          .chat-header { padding: 1rem 1.25rem; margin-bottom: 1rem; }
          .back-link { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
          .chat-with-title { margin: 0.5rem 0 0.25rem; font-size: 1.25rem; font-weight: 600; }
          .chat-hint { margin: 0; font-size: var(--text-xs); color: var(--color-text-muted); }
          .chat-window { display: flex; flex-direction: column; min-height: 360px; padding: 0; overflow: hidden; }
          .chat-messages { flex: 1; padding: 1rem; overflow-y: auto; min-height: 260px; display: flex; flex-direction: column; }
          .chat-placeholder { text-align: center; padding: 2rem; color: var(--color-text-muted); margin: auto; }
          .placeholder-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
          .chat-bubble { max-width: 85%; padding: 0.6rem 1rem; border-radius: var(--radius-lg); margin-bottom: 0.5rem; word-break: break-word; }
          .bubble-me { background: var(--color-accent); color: #fff; align-self: flex-end; }
          .bubble-peer { background: var(--color-surface-alt); color: var(--color-text); align-self: flex-start; }
          .bubble-time { display: block; font-size: var(--text-xs); opacity: 0.85; margin-top: 0.25rem; }
          .chat-form { display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid var(--color-border); }
          .chat-input { flex: 1; padding: 0.6rem 1rem; border: 1px solid var(--color-border-input); border-radius: var(--radius-md); font-size: var(--text-sm); }
          .chat-input:focus { outline: none; border-color: var(--color-accent); }
          .chat-send-btn {
            padding: 0.6rem 1.25rem; background: var(--color-accent); color: #fff; border: none;
            border-radius: var(--radius-md); font-weight: var(--font-medium); cursor: pointer;
          }
          .chat-send-btn:hover:not(:disabled) { background: var(--color-accent-hover); }
          .chat-send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .empty-chat-card { padding: 2rem; text-align: center; }
        `}</style>
      </AppLayout>
    </>
  );
}
