import React, { useState, useEffect } from 'react';
import { IconContext } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { 
  AiFillPlayCircle, 
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineClockCircle,
  AiOutlineFire,
  AiOutlineStar,
  AiOutlineHistory,
  AiOutlineTrendingUp,
  AiOutlineUser,
  AiOutlineMusic
} from 'react-icons/ai';
import { BsDownload } from 'react-icons/bs';
import musicService from '../../services/musicService';
import './feed.css';

export default function Feed({ user }) {
  const navigate = useNavigate();
  const [recentTracks, setRecentTracks] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('for-you');
  const [userLibrary, setUserLibrary] = useState([]);

  useEffect(() => {
    // Scroll to top when component mounts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    loadFeedData();
    if (user && user.favorites) {
      setUserLibrary(user.favorites);
    }
  }, [user]);

  const loadFeedData = async () => {
    try {
      setLoading(true);
      
      // Load recent tracks from localStorage
      const recent = JSON.parse(localStorage.getItem('recentTracks') || '[]');
      setRecentTracks(recent.slice(0, 10));
      
      // Load trending tracks
      const trending = await musicService.getTrendingMusic(20);
      setTrendingTracks(trending.slice(0, 15));
      
      // Load recommended tracks based on user preferences
      const recommended = await loadRecommendedTracks();
      setRecommendedTracks(recommended);
      
      // Load user activity
      const activity = loadUserActivity();
      setUserActivity(activity);
      
    } catch (error) {
      console.error('Error loading feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedTracks = async () => {
    try {
      // Get user's favorite genres/artists from their library
      const userGenres = extractUserGenres();
      
      // Search for tracks in user's preferred genres
      let recommendations = [];
      
      if (userGenres.length > 0) {
        for (const genre of userGenres.slice(0, 3)) {
          try {
            const tracks = await musicService.searchAllSources(genre, 5, 1);
            recommendations.push(...tracks);
          } catch (error) {
            console.log(`Error searching for ${genre}:`, error);
          }
        }
      }
      
      // If no recommendations, fall back to trending
      if (recommendations.length === 0) {
        const trending = await musicService.getTrendingMusic(10);
        recommendations = trending;
      }
      
      return recommendations.slice(0, 15);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      return [];
    }
  };

  const extractUserGenres = () => {
    if (!userLibrary || userLibrary.length === 0) return [];
    
    // Extract genres from user's library (this is a simplified approach)
    const genres = new Set();
    userLibrary.forEach(track => {
      if (track.genre) genres.add(track.genre);
      if (track.tags && Array.isArray(track.tags)) {
        track.tags.forEach(tag => genres.add(tag));
      }
    });
    
    return Array.from(genres);
  };

  const loadUserActivity = () => {
    const activity = [];
    
    // Recent plays
    const recentPlays = JSON.parse(localStorage.getItem('recentPlays') || '[]');
    if (recentPlays.length > 0) {
      activity.push({
        type: 'recent-play',
        title: 'Recently Played',
        data: recentPlays.slice(0, 5),
        icon: <AiOutlineHistory />
      });
    }
    
    // Downloads
    const downloads = musicService.getDownloadedTracks();
    if (downloads.length > 0) {
      activity.push({
        type: 'downloads',
        title: 'Recent Downloads',
        data: downloads.slice(0, 5),
        icon: <BsDownload />
      });
    }
    
    // Favorites
    if (userLibrary && userLibrary.length > 0) {
      activity.push({
        type: 'favorites',
        title: 'Your Favorites',
        data: userLibrary.slice(0, 5),
        icon: <AiOutlineHeart />
      });
    }
    
    return activity;
  };

  const playTrack = (track, source = 'feed') => {
    console.log('Playing track from feed:', track);
    
    // Add to recent tracks
    const recent = JSON.parse(localStorage.getItem('recentTracks') || '[]');
    const updatedRecent = [track, ...recent.filter(t => t.id !== track.id)].slice(0, 50);
    localStorage.setItem('recentTracks', JSON.stringify(updatedRecent));
    
    // Add to recent plays
    const recentPlays = JSON.parse(localStorage.getItem('recentPlays') || '[]');
    const updatedPlays = [track, ...recentPlays.filter(t => t.id !== track.id)].slice(0, 50);
    localStorage.setItem('recentPlays', JSON.stringify(updatedPlays));
    
    // Navigate to player
    navigate("/player", {
      state: { 
        tracks: [track], 
        currentIndex: 0,
        source: source
      }
    });
  };

  const toggleLibrary = (track) => {
    if (!user || !user.favorites) return;
    
    const isInLibrary = userLibrary.some(t => t.id === track.id);
    
    if (isInLibrary) {
      // Remove from favorites
      const updatedFavorites = user.favorites.filter(t => t.id !== track.id);
      user.favorites = updatedFavorites;
      localStorage.setItem('userFavorites', JSON.stringify(updatedFavorites));
      setUserLibrary(updatedFavorites);
    } else {
      // Add to favorites
      const updatedFavorites = [...user.favorites, track];
      user.favorites = updatedFavorites;
      localStorage.setItem('userFavorites', JSON.stringify(updatedFavorites));
      setUserLibrary(updatedFavorites);
    }
  };

  const isInLibrary = (track) => {
    if (!track || !track.id || !userLibrary || userLibrary.length === 0) return false;
    return userLibrary.some(t => t.id === track.id);
  };

  const getTrackDisplayName = (track) => {
    if (!track) return 'Unknown Track';
    return track.name || track.title || track.track?.name || 'Unknown Track';
  };

  const getTrackArtist = (track) => {
    if (!track) return 'Unknown Artist';
    return track.artist || track.artists?.[0] || track.track?.artist || 'Unknown Artist';
  };

  const getTrackImage = (track) => {
    if (!track) return '/logo192.png';
    return track.image || track.artwork || track.albumArt || '/logo192.png';
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 0) return '0:00';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="screen-container">
        <div className="feed-loading">
          <div className="loading-spinner"></div>
          <p>Loading your personalized feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="feed-container">
        {/* Header */}
        <div className="feed-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Music Feed</h1>
              <p>Discover new music tailored for you</p>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-number">{recentTracks.length + trendingTracks.length}</span>
                <span className="stat-label">Tracks</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userActivity.length}</span>
                <span className="stat-label">Activities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="feed-tabs">
          <button 
            className={`tab-button ${activeTab === 'for-you' ? 'active' : ''}`}
            onClick={() => setActiveTab('for-you')}
          >
            <AiOutlineStar />
            For You
          </button>
          <button 
            className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            <AiOutlineFire />
            Trending
          </button>
          <button 
            className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <AiOutlineClockCircle />
            Recent
          </button>
          <button 
            className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <AiOutlineUser />
            Activity
          </button>
        </div>

        {/* Feed Content */}
        <div className="feed-content">
          {activeTab === 'for-you' && (
            <div className="feed-section">
              <div className="section-header">
                <h2>Recommended for You</h2>
                <p>Based on your listening history and preferences</p>
              </div>
              <div className="tracks-grid">
                {recommendedTracks.map((track, index) => (
                  <div key={`rec-${track.id || index}`} className="track-card">
                    <div className="track-image">
                      <img 
                        src={getTrackImage(track)} 
                        alt={getTrackDisplayName(track)}
                        onError={(e) => {
                          e.target.src = '/logo192.png';
                        }}
                      />
                      <div className="play-overlay">
                        <button 
                          className="play-btn"
                          onClick={() => playTrack(track, 'recommendations')}
                          title="Play track"
                        >
                          <AiFillPlayCircle size="24" />
                        </button>
                      </div>
                    </div>
                    <div className="track-info">
                      <h3 className="track-title">{getTrackDisplayName(track)}</h3>
                      <p className="track-artist">{getTrackArtist(track)}</p>
                      <div className="track-meta">
                        <span className="track-duration">{formatDuration(track.duration)}</span>
                        <span className="track-source">{track.source || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="track-actions">
                      <button 
                        className={`action-btn ${isInLibrary(track) ? 'active' : ''}`}
                        onClick={() => toggleLibrary(track)}
                        title={isInLibrary(track) ? 'Remove from library' : 'Add to library'}
                      >
                        {isInLibrary(track) ? <AiFillHeart size="16" /> : <AiOutlineHeart size="16" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'trending' && (
            <div className="feed-section">
              <div className="section-header">
                <h2>Trending Now</h2>
                <p>What's hot in the music world</p>
              </div>
              <div className="tracks-grid">
                {trendingTracks.map((track, index) => (
                  <div key={`trend-${track.id || index}`} className="track-card">
                    <div className="track-image">
                      <img 
                        src={getTrackImage(track)} 
                        alt={getTrackDisplayName(track)}
                        onError={(e) => {
                          e.target.src = '/logo192.png';
                        }}
                      />
                      <div className="play-overlay">
                        <button 
                          className="play-btn"
                          onClick={() => playTrack(track, 'trending')}
                          title="Play track"
                        >
                          <AiFillPlayCircle size="24" />
                        </button>
                      </div>
                    </div>
                    <div className="track-info">
                      <h3 className="track-title">{getTrackDisplayName(track)}</h3>
                      <p className="track-artist">{getTrackArtist(track)}</p>
                      <div className="track-meta">
                        <span className="track-duration">{formatDuration(track.duration)}</span>
                        <span className="track-source">{track.source || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="track-actions">
                      <button 
                        className={`action-btn ${isInLibrary(track) ? 'active' : ''}`}
                        onClick={() => toggleLibrary(track)}
                        title={isInLibrary(track) ? 'Remove from library' : 'Add to library'}
                      >
                        {isInLibrary(track) ? <AiFillHeart size="16" /> : <AiOutlineHeart size="16" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="feed-section">
              <div className="section-header">
                <h2>Recently Played</h2>
                <p>Your listening history</p>
              </div>
              <div className="tracks-grid">
                {recentTracks.map((track, index) => (
                  <div key={`recent-${track.id || index}`} className="track-card">
                    <div className="track-image">
                      <img 
                        src={getTrackImage(track)} 
                        alt={getTrackDisplayName(track)}
                        onError={(e) => {
                          e.target.src = '/logo192.png';
                        }}
                      />
                      <div className="play-overlay">
                        <button 
                          className="play-btn"
                          onClick={() => playTrack(track, 'recent')}
                          title="Play track"
                        >
                          <AiFillPlayCircle size="24" />
                        </button>
                      </div>
                    </div>
                    <div className="track-info">
                      <h3 className="track-title">{getTrackDisplayName(track)}</h3>
                      <p className="track-artist">{getTrackArtist(track)}</p>
                      <div className="track-meta">
                        <span className="track-duration">{formatDuration(track.duration)}</span>
                        <span className="track-source">{track.source || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="track-actions">
                      <button 
                        className={`action-btn ${isInLibrary(track) ? 'active' : ''}`}
                        onClick={() => toggleLibrary(track)}
                        title={isInLibrary(track) ? 'Remove from library' : 'Add to library'}
                      >
                        {isInLibrary(track) ? <AiFillHeart size="16" /> : <AiOutlineHeart size="16" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="feed-section">
              <div className="section-header">
                <h2>Your Activity</h2>
                <p>Your music journey</p>
              </div>
              <div className="activity-list">
                {userActivity.map((activity, index) => (
                  <div key={`activity-${index}`} className="activity-card">
                    <div className="activity-header">
                      <div className="activity-icon">
                        {activity.icon}
                      </div>
                      <h3>{activity.title}</h3>
                    </div>
                    <div className="activity-tracks">
                      {activity.data.map((track, trackIndex) => (
                        <div key={`${activity.type}-${track.id || trackIndex}`} className="activity-track">
                          <div className="track-image-small">
                            <img 
                              src={getTrackImage(track)} 
                              alt={getTrackDisplayName(track)}
                              onError={(e) => {
                                e.target.src = '/logo192.png';
                              }}
                            />
                          </div>
                          <div className="track-info-small">
                            <h4>{getTrackDisplayName(track)}</h4>
                            <p>{getTrackArtist(track)}</p>
                          </div>
                          <div className="track-actions-small">
                            <button 
                              className="play-btn-small"
                              onClick={() => playTrack(track, activity.type)}
                              title="Play track"
                            >
                              <AiFillPlayCircle size="16" />
                            </button>
                            <button 
                              className={`action-btn-small ${isInLibrary(track) ? 'active' : ''}`}
                              onClick={() => toggleLibrary(track)}
                              title={isInLibrary(track) ? 'Remove from library' : 'Add to library'}
                            >
                              {isInLibrary(track) ? <AiFillHeart size="14" /> : <AiOutlineHeart size="14" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
