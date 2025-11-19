import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Chat.css'; // We'll reuse the stylesheet from employer chat

const ApplicantChat = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  
    try {
      const decoded = jwtDecode(token);
      if (decoded.user_type !== 'applicant') {
        navigate('/login');
        return;
      }
      setUserId(decoded.user_id);
      setUserType(decoded.user_type);
  
      const urlParams = new URLSearchParams(window.location.search);
      const employerId = urlParams.get('employerId');
  
      fetchConnections(decoded.user_id, token).then(() => {
        if (employerId && connections.length > 0) {
          const preSelected = connections.find(conn => 
            conn.employer_id === parseInt(employerId)
          );
          if (preSelected) {
            setSelectedEmployer(preSelected);
          }
        }
      });
    } catch (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch chat connections
  const fetchConnections = async (id, token) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/chat/applicant/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load chat connections');
      setLoading(false);
    }
  };

  // Fetch chat messages when an employer is selected
  useEffect(() => {
    if (selectedEmployer && userId) {
      const token = localStorage.getItem('token');
      fetchMessages(userId, selectedEmployer.employer_id, token);
      
      // Set up polling for new messages every 10 seconds
      const interval = setInterval(() => {
        fetchMessages(userId, selectedEmployer.employer_id, token);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [selectedEmployer, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (senderId, receiverId, token) => {
    try {
        const response = await axios.get(
            `http://localhost:8000/api/chat/messages/${senderId}/${receiverId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        setMessages(response.data);

        // Update unread messages count
        setConnections(prev =>
            prev.map(conn =>
                conn.employer_id === receiverId || conn.applicant_id === receiverId
                    ? { ...conn, unread_count: 0 }
                    : conn
            )
        );
    } catch (err) {
        console.error("Error fetching messages:", err);
    }
};

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedEmployer) return;

    const token = localStorage.getItem('token');
    try {
      const messageData = {
        receiver_id: selectedEmployer.employer_id,
        message_text: newMessage,
        sender_type: 'applicant'
      };

      await axios.post('http://localhost:8000/api/chat/messages', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local messages for immediate feedback
      setMessages(prev => [...prev, {
        sender_id: userId,
        receiver_id: selectedEmployer.employer_id,
        message_text: newMessage,
        timestamp: new Date().toISOString(),
        is_read: false,
        sender_type: 'applicant'
      }]);
      
      setNewMessage('');
      
      // Refetch messages to ensure consistency
      fetchMessages(userId, selectedEmployer.employer_id, token);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSelectEmployer = (employer) => {
    setSelectedEmployer(employer);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h2>Conversations</h2>
        {loading ? (
          <p>Loading conversations...</p>
        ) : connections.length === 0 ? (
          <p>No conversations yet</p>
        ) : (
          <ul className="chat-connections">
            {connections.map(connection => (
              <li
                key={connection.connection_id}
                className={`chat-connection ${selectedEmployer && selectedEmployer.employer_id === connection.employer_id ? 'active' : ''}`}
                onClick={() => handleSelectEmployer(connection)}
              >
                <div className="connection-info">
                  <h3>{connection.company_name}</h3>
                  <p>{connection.employer_email}</p>
                  {connection.last_message_time && (
                    <small>{formatDate(connection.last_message_time)}</small>
                  )}
                </div>
                {connection.unread_count > 0 && (
                  <span className="unread-badge">{connection.unread_count}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <button 
          className="back-button"
          onClick={() => navigate('/applicant-dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="chat-main">
        {selectedEmployer ? (
          <>
            <div className="chat-header">
              <h2>{selectedEmployer.company_name}</h2>
              <p>{selectedEmployer.employer_email}</p>
            </div>
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <p className="no-messages">No messages yet. Start the conversation!</p>
              ) : (
                messages.map(message => (
                  <div 
                    key={message.message_id} 
                    className={`message ${message.sender_id === userId ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{message.message_text}</p>
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <h2>Select a conversation to start chatting</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantChat;