// src/pages/home/home.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Library from '../library/library';
import Feed from '../feed/feed';
import Trending from '../trending/trending';
import Player from '../player/player';
import Favorites from '../favorites/favorites';
import Search from '../search/search';
import Downloads from '../downloads/downloads';
import Sidebar from '../../components/sidebar';
import Login from '../auth/login';
import AIChat from '../../components/aiChat/aiChat';
import ScrollToTop from '../../components/ScrollToTop';
import authService from '../../services/authService';
import './home.css';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 seconds timeout
    
    // Clear timeout if user is found quickly
    if (currentUser) {
      clearTimeout(timeout);
      setLoading(false);
    }
    
    return () => clearTimeout(timeout);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setShowAIChat(false); // Close AI chat on logout
  };

  const toggleAIChat = () => {
    setShowAIChat(!showAIChat);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Initializing app...</p>
      </div>
    );
  }

  return !user ? (
    <Login onLogin={handleLogin} />
  ) : (
    <Router basename="/r-music-player">
      <ScrollToTop />
      <div className="main-body">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          onToggleAIChat={toggleAIChat}
        />
        <Routes>
          <Route path="/library" element={<Library user={user} />} />
          <Route path="/feed" element={<Feed user={user} />} />
          <Route path="/trending" element={<Trending user={user} />} />
          <Route path="/player" element={<Player user={user} />} />
          <Route path="/favorites" element={<Favorites user={user} />} />
          <Route path="/search" element={<Search user={user} />} />
          <Route path="/downloads" element={<Downloads user={user} />} />
          <Route path="/" element={<Search user={user} />} />
        </Routes>
        
        {/* AI Chat Assistant */}
        {showAIChat && (
          <AIChat 
            user={user} 
            onClose={() => setShowAIChat(false)}
            onSearchRequest={(query) => {
              // Handle AI search requests
              console.log('AI Search Request:', query);
              setShowAIChat(false);
              // You can navigate to search page with the query here
            }}
          />
        )}
      </div>
    </Router>
  );
}

