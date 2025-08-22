import React, { useState, useEffect, useCallback } from 'react';
import { IconContext } from 'react-icons';
import { 
  AiFillPlayCircle, 
  AiOutlineDownload, 
  AiOutlineHeart, 
  AiFillHeart,
  AiFillFire,
  AiOutlineLoading3Quarters,
  AiOutlineReload,
  AiOutlineInfoCircle
} from 'react-icons/ai';
import { BsBroadcast } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import musicService from '../../services/musicService';
import authService from '../../services/authService';
import { performanceMonitor } from '../../services/musicCache';
import './trending.css';

export default function Trending({ user }) {
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [userLibrary, setUserLibrary] = useState([]);
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
    
    loadTrendingMusic();
    if (user) {
      setUserLibrary(user.favorites || []);
    }
  }, [user]);

  // Reload music when region changes
  useEffect(() => {
    if (trendingMusic.length > 0) {
      loadTrendingMusic();
    }
  }, [selectedRegion]);

  const loadTrendingMusic = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Loading ${selectedRegion} trending music with enhanced service...`);
      
      // Use the enhanced music service with caching and parallel loading
      const trending = await musicService.getTrendingMusic(50, selectedRegion);
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ Loaded ${trending.length} tracks in ${loadTime}ms`);
      
      setTrendingMusic(trending);
      
    } catch (error) {
      console.error('Error loading trending music:', error);
      
      // Try to load just demo tracks as fallback
      try {
        console.log('🔄 Trying to load demo tracks as fallback...');
        const demoTracks = await musicService.getDemoTracks();
        setTrendingMusic(demoTracks);
        console.log(`✅ Loaded ${demoTracks.length} demo tracks as fallback`);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  const playTrack = (track) => {
    const filteredTracks = filterByCategory(trendingMusic);
    navigate("/player", { 
      state: { 
        track: track,
        tracks: filteredTracks
      }
    });
  };

  const toggleLibrary = (track) => {
    const isInLibrary = userLibrary.some(t => t.id === track.id);
    
    if (isInLibrary) {
      if (authService.removeFromFavorites(track.id)) {
        setUserLibrary(userLibrary.filter(t => t.id !== track.id));
      }
    } else {
      if (authService.addToFavorites(track)) {
        setUserLibrary([...userLibrary, track]);
      }
    }
  };

  const downloadTrack = async (track) => {
    try {
      await musicService.downloadTrack(track);
      // Show success message
    } catch (error) {
      console.error('Download failed:', error);
      // Show error message
    }
  };

  const filterByCategory = (tracks) => {
    // Always filter out radio stations - only show music tracks
    const musicTracks = tracks.filter(track => track.source !== 'radio');
    
    // Apply category filtering (region is already handled by API calls)
    switch (selectedCategory) {
      case 'music':
        return musicTracks;
      case 'radio':
        return []; // No radio stations available
      default:
        return musicTracks; // Default to music only
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredTracks = filterByCategory(trendingMusic);

  return (
    <div className="screen-container">
      <div className="trending-body">
        <div className="trending-header">
          <div className="trending-title-section">
            <h1>
              <AiFillFire className="trending-icon" />
              Trending Now
            </h1>
            <p>Discover what's hot in {selectedRegion === 'india' ? 'Indian' : 'global'} music right now</p>
            <button 
              onClick={loadTrendingMusic}
              className="refresh-trending-button"
              disabled={loading}
              style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                background: loading ? '#666' : 'linear-gradient(135deg, #667eea, #764ba2)', 
                border: 'none', 
                borderRadius: '20px', 
                color: 'white', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {loading ? 'Loading...' : `🔄 Refresh ${selectedRegion === 'india' ? 'Indian' : 'Global'} Trending`}
            </button>
          </div>
        </div>

        <div className="trending-tabs">
          <button 
            className={`tab-button ${selectedRegion === 'global' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('global')}
          >
            🌍 Global Trending
          </button>
          <button 
            className={`tab-button ${selectedRegion === 'india' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('india')}
          >
            🇮🇳 India Trending
          </button>
        </div>



        <div className="trending-tabs">
          <button 
            className={`tab-button ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Trending Music
          </button>
          <button 
            className={`tab-button ${selectedCategory === 'music' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('music')}
          >
            Popular Tracks
          </button>
          <button 
            className={`tab-button ${selectedCategory === 'radio' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('radio')}
            disabled={true}
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="Radio stations are not available"
          >
            Radio Stations (Disabled)
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <IconContext.Provider value={{ size: "40px", color: "#667eea" }}>
                <AiOutlineLoading3Quarters className="spinning" />
              </IconContext.Provider>
            </div>
            <p>Loading trending music...</p>
            <p className="loading-subtitle">This may take a few seconds</p>
            <button 
              onClick={() => setLoading(false)} 
              className="cancel-loading-button"
              style={{ marginTop: '20px', padding: '8px 16px', background: '#666', border: 'none', borderRadius: '20px', color: 'white', cursor: 'pointer' }}
            >
              Cancel Loading
            </button>
          </div>
        ) : (
          <>
            <div className="trending-stats">
              <div className="stat-item">
                <div className="stat-number">{filteredTracks.length}</div>
                <div className="stat-label">
                  {selectedRegion === 'global' ? 'Global Tracks' : 'Indian Tracks'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {new Set(filteredTracks.map(track => track.source)).size}
                </div>
                <div className="stat-label">Music Sources</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {filteredTracks.filter(track => track.artist && track.artist !== 'Unknown').length}
                </div>
                <div className="stat-label">Artists</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {selectedRegion === 'india' 
                    ? filteredTracks.filter(track => 
                        track.language === 'hindi' || 
                        track.language === 'punjabi' || 
                        track.language === 'tamil' || 
                        track.language === 'telugu' || 
                        track.language === 'malayalam'
                      ).length
                    : filteredTracks.filter(track => 
                        track.language === 'english' || 
                        track.language === 'spanish' || 
                        track.language === 'french'
                      ).length
                  }
                </div>
                <div className="stat-label">
                  {selectedRegion === 'india' ? 'Indian Languages' : 'Global Languages'}
                </div>
              </div>
            </div>

            <div className="trending-content">
              <h2>
                {selectedRegion === 'global' && (
                  <>
                    {selectedCategory === 'all' && '🌍 Global Trending Music'}
                    {selectedCategory === 'music' && '🌍 Global Popular Tracks'}
                    {selectedCategory === 'radio' && 'No Radio Stations Available'}
                  </>
                )}
                {selectedRegion === 'india' && (
                  <>
                    {selectedCategory === 'all' && '🇮🇳 India Trending Music'}
                    {selectedCategory === 'music' && '🇮🇳 India Popular Tracks'}
                    {selectedCategory === 'radio' && 'No Radio Stations Available'}
                  </>
                )}
              </h2>
              
              <div className="music-grid">
                {filteredTracks.map((track, index) => (
                  <div key={track.id} className="music-card">
                    <div className="trending-rank">
                      #{index + 1}
                    </div>
                    <div className="music-card-image">
                      {track.image ? (
                        <img src={track.image} alt={track.name} />
                      ) : (
                        <span>🎵</span>
                      )}
                      <div className="music-card-overlay" onClick={() => playTrack(track)}>
                        <IconContext.Provider value={{ size: "40px", color: "white" }}>
                          <AiFillPlayCircle />
                        </IconContext.Provider>
                      </div>
                    </div>
                    <div className="music-card-info">
                      <h3 className="music-card-title">{track.name}</h3>
                      <p className="music-card-artist">{track.artist}</p>
                      <p className="music-card-album">{track.album || 'Single'}</p>
                    </div>
                    <div className="music-card-meta">
                      <span className="music-card-duration">
                        {track.source === 'radio' ? 'LIVE' : formatDuration(track.duration)}
                      </span>
                      <span className={`music-card-source source-${track.source}`}>
                        {track.source === 'radio' ? <BsBroadcast /> : null}
                        {track.source}
                      </span>
                    </div>
                    <div className="music-card-actions">
                      {track.download_url && track.source !== 'radio' && (
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
                        className={`action-button favorite-button ${userLibrary.some(t => t.id === track.id) ? 'active' : ''}`}
                        onClick={() => toggleLibrary(track)}
                        title={userLibrary.some(t => t.id === track.id) ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <IconContext.Provider value={{ size: "16px" }}>
                          {userLibrary.some(t => t.id === track.id) ? <AiFillHeart /> : <AiOutlineHeart />}
                        </IconContext.Provider>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTracks.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    {selectedRegion === 'india' ? '🇮🇳' : '🌍'}
                  </div>
                  <h3>
                    {selectedRegion === 'india' 
                      ? 'No Indian Trending Music Available' 
                      : 'No Global Trending Music Available'
                    }
                  </h3>
                  <p>
                    {selectedRegion === 'india' 
                      ? 'Check back later for the latest trending Indian music tracks!' 
                      : 'Check back later for the latest trending global music tracks!'
                    }
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
