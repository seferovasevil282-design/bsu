import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Filter, AlertTriangle, Settings, LogOut } from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [rules, setRules] = useState('');
  const [dailyTopic, setDailyTopic] = useState('');
  const [filteredWords, setFilteredWords] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    api.defaults.headers.Authorization = `Bearer ${token}`;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, reportedRes, settingsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/reported-users'),
        api.get('/admin/settings')
      ]);
      
      setUsers(usersRes.data.users);
      setReportedUsers(reportedRes.data.reportedUsers);
      setSettings(settingsRes.data);
      setRules(settingsRes.data.rules);
      setDailyTopic(settingsRes.data.dailyTopic);
      setFilteredWords(settingsRes.data.filteredWords || '');
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      loadData();
    } catch (error) {
      console.error('Toggle user error:', error);
    }
  };

  const updateRules = async () => {
    try {
      await api.patch('/admin/settings/rules', { rules });
      alert('Qaydalar yeniləndi');
    } catch (error) {
      console.error('Update rules error:', error);
    }
  };

  const updateDailyTopic = async () => {
    try {
      await api.patch('/admin/settings/daily-topic', { dailyTopic });
      alert('Günün mövzusu yeniləndi');
    } catch (error) {
      console.error('Update daily topic error:', error);
    }
  };

  const updateFilteredWords = async () => {
    try {
      await api.patch('/admin/settings/filtered-words', { filteredWords });
      alert('Filtr sözləri yeniləndi');
    } catch (error) {
      console.error('Update filtered words error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <header style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Admin Paneli</h1>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={20} />
          Çıxış
        </button>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto' }}>
          {[
            { id: 'users', label: 'İstifadəçilər', icon: <Users size={20} /> },
            { id: 'reported', label: 'Şikayət edilənlər', icon: <AlertTriangle size={20} /> },
            { id: 'settings', label: 'Ayarlar', icon: <Settings size={20} /> },
            { id: 'filter', label: 'Filtr', icon: <Filter size={20} /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', border: 'none', background: activeTab === tab.id ? 'white' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>İstifadəçilər ({users.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e4e6eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Ad Soyad</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Fakültə</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #e4e6eb' }}>
                      <td style={{ padding: '12px' }}>{user.fullName}</td>
                      <td style={{ padding: '12px' }}>{user.email}</td>
                      <td style={{ padding: '12px' }}>{user.faculty}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', background: user.isActive ? '#e7f5ff' : '#ffe3e3', color: user.isActive ? '#1971c2' : '#c92a2a', fontSize: '14px' }}>
                          {user.isActive ? 'Aktiv' : 'Deaktiv'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => toggleUserStatus(user.id)} style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', background: user.isActive ? '#f5576c' : '#51cf66', color: 'white', cursor: 'pointer' }}>
                          {user.isActive ? 'Deaktiv et' : 'Aktiv et'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reported' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Şikayət edilən hesablar (16+)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e4e6eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Ad Soyad</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Şikayət sayı</th>
                  </tr>
                </thead>
                <tbody>
                  {reportedUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #e4e6eb' }}>
                      <td style={{ padding: '12px' }}>{user.fullName}</td>
                      <td style={{ padding: '12px' }}>{user.email}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', background: '#ffe3e3', color: '#c92a2a', fontWeight: '600' }}>
                          {user.reportCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Ayarlar</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Günün mövzusu</label>
              <input type="text" value={dailyTopic} onChange={(e) => setDailyTopic(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }} />
              <button onClick={updateDailyTopic} style={{ marginTop: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#667eea', color: 'white', cursor: 'pointer' }}>Yenilə</button>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Qaydalar</label>
              <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows="8" style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }} />
              <button onClick={updateRules} style={{ marginTop: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#667eea', color: 'white', cursor: 'pointer' }}>Yenilə</button>
            </div>
          </div>
        )}

        {activeTab === 'filter' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Filtr sözləri</h2>
            <p style={{ marginBottom: '16px', color: '#666' }}>Virgüllə ayırın</p>
            <textarea value={filteredWords} onChange={(e) => setFilteredWords(e.target.value)} rows="6" style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }} placeholder="söz1, söz2, söz3" />
            <button onClick={updateFilteredWords} style={{ marginTop: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#667eea', color: 'white', cursor: 'pointer' }}>Yenilə</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
