import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap } from 'lucide-react';
import { FACULTIES, DEGREES, COURSES, ANSWER_OPTIONS } from '../utils/constants';
import api from '../utils/api';
import './LoginPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '+994',
    email: '',
    password: '',
    faculty: '',
    degree: '',
    course: 1,
    verificationAnswers: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/auth/verification-questions');
      setQuestions(response.data.questions);
    } catch (error) {
      setError('Suallar yüklənmədi');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (!value.startsWith('+994')) {
      value = '+994';
    }
    if (value.length > 13) {
      value = value.slice(0, 13);
    }
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleAnswerChange = (questionId, answer) => {
    setFormData(prev => {
      const answers = prev.verificationAnswers.filter(a => a.questionId !== questionId);
      answers.push({ questionId, answer });
      return { ...prev, verificationAnswers: answers };
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone || !formData.email || !formData.password) {
        setError('Bütün xanaları doldurun');
        return;
      }
      if (formData.phone.length !== 13) {
        setError('Telefon nömrəsi 9 rəqəm olmalıdır');
        return;
      }
      if (!formData.email.endsWith('@bsu.edu.az')) {
        setError('Email @bsu.edu.az ilə bitməlidir');
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.faculty || !formData.degree || !formData.course) {
        setError('Bütün xanaları doldurun');
        return;
      }
    }
    
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.verificationAnswers.length !== 3) {
      setError('Bütün sualları cavablandırın');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(formData);
    
    if (result.success) {
      navigate('/faculties');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="auth-icon">
            <GraduationCap size={40} />
          </div>
          <h2 className="auth-title">BSU Chat</h2>
          <p className="auth-subtitle">Qeydiyyat - Addım {step}/3</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <>
              <input
                type="text"
                name="fullName"
                placeholder="Ad Soyad"
                value={formData.fullName}
                onChange={handleChange}
                className="auth-input"
                required
              />
              
              <input
                type="tel"
                name="phone"
                placeholder="+994XXXXXXXXX"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="auth-input"
                required
              />
              
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="emailPrefix"
                  placeholder="email"
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value + '@bsu.edu.az' }))}
                  className="auth-input"
                  style={{ paddingRight: '120px' }}
                  required
                />
                <span style={{ position: 'absolute', right: '16px', top: '14px', color: '#666', fontSize: '15px' }}>
                  @bsu.edu.az
                </span>
              </div>
              
              <input
                type="password"
                name="password"
                placeholder="Şifrə"
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </>
          )}

          {step === 2 && (
            <>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="auth-input"
                required
              >
                <option value="">Fakültə seçin</option>
                {FACULTIES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              
              <select
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className="auth-input"
                required
              >
                <option value="">Dərəcə seçin</option>
                {DEGREES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="auth-input"
                required
              >
                <option value="">Kurs seçin</option>
                {COURSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}

          {step === 3 && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    {idx + 1}. {q.question}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {ANSWER_OPTIONS.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleAnswerChange(q.id, option)}
                        className="auth-button auth-button-secondary"
                        style={{
                          padding: '10px',
                          background: formData.verificationAnswers.find(a => a.questionId === q.id)?.answer === option 
                            ? '#667eea' : 'white',
                          color: formData.verificationAnswers.find(a => a.questionId === q.id)?.answer === option 
                            ? 'white' : '#667eea'
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="auth-button auth-button-secondary"
                style={{ flex: 1 }}
              >
                Geri
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="auth-button auth-button-primary"
                style={{ flex: 1 }}
              >
                Növbəti
              </button>
            ) : (
              <button
                type="submit"
                className="auth-button auth-button-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Gözləyin...' : 'Qeydiyyatdan keç'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="auth-button auth-button-secondary"
          >
            Girişə qayıt
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
