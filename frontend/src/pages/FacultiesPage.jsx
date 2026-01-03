import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, LogOut, User, BookOpen } from 'lucide-react';
import { FACULTIES } from '../utils/constants';
import './FacultiesPage.css';

const FacultiesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleFacultyClick = (faculty) => {
    navigate(`/chat/${encodeURIComponent(faculty)}`);
  };

  return (
    <div className="faculties-container">
      <header className="faculties-header">
        <div className="header-content">
          <div className="header-left">
            <BookOpen size={32} />
            <h1>BSU Chat</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <User size={20} />
              <span>{user?.fullName}</span>
            </div>
            <button onClick={logout} className="logout-btn">
              <LogOut size={20} />
              Çıxış
            </button>
          </div>
        </div>
      </header>

      <div className="faculties-content">
        <div className="content-banner">
          <h2>Fakültə otaqları</h2>
          <p>Fakültənizi seçin və söhbətə qoşulun</p>
        </div>

        <div className="faculties-grid">
          {FACULTIES.map((faculty, index) => (
            <div key={index} className="faculty-card" onClick={() => handleFacultyClick(faculty)}>
              <div className="faculty-icon">
                <MessageSquare size={24} />
              </div>
              <h3>{faculty}</h3>
              <p>Söhbət otağı</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultiesPage;
