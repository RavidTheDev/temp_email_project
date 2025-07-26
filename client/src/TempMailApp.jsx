import React, { useState, useEffect } from 'react';
import { Copy, Mail, RefreshCw, Clock, Trash2, Eye } from 'lucide-react';

const TempMailApp = () => {
  const [currentInbox, setCurrentInbox] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  const API_BASE = 'http://localhost:5000';

  // Styles object
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    maxWidth: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: 'white'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '10px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
    },
    subtitle: {
      fontSize: '1.1rem',
      opacity: 0.9
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '30px',
      marginBottom: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    },
    welcomeSection: {
      textAlign: 'center',
      padding: '40px 20px'
    },
    welcomeIcon: {
      width: '80px',
      height: '80px',
      margin: '0 auto 20px',
      color: '#667eea'
    },
    welcomeTitle: {
      fontSize: '1.8rem',
      fontWeight: '600',
      marginBottom: '15px',
      color: '#333'
    },
    welcomeText: {
      color: '#666',
      marginBottom: '30px',
      lineHeight: '1.6'
    },
    button: {
      backgroundColor: '#667eea',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    buttonHover: {
      backgroundColor: '#5a67d8',
      transform: 'translateY(-2px)'
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    emailContainer: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '25px'
    },
    emailHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    emailLabel: {
      fontWeight: '600',
      color: '#333'
    },
    timer: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '0.9rem',
      color: '#666'
    },
    emailInput: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    emailAddress: {
      flex: 1,
      backgroundColor: 'white',
      padding: '12px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontFamily: 'monospace'
    },
    copyButton: {
      backgroundColor: copied ? '#48bb78' : '#667eea',
      color: 'white',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    },
    controls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px'
    },
    leftControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.9rem'
    },
    messagesHeader: {
      fontSize: '1.4rem',
      fontWeight: '600',
      marginBottom: '20px',
      color: '#333'
    },
    noMessages: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    },
    noMessagesIcon: {
      width: '60px',
      height: '60px',
      margin: '0 auto 15px',
      opacity: 0.5
    },
    messagesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    messageCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '20px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    messageCardHover: {
      backgroundColor: '#f8f9fa',
      borderColor: '#cbd5e0'
    },
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '10px'
    },
    messageInfo: {
      flex: 1
    },
    messageSubject: {
      fontWeight: '600',
      color: '#333',
      marginBottom: '5px'
    },
    messageFrom: {
      fontSize: '0.9rem',
      color: '#666'
    },
    messageDate: {
      fontSize: '0.8rem',
      color: '#999'
    },
    messageContent: {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      marginTop: '10px',
      color: '#333',
      lineHeight: '1.6'
    },
    error: {
      backgroundColor: '#fed7d7',
      border: '1px solid #fc8181',
      color: '#c53030',
      padding: '15px',
      borderRadius: '8px',
      marginTop: '20px'
    },
    footer: {
      textAlign: 'center',
      color: 'rgba(255,255,255,0.8)',
      fontSize: '0.9rem'
    }
  };

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
    
    try {
      const address = currentInbox.split('@')[0];
      const response = await fetch(`${API_BASE}/inbox/${address}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // עדכון זמן שנותר
        if (data.expiresAt) {
          const expiresAt = new Date(data.expiresAt);
          const now = new Date();
          setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
        }
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
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>📧 Temp Mail</h1>
          <p style={styles.subtitle}>אימייל זמני בחינם - קבל הודעות באופן אנונימי</p>
        </div>

        {/* Main Content */}
        <div style={styles.card}>
          {!currentInbox ? (
            /* יצירת Inbox חדש */
            <div style={styles.welcomeSection}>
              <Mail style={styles.welcomeIcon} />
              <h2 style={styles.welcomeTitle}>צור אימייל זמני</h2>
              <p style={styles.welcomeText}>
                קבל אימייל זמני שפעיל ל-10 דקות<br/>
                מושלם לרישום לאתרים, הורדת קבצים או כל שימוש חד-פעמי
              </p>
              <button
                onClick={createInbox}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {})
                }}
              >
                <Mail size={20} />
                {loading ? 'יוצר...' : 'צור אימייל זמני'}
              </button>
            </div>
          ) : (
            /* תצוגת Inbox קיים */
            <div>
              {/* כתובת האימייל */}
              <div style={styles.emailContainer}>
                <div style={styles.emailHeader}>
                  <span style={styles.emailLabel}>האימייל הזמני שלך:</span>
                  <div style={styles.timer}>
                    <Clock size={16} />
                    {timeLeft > 0 ? `נותרו ${formatTime(timeLeft)}` : 'פג תוקף'}
                  </div>
                </div>
                
                <div style={styles.emailInput}>
                  <input
                    type="text"
                    value={currentInbox}
                    readOnly
                    style={styles.emailAddress}
                  />
                  <button
                    onClick={copyToClipboard}
                    style={styles.copyButton}
                  >
                    <Copy size={16} />
                    {copied ? 'הועתק!' : 'העתק'}
                  </button>
                </div>
              </div>

              {/* פקדים */}
              <div style={styles.controls}>
                <div style={styles.leftControls}>
                  <button
                    onClick={fetchMessages}
                    style={{...styles.button, backgroundColor: '#48bb78'}}
                  >
                    <RefreshCw size={16} />
                    רענן
                  </button>
                  
                  <label style={styles.checkbox}>
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
                  style={{...styles.button, backgroundColor: '#9f7aea'}}
                >
                  <Mail size={16} />
                  אימייל חדש
                </button>
              </div>

              {/* רשימת הודעות */}
              <div>
                <h3 style={styles.messagesHeader}>
                  הודעות ({messages.length})
                </h3>
                
                {messages.length === 0 ? (
                  <div style={styles.noMessages}>
                    <Mail style={styles.noMessagesIcon} />
                    <p><strong>אין הודעות עדיין</strong></p>
                    <p>הודעות יופיעו כאן אוטומטית כשיגיעו</p>
                  </div>
                ) : (
                  <div style={styles.messagesList}>
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        style={styles.messageCard}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = styles.messageCardHover.backgroundColor;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={styles.messageHeader}>
                          <div style={styles.messageInfo}>
                            <div style={styles.messageSubject}>
                              {message.subject}
                            </div>
                            <div style={styles.messageFrom}>
                              מאת: {message.from}
                            </div>
                          </div>
                          <div style={styles.messageDate}>
                            {formatDate(message.date)}
                          </div>
                        </div>
                        
                        {message.text && (
                          <div style={styles.messageContent}>
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
            <div style={styles.error}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>האימיילים נמחקים אוטומטית אחרי 10 דקות • בטוח ואנונימי לחלוטין</p>
        </div>
      </div>
    </div>
  );
};

export default TempMailApp;