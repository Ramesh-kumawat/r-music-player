import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { AiOutlineSearch, AiOutlineDownload, AiOutlineUser, AiOutlineLogout } from "react-icons/ai";
import { MdSpaceDashboard, MdFavorite } from "react-icons/md";
import { FaGripfire, FaPlay } from "react-icons/fa";
import { IoLibrary } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import SidebarButton from './sidebarButton';
import './sidebar.css';

export default function Sidebar({ user, onLogout, onToggleAIChat }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className='sidebar-container'>
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            <AiOutlineUser size="24px" />
          </div>
          <div className="user-details">
            <h3>{user?.username || 'User'}</h3>
            <p>Music Lover</p>
          </div>
        </div>
      </div>

      <div className="sidebar-buttons">
        <SidebarButton title="Search" to="/search" icon={<AiOutlineSearch/>}/>
        <SidebarButton title="Feed" to="/feed" icon={<MdSpaceDashboard/>}/>
        <SidebarButton title="Trending" to="/trending" icon={<FaGripfire/>}/>
        <SidebarButton title="Player" to="/player" icon={<FaPlay/>}/>
        <SidebarButton title="Downloads" to="/downloads" icon={<AiOutlineDownload/>}/>
        <SidebarButton title="Favorites" to="/favorites" icon={<MdFavorite/>}/>
        <SidebarButton title="Library" to="/library" icon={<IoLibrary/>}/>
      </div>

      <div className="sidebar-footer">
        {/* AI Chat Button */}
        <button 
          className="sidebar-ai-button"
          onClick={onToggleAIChat}
          title="AI Music Assistant"
          style={{ border: '2px solid #ff0000' }} // Temporary debug border
        >
          <RiRobot2Line size="20px" />
          <span>AI Assistant</span>
        </button>
        
        <button className="logout-button" onClick={handleLogout}>
          <IconContext.Provider value={{ size: "20px" }}>
            <AiOutlineLogout />
          </IconContext.Provider>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
