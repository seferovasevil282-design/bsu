import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/faculties');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <GraduationCap size={40} />
          </div>
          <h2 className="auth-title">BSU Chat</h2>
          <p className="auth-subtitle">Daxil ol</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="email@bsu.edu.az"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Şifrə"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button 
            type="submit" 
            className="auth-button auth-button-primary"
            disabled={loading}
          >
            {loading ? 'Gözləyin...' : 'Daxil ol'}
          </button>

          <button 
            type="button" 
            className="auth-button auth-button-secondary"
            onClick={() => navigate('/register')}
          >
            ✏️ Qeydiyyat
          </button>

          <button 
            type="button" 
            className="auth-button auth-button-admin"
            onClick={() => navigate('/admin/login')}
          >
            Hesabları idarə et
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
