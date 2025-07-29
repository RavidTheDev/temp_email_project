import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Mail, RefreshCw, Clock, Inbox, Send, Eye, CheckCircle, AlertCircle, Search, Trash2, Code, X } from 'lucide-react';
import './TempMail.css';

const TempMailApp = () => {
  const [currentInbox, setCurrentInbox] = useState(() => {
    // שחזור מ-sessionStorage ברענון
    return sessionStorage.getItem('tempmail-inbox') || '';
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeLeft, setTimeLeft] = useState(() => {
    // שחזור זמן מ-sessionStorage
    const saved = sessionStorage.getItem('tempmail-expires');
    if (saved) {
      const expiresAt = new Date(saved);
      const now = new Date();
      return Math.max(0, Math.floor((expiresAt - now) / 1000));
    }
    return 0;
  });
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showHTMLView, setShowHTMLView] = useState(false);
  const [deletedMessages, setDeletedMessages] = useState(() => {
    // שחזור הודעות מחוקות מ-sessionStorage
    const saved = sessionStorage.getItem('tempmail-deleted');
    return saved ? JSON.parse(saved) : [];
  });

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
      
      // ניקוי הודעות מחוקות עבור אימייל חדש
      setDeletedMessages([]);
      sessionStorage.removeItem('tempmail-deleted');
      
      // שמירה ב-sessionStorage
      sessionStorage.setItem('tempmail-inbox', data.inbox);
      sessionStorage.setItem('tempmail-expires', data.expiresAt);
      
      // חישוב זמן שנותר
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      
    } catch (err) {
      console.error('❌ Create inbox error:', err);
      setError(`שגיאה ביצירת אימייל: ${err.message}`);
      
      // נסיון נוסף אחרי 2 שניות
      if (!err.message.includes('Too many')) {
        setTimeout(() => {
          console.log('🔄 Retrying inbox creation...');
          createInbox();
        }, 2000);
      }
    }
    setLoading(false);
  };

  // קבלת הודעות
  const fetchMessages = useCallback(async () => {
    if (!currentInbox) {
      console.log('🚫 No currentInbox, skipping fetch');
      return;
    }
    
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
          
          // סינון הודעות מחוקות
          const filteredMessages = sortedMessages.filter(message => {
            const messageId = `${message.date}-${message.from}-${message.subject}`;
            return !deletedMessages.includes(messageId);
          });
          
          console.log('📬 Sorted messages:', sortedMessages.length, 'filtered:', filteredMessages.length);
          setMessages(filteredMessages);
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
        // ניקוי sessionStorage
        sessionStorage.removeItem('tempmail-inbox');
        sessionStorage.removeItem('tempmail-expires');
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [currentInbox, deletedMessages]);

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

  // מחיקת הודעה ספציפית (מקומית)
  const deleteMessage = async (messageIndex) => {
    if (!currentInbox) return;
    
    try {
      const messageToDelete = messages[messageIndex];
      if (!messageToDelete) return;
      
      // יצירת מזהה ייחודי להודעה
      const messageId = `${messageToDelete.date}-${messageToDelete.from}-${messageToDelete.subject}`;
      
      // הוספה לרשימת הודעות מחוקות
      const newDeletedMessages = [...deletedMessages, messageId];
      setDeletedMessages(newDeletedMessages);
      
      // שמירה ב-sessionStorage
      sessionStorage.setItem('tempmail-deleted', JSON.stringify(newDeletedMessages));
      
      console.log(`🗑️ Marked message as deleted: ${messageId}`);
      
      // סגירת המודל אם ההודעה הנוכחית נמחקה
      if (selectedMessage && selectedMessage.index === messageIndex) {
        closeMessage();
      }
      
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // פילטור הודעות לפי חיפוש
  const filteredMessages = messages.filter(message => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      message.subject.toLowerCase().includes(searchLower) ||
      message.from.toLowerCase().includes(searchLower) ||
      (message.text && message.text.toLowerCase().includes(searchLower))
    );
  });

  // פתיחת הודעה במודל
  const openMessage = (message, index) => {
    setSelectedMessage({ ...message, index });
    // סימון הודעה כנקראה
    const updatedMessages = [...messages];
    updatedMessages[index].read = true;
    setMessages(updatedMessages);
  };

  // סגירת מודל
  const closeMessage = () => {
    setSelectedMessage(null);
    setShowHTMLView(false);
  };

  // שחזור הודעות כשהקומפוננט נטען או כש-currentInbox משתנה
  useEffect(() => {
    console.log('🔄 useEffect - currentInbox:', currentInbox);
    
    if (currentInbox) {
      console.log('📡 Fetching messages automatically...');
      // עיכוב קצר כדי לוודא שהקומפוננט נטען
      const timer = setTimeout(() => {
        fetchMessages();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🚫 No inbox to fetch messages for');
    }
  }, [currentInbox, fetchMessages]); // רק כשהcurrentInbox משתנה

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
          <h1 className="tempmail-title">📧 TempMail Pro</h1>
          <p className="tempmail-subtitle">
            אימייל זמני מהיר ובטוח • חינמי לחלוטין
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
                  <span className="tempmail-messages-count">{filteredMessages.length}</span>
                </div>

                {/* שדה חיפוש */}
                {messages.length > 0 && (
                  <div className="tempmail-search-container">
                    <div className="tempmail-search-input">
                      <Search size={20} />
                      <input
                        type="text"
                        placeholder="חפש בהודעות..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="tempmail-search-field"
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="tempmail-search-clear"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {filteredMessages.length === 0 ? (
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
                    {filteredMessages.map((message, index) => {
                      const originalIndex = messages.findIndex(m => m === message);
                      return (
                        <div 
                          key={`${message.date}-${originalIndex}`}
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
                            <div className="tempmail-message-actions">
                              <div className="tempmail-message-date">
                                🕐 {formatDate(message.date)}
                              </div>
                              <div className="tempmail-message-buttons">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openMessage(message, originalIndex);
                                  }}
                                  className="tempmail-message-btn tempmail-view-btn"
                                  title="צפה בהודעה"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMessage(originalIndex);
                                  }}
                                  className="tempmail-message-btn tempmail-delete-btn"
                                  title="מחק הודעה"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

        {/* Message Modal */}
        {selectedMessage && (
          <div className="tempmail-modal-overlay" onClick={closeMessage}>
            <div className="tempmail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="tempmail-modal-header">
                <h3 className="tempmail-modal-title">
                  📧 {selectedMessage.subject}
                </h3>
                <div className="tempmail-modal-actions">
                  {selectedMessage.html && (
                    <button
                      onClick={() => setShowHTMLView(!showHTMLView)}
                      className={`tempmail-modal-btn ${showHTMLView ? 'active' : ''}`}
                      title={showHTMLView ? 'הצג טקסט' : 'הצג HTML'}
                    >
                      <Code size={16} />
                      {showHTMLView ? 'טקסט' : 'HTML'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(selectedMessage.index)}
                    className="tempmail-modal-btn tempmail-delete-btn"
                    title="מחק הודעה"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={closeMessage}
                    className="tempmail-modal-btn tempmail-close-btn"
                    title="סגור"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="tempmail-modal-info">
                <div><strong>מאת:</strong> {selectedMessage.from}</div>
                <div><strong>תאריך:</strong> {formatDate(selectedMessage.date)}</div>
              </div>
              
              <div className="tempmail-modal-content">
                {showHTMLView && selectedMessage.html ? (
                  <div 
                    className="tempmail-html-content"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.html }}
                  />
                ) : (
                  <div className="tempmail-text-content">
                    {selectedMessage.text || 'אין תוכן טקסט בהודעה זו.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="tempmail-footer">
          <p>🔒 הודעות נמחקות אוטומטית אחרי 10 דקות • מאובטח וחסוי לחלוטין</p>
        </div>
      </div>
    </div>
  );
};

export default TempMailApp;