import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../utils/api';
import './LoginPage.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/admin/login', formData);
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
      navigate('/admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || 'Giriş uğursuz');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Shield size={40} />
          </div>
          <h2 className="auth-title">Admin Paneli</h2>
          <p className="auth-subtitle">İstifadəçi adı və şifrə</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="İSTİFADƏÇİ ADI"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="auth-input"
            required
          />
          
          <input
            type="password"
            placeholder="ŞİFRƏ"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="auth-input"
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button auth-button-admin" disabled={loading}>
            {loading ? 'Gözləyin...' : 'Daxil ol'}
          </button>

          <button type="button" onClick={() => navigate('/')} className="auth-button auth-button-secondary">
            Geri
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
