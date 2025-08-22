import React, { useState, useEffect } from 'react';
import "./library.css";
import { IconContext } from "react-icons";
import { AiFillPlayCircle, AiOutlinePlus } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function Library({ user }) {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  useEffect(() => {
    // Scroll to top when component mounts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const container = document.querySelector('.screen-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    
    if (user) {
      setPlaylists(user.playlists || []);
    }
  }, [user]);

  const navigate = useNavigate();

  const playPlaylist = (playlist) => {
    navigate("/player", { state: { tracks: playlist.tracks, playlist: playlist } });
  };

  const createPlaylist = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist = authService.createPlaylist(newPlaylistName, newPlaylistDescription);
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="screen-container">
      <div className="library-body">
        <div className="library-header">
          <h1>Your Library</h1>
          <button 
            className="create-playlist-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <AiOutlinePlus /> Create Playlist
          </button>
        </div>

        {showCreateForm && (
          <div className="create-playlist-form">
            <input
              type="text"
              placeholder="Playlist Name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="playlist-name-input"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              className="playlist-desc-input"
            />
            <div className="form-buttons">
              <button onClick={createPlaylist} className="save-btn">Create</button>
              <button onClick={() => setShowCreateForm(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}

        {playlists.length === 0 ? (
          <div className="empty-library">
            <h2>No Playlists Yet</h2>
            <p>Create your first playlist to get started!</p>
          </div>
        ) : (
          <div className="playlists-grid">
            {playlists.map((playlist) => (
              <div className='playlist-card'
                key={playlist.id}
                onClick={() => playPlaylist(playlist)}
              >
                <div className="playlist-image-placeholder">
                  <span>🎵</span>
                </div>
                <p className='playlist-title'>{playlist.name}</p>
                <p className='playlist-subtitle'>{playlist.tracks.length} Songs</p>
                <div className='playlist-fade'>
                  <IconContext.Provider value={{ size: "50px", color: "#E99D72" }}>
                    <AiFillPlayCircle />
                  </IconContext.Provider>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
