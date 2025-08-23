import React, { useState, useRef, useEffect } from 'react';
import { IconContext } from 'react-icons';
import { 
  AiOutlineSend, 
  AiOutlineRobot, 
  AiOutlineUser, 
  AiOutlineClear,
  AiFillBulb,
  AiOutlineSearch,
  AiOutlineHeart,
  AiOutlinePlayCircle,
  AiOutlineLeft,
  AiOutlineRight
} from 'react-icons/ai';
import aiService from '../../services/aiService';
import './aiChat.css';

// Simple markdown renderer for chat messages
const renderMarkdown = (text) => {
  if (!text) return '';
  
  // Convert markdown to HTML
  let html = text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text: *text* -> <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet points: • text -> <li>text</li>
    .replace(/•\s*(.*?)(?=\n|$)/g, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Multiple line breaks -> paragraph breaks
    .replace(/<br><br>/g, '</p><p>')
    // Wrap in paragraphs
    .replace(/^(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br><\/p>/g, '')
    // Clean up leading/trailing paragraphs
    .replace(/^<p>|<\/p>$/g, '');

  return html;
};

export default function AIChat({ user, onClose, onSearchRequest }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [aiSource, setAiSource] = useState('local'); // Track AI source
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `Hello ${user?.username || 'Music Lover'}! 🎵 I'm your AI music assistant powered by **Real AI Intelligence** - connecting to multiple AI services for the best responses! I can help you:

• Discover new music and artists
• Create personalized playlists
• Find songs for specific moods
• Get music recommendations
• Answer music-related questions

What would you like to explore today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setHasError(false);

    try {
      // Get user preferences for context
      const userPreferences = {
        username: user?.username,
        favorites: user?.favorites?.length || 0,
        preferredGenres: extractGenresFromFavorites(user?.favorites || [])
      };

      const response = await aiService.chatWithAI(inputMessage, userPreferences);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        success: response.success,
        isFallback: response.isFallback,
        source: response.source || 'local'
      };

      setMessages(prev => [...prev, assistantMessage]);
      setAiSource(response.source || 'local');

      // Check if the message contains search-related content
      if (response.success && isSearchRelated(inputMessage)) {
        // Add a suggestion to use AI search
        const searchSuggestion = {
          id: Date.now() + 2,
          type: 'assistant',
          content: `💡 **Pro Tip**: I can also help you with intelligent music search! Try asking me to "find songs about love" or "search for upbeat workout music" and I'll convert it to a smart search query.`,
          timestamp: new Date().toISOString(),
          isSuggestion: true
        };
        setMessages(prev => [...prev, searchSuggestion]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setHasError(true);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    aiService.clearHistory();
    setHasError(false);
    setAiSource('local');
    // Re-add welcome message
    const welcomeMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `Hello ${user?.username || 'Music Lover'}! 🎵 I'm your AI music assistant powered by **Real AI Intelligence** - connecting to multiple AI services for the best responses! I can help you:

• Discover new music and artists
• Create personalized playlists
• Find songs for specific moods
• Get music recommendations
• Answer music-related questions

What would you like to explore today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  };

  const extractGenresFromFavorites = (favorites) => {
    const genres = new Set();
    favorites.forEach(track => {
      if (track.genre) genres.add(track.genre);
      if (track.tags && Array.isArray(track.tags)) {
        track.tags.forEach(tag => genres.add(tag));
      }
    });
    return Array.from(genres);
  };

  const isSearchRelated = (message) => {
    const searchKeywords = ['find', 'search', 'look for', 'discover', 'recommend', 'suggest'];
    return searchKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  };

  const handleQuickAction = (action) => {
    const quickMessages = {
      recommendations: "I'd love to give you personalized music recommendations! What's your current mood? (happy, sad, energetic, relaxed, etc.)",
      playlist: "Great idea! What kind of playlist would you like me to help you create? (workout, study, party, chill, etc.)",
      discovery: "Let's discover some amazing music! What genre or mood are you interested in exploring today?",
      search: "I can help you with intelligent music search! Try asking me to find songs about specific topics, moods, or activities."
    };

    const quickMessage = {
      id: Date.now(),
      type: 'user',
      content: `I want ${action}`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, quickMessage]);
    setInputMessage(quickMessages[action]);
  };

  const toggleHidden = () => {
    setIsHidden(!isHidden);
  };

  if (isHidden) {
    return (
      <div className="ai-chat-hidden">
        <button 
          className="show-chat-btn"
          onClick={toggleHidden}
          title="Show AI Assistant"
        >
          <AiOutlineRight size="20" />
          <span>AI Assistant</span>
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="ai-chat-minimized" onClick={() => setIsMinimized(false)}>
        <AiOutlineRobot size="24" />
        <span>AI Assistant</span>
        <div className="notification-dot"></div>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      {/* Hide/Show Arrow Button */}
      <button 
        className="hide-chat-btn"
        onClick={toggleHidden}
        title="Hide AI Assistant"
      >
        <AiOutlineLeft size="16" />
      </button>

      {/* Header */}
      <div className="ai-chat-header">
        <div className="header-left">
          <AiOutlineRobot className="ai-icon" />
          <div className="header-info">
            <h3>AI Music Assistant</h3>
            <span className={`status ${hasError ? 'error' : ''}`}>
              {hasError ? 'Connection Error' : 'Powered by Real AI Intelligence'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            −
          </button>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="quick-action-btn"
          onClick={() => handleQuickAction('recommendations')}
        >
          <AiOutlineHeart />
          <span>Get Recommendations</span>
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => handleQuickAction('playlist')}
        >
          <AiOutlinePlayCircle />
          <span>Create Playlist</span>
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => handleQuickAction('discovery')}
        >
          <AiFillBulb />
          <span>Discover Music</span>
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => handleQuickAction('search')}
        >
          <AiOutlineSearch />
          <span>Smart Search</span>
        </button>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.type} ${message.isError ? 'error' : ''} ${message.isSuggestion ? 'suggestion' : ''} ${message.isFallback ? 'fallback' : ''}`}
          >
            <div className="message-avatar">
              {message.type === 'user' ? (
                <AiOutlineUser size="20" />
              ) : (
                <AiOutlineRobot size="20" />
              )}
            </div>
            <div className="message-content">
              <div 
                className="message-text"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(message.content) 
                }}
              />
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {message.source && message.type === 'assistant' && (
                  <span className="message-source">
                    {message.source === 'local' ? '🧠 Enhanced Intelligence' : `🤖 ${message.source.charAt(0).toUpperCase() + message.source.slice(1)} AI`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <AiOutlineRobot size="20" />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about music, playlists, or recommendations..."
            rows="1"
            className="message-input"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
            title="Send message"
          >
            <AiOutlineSend size="18" />
          </button>
        </div>
        
        <div className="input-actions">
          <button 
            onClick={clearChat}
            className="clear-btn"
            title="Clear chat history"
          >
            <AiOutlineClear size="16" />
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
}
