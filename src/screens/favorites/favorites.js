import React, { useState, useEffect } from 'react';
import { IconContext } from 'react-icons';
import { 
  AiFillPlayCircle, 
  AiOutlineHeart, 
  AiFillHeart,
  AiOutlineDownload,
  AiOutlinePlus 
} from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import musicService from '../../services/musicService';
import './favorites.css';

export default function Favorites({ user }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when component mounts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const container = document.querySelector('.screen-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    
    if (user && user.favorites) {
      setFavorites(user.favorites);
    }
    setLoading(false);
  }, [user]);

  const playTrack = (track) => {
    navigate("/player", { 
      state: { 
        track: track,
        tracks: favorites
      }
    });
  };

  const removeFromFavorites = (trackId) => {
    if (authService.removeFromFavorites(trackId)) {
      setFavorites(favorites.filter(track => track.id !== trackId));
    }
  };

  const downloadTrack = async (track) => {
    try {
      await musicService.downloadTrack(track);
      // Show success message or update UI
    } catch (error) {
      console.error('Download failed:', error);
      // Show error message
    }
  };

  const playAllFavorites = () => {
    if (favorites.length > 0) {
      navigate("/player", { 
        state: { 
          tracks: favorites
        }
      });
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="screen-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="favorites-body">
        <div className="favorites-header">
          <h1>Your Favorites</h1>
          {favorites.length > 0 && (
            <div className="favorites-actions">
              <button className="play-all-btn" onClick={playAllFavorites}>
                <AiFillPlayCircle /> Play All
              </button>
            </div>
          )}
        </div>

        {favorites.length > 0 && (
          <div className="favorites-stats">
            <div className="stat-item">
              <div className="stat-number">{favorites.length}</div>
              <div className="stat-label">Tracks</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {Math.floor(favorites.reduce((total, track) => total + (track.duration || 0), 0) / 60000)}
              </div>
              <div className="stat-label">Minutes</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {new Set(favorites.map(track => track.source)).size}
              </div>
              <div className="stat-label">Sources</div>
            </div>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="empty-favorites">
            <div className="empty-favorites-icon">💝</div>
            <h3>No Favorites Yet</h3>
            <p>Start exploring music and add tracks to your favorites by clicking the heart icon!</p>
            <button 
              className="browse-music-btn"
              onClick={() => navigate('/search')}
            >
              <AiOutlinePlus /> Browse Music
            </button>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((track, index) => (
              <div key={track.id} className="favorite-item">
                <div className="favorite-item-number">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="favorite-item-image">
                  {track.image ? (
                    <img src={track.image} alt={track.name} />
                  ) : (
                    <span>🎵</span>
                  )}
                  <div className="favorite-item-overlay" onClick={() => playTrack(track)}>
                    <IconContext.Provider value={{ size: "24px", color: "white" }}>
                      <AiFillPlayCircle />
                    </IconContext.Provider>
                  </div>
                </div>
                <div className="favorite-item-info">
                  <h3 className="favorite-item-title">{track.name}</h3>
                  <p className="favorite-item-artist">{track.artist}</p>
                  <p className="favorite-item-album">{track.album || 'Single'}</p>
                </div>
                <div className="favorite-item-meta">
                  <span className={`favorite-item-source source-${track.source}`}>
                    {track.source}
                  </span>
                  <span className="favorite-item-duration">
                    {formatDuration(track.duration)}
                  </span>
                </div>
                <div className="favorite-item-actions">
                  {track.download_url && (
                    <button 
                      className="action-button download-button"
                      onClick={() => downloadTrack(track)}
                      title="Download"
                    >
                      <IconContext.Provider value={{ size: "16px" }}>
                        <AiOutlineDownload />
                      </IconContext.Provider>
                    </button>
                  )}
                  <button 
                    className="action-button favorite-button active"
                    onClick={() => removeFromFavorites(track.id)}
                    title="Remove from Favorites"
                  >
                    <IconContext.Provider value={{ size: "16px" }}>
                      <AiFillHeart />
                    </IconContext.Provider>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
