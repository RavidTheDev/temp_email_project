import React, { useState, useEffect } from 'react';
import { Copy, Mail, RefreshCw, Clock, Inbox, Send, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import './TempMail.css';

const TempMailApp = () => {
  const [currentInbox, setCurrentInbox] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  const API_BASE = 'http://localhost:5000';

  // יצירת inbox חדש
  const createInbox = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/inbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to create inbox');
      
      const data = await response.json();
      setCurrentInbox(data.inbox);
      setMessages([]);
      
      // חישוב זמן שנותר
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      
    } catch (err) {
      setError('Failed to create inbox: ' + err.message);
    }
    setLoading(false);
  };

  // קבלת הודעות
  const fetchMessages = async () => {
    if (!currentInbox) return;
    
    console.log('🔍 Fetching messages for:', currentInbox);
    
    try {
      const address = currentInbox.split('@')[0];
      const response = await fetch(`${API_BASE}/inbox/${address}`);
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📬 Full response data:', data);
        console.log('📬 Messages array:', data.messages);
        console.log('📬 Messages count:', data.messages ? data.messages.length : 'undefined');
        
        if (data.messages && Array.isArray(data.messages)) {
          // מיון הודעות לפי תאריך (החדשות ראשון)
          const sortedMessages = [...data.messages].sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log('📬 Sorted messages:', sortedMessages);
          setMessages(sortedMessages);
        } else {
          console.log('❌ No messages array found');
          setMessages([]);
        }
        
        // עדכון זמן שנותר
        if (data.expiresAt) {
          const expiresAt = new Date(data.expiresAt);
          const now = new Date();
          const timeLeftSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(timeLeftSeconds);
        }
      } else if (response.status === 404) {
        console.log('❌ Inbox not found - expired or deleted');
        setCurrentInbox('');
        setMessages([]);
        setError('האימייל פג תוקף או נמחק');
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // העתקת כתובת למאגר
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentInbox);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // עדכון אוטומטי
  useEffect(() => {
    if (!autoRefresh || !currentInbox) return;
    
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [currentInbox, autoRefresh]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // פורמט זמן
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // פורמט תאריך
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('he-IL');
  };

  return (
    <div className="tempmail-container">
      <div className="tempmail-background-pattern"></div>
      <div className="tempmail-content">
        {/* Header */}
        <div className="tempmail-header">
          <h1 className="tempmail-title">✉️ TempMail Pro</h1>
          <p className="tempmail-subtitle">
            אימייל זמני מתקדם • מהיר • בטוח • חינמי לחלוטין
          </p>
        </div>

        {/* Main Content */}
        <div className="tempmail-card">
          {!currentInbox ? (
            /* יצירת Inbox חדש */
            <div className="tempmail-welcome">
              <div className="tempmail-welcome-icon">
                <Mail size={60} />
              </div>
              <h2 className="tempmail-welcome-title">ברוכים הבאים ל-TempMail Pro</h2>
              <p className="tempmail-welcome-text">
                קבלו אימייל זמני תוך שניות ספורות. מושלם לרישום לאתרים, 
                הורדת קבצים, או כל שימוש חד-פעמי. הכל בטוח ואנונימי לחלוטין.
              </p>
              <button
                onClick={createInbox}
                disabled={loading}
                className="tempmail-primary-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw size={20} className="tempmail-spinning" />
                    יוצר אימייל...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    צור אימייל זמני עכשיו
                  </>
                )}
              </button>
            </div>
          ) : (
            /* תצוגת Inbox קיים */
            <div className="tempmail-fade-in">
              {/* כתובת האימייל */}
              <div className="tempmail-email-container">
                <div className="tempmail-email-header">
                  <span className="tempmail-email-label">
                    <Mail size={20} style={{marginLeft: '8px', verticalAlign: 'middle'}} />
                    האימייל הזמני שלך:
                  </span>
                  <div className="tempmail-timer">
                    <Clock size={16} />
                    {timeLeft > 0 ? `נותרו ${formatTime(timeLeft)}` : 'פג תוקף'}
                  </div>
                </div>
                
                <div className="tempmail-email-input">
                  <input
                    type="text"
                    value={currentInbox}
                    readOnly
                    className="tempmail-email-address"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`tempmail-copy-btn ${copied ? 'tempmail-copy-btn-copied' : 'tempmail-copy-btn-normal'}`}
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {copied ? 'הועתק!' : 'העתק'}
                  </button>
                </div>
              </div>

              {/* פקדים */}
              <div className="tempmail-controls">
                <div className="tempmail-left-controls">
                  <button
                    onClick={fetchMessages}
                    className="tempmail-btn tempmail-btn-refresh"
                  >
                    <RefreshCw size={16} />
                    רענן הודעות
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('🐛 Debug - Current state:');
                      console.log('currentInbox:', currentInbox);
                      console.log('messages:', messages);
                      console.log('messages.length:', messages.length);
                      console.log('messages type:', typeof messages);
                      console.log('messages is array:', Array.isArray(messages));
                      alert(`Messages count: ${messages.length}`);
                    }}
                    className="tempmail-btn tempmail-btn-debug"
                  >
                    🐛 Debug
                  </button>
                  
                  <label className="tempmail-checkbox">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    רענון אוטומטי
                  </label>
                </div>

                <button
                  onClick={createInbox}
                  className="tempmail-btn tempmail-btn-new"
                >
                  <Send size={16} />
                  אימייל חדש
                </button>
              </div>

              {/* רשימת הודעות */}
              <div>
                <div className="tempmail-messages-header">
                  <Inbox size={24} />
                  תיבת דואר נכנס
                  <span className="tempmail-messages-count">{messages.length}</span>
                </div>
                
                {messages.length === 0 ? (
                  <div className="tempmail-no-messages">
                    <Mail className="tempmail-no-messages-icon" />
                    <div className="tempmail-no-messages-title">התיבה ריקה</div>
                    <p>הודעות יופיעו כאן אוטומטית ברגע שיגיעו</p>
                    <p style={{fontSize: '0.85rem', marginTop: '15px', opacity: 0.7}}>
                      💡 טיפ: השתמשו בכתובת הזמנית לרישום לאתרים או שירותים
                    </p>
                  </div>
                ) : (
                  <div className="tempmail-messages-list">
                    {messages.map((message, index) => (
                      <div 
                        key={`${message.date}-${index}`}
                        className="tempmail-message-card"
                      >
                        {!message.read && <div className="tempmail-unread-indicator"></div>}
                        
                        <div className="tempmail-message-header">
                          <div className="tempmail-message-info">
                            <div className="tempmail-message-subject">
                              📧 {message.subject}
                            </div>
                            <div className="tempmail-message-from">
                              👤 {message.from}
                            </div>
                            {message.text && (
                              <div className="tempmail-message-preview">
                                {message.text.substring(0, 150)}
                                {message.text.length > 150 && '...'}
                              </div>
                            )}
                          </div>
                          <div className="tempmail-message-date">
                            🕐 {formatDate(message.date)}
                          </div>
                        </div>
                        
                        {message.text && (
                          <div className="tempmail-message-content">
                            <div style={{fontWeight: '600', marginBottom: '10px', color: '#4a5568'}}>
                              📄 תוכן ההודעה:
                            </div>
                            {message.text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="tempmail-error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tempmail-footer">
          <p>🔒 הודעות נמחקות אוטומטית אחרי 10 דקות • מאובטח וחסוי לחלוטין</p>
        </div>
      </div>
    </div>
  );
};

export default TempMailApp;