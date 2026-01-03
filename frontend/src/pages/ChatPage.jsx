import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';
import api from '../utils/api';
import moment from 'moment-timezone';

const ChatPage = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const { user, socket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [dailyTopic, setDailyTopic] = useState('');
  const messagesEndRef = useRef(null);
  const faculty = decodeURIComponent(facultyId);

  useEffect(() => {
    if (socket) {
      socket.emit('join_room', { roomId: faculty });
      
      socket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      socket.on('settings_update', (settings) => {
        setDailyTopic(settings.dailyTopic);
      });

      loadMessages();
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('settings_update');
      }
    };
  }, [socket, faculty]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/messages/group/${faculty}`);
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('group_message', {
      roomId: faculty,
      content: newMessage
    });

    setNewMessage('');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
      <header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/faculties')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>{faculty}</h2>
          {dailyTopic && <p style={{ fontSize: '14px', opacity: 0.9 }}>📌 {dailyTopic}</p>}
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', flexShrink: 0 }}>
              {msg.sender.fullName.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{msg.sender.fullName}</span>
                <span style={{ fontSize: '12px', color: '#65676b' }}>
                  {moment(msg.timestamp).tz('Asia/Baku').format('HH:mm')}
                </span>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ padding: '16px', background: 'white', borderTop: '1px solid #e4e6eb', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mesaj yazın..."
          style={{ flex: 1, padding: '12px 16px', border: '1px solid #ccc', borderRadius: '24px', outline: 'none' }}
        />
        <button type="submit" disabled={!newMessage.trim()} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
