import React, { useState, useEffect } from 'react';
import { IconContext } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { 
  AiFillPlayCircle, 
  AiOutlineDelete,
  AiOutlineFolder,
  AiOutlineHeart,
  AiFillHeart 
} from 'react-icons/ai';
import { BsDownload } from 'react-icons/bs';
import musicService from '../../services/musicService';
import './downloads.css';

export default function Downloads({ user }) {
  const navigate = useNavigate();
  const [downloadedTracks, setDownloadedTracks] = useState([]);
  const [userLibrary, setUserLibrary] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [sortBy, setSortBy] = useState('downloadedAt'); // downloadedAt, name, artist
  const [filterBy, setFilterBy] = useState('all'); // all, jamendo, musiq
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Scroll to top when component mounts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const container = document.querySelector('.screen-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    
    loadDownloadedTracks();
    // Use user.favorites instead of non-existent getUserLibrary function
    if (user && user.favorites) {
      setUserLibrary(user.favorites);
    }
  }, [user]);

  const loadDownloadedTracks = () => {
    const tracks = musicService.getDownloadedTracks();
    setDownloadedTracks(tracks);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 0) return 'Unknown';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalSize = () => {
    // Estimate: average MP3 file is about 1MB per minute
    const totalMinutes = downloadedTracks.reduce((acc, track) => 
      acc + (track.duration ? track.duration / 60000 : 3), 0
    );
    return Math.round(totalMinutes) + ' MB (estimated)';
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

  const getTrackAlbum = (track) => {
    if (!track) return 'Unknown Album';
    return track.album || track.track?.album || 'Unknown Album';
  };

  const getTrackSource = (track) => {
    if (!track) return 'unknown';
    return track.source || 'unknown';
  };

  const getTrackImage = (track) => {
    if (!track) return '/logo192.png';
    return track.image || track.artwork || track.albumArt || '/logo192.png';
  };

  const playTrack = (track) => {
    console.log('Playing downloaded track:', track);
    // Navigate to player with the selected track
    navigate("/player", {
      state: { 
        tracks: downloadedTracks, 
        currentIndex: downloadedTracks.findIndex(t => t.id === track.id),
        source: 'downloads'
      }
    });
  };

  const removeDownload = (trackId) => {
    if (window.confirm('Are you sure you want to remove this downloaded track?')) {
      try {
        // Use the musicService method to remove the track
        musicService.removeDownloadedTrack(trackId);
        // Reload the tracks to update the UI
        loadDownloadedTracks();
        console.log('Download removed successfully');
      } catch (error) {
        console.error('Error removing download:', error);
        alert('Failed to remove download. Please try again.');
      }
    }
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

  const toggleTrackSelection = (trackId) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const selectAllTracks = () => {
    if (selectedTracks.length === filteredAndSortedTracks.length) {
      setSelectedTracks([]);
    } else {
      setSelectedTracks(filteredAndSortedTracks.map(track => track.id));
    }
  };

  const deleteSelectedTracks = () => {
    if (selectedTracks.length === 0) return;
    
    if (window.confirm(`Are you sure you want to remove ${selectedTracks.length} selected tracks?`)) {
      try {
        // Remove each selected track using the musicService
        selectedTracks.forEach(trackId => {
          musicService.removeDownloadedTrack(trackId);
        });
        
        // Clear selection and reload tracks
        setSelectedTracks([]);
        loadDownloadedTracks();
        console.log('Selected downloads removed successfully');
      } catch (error) {
        console.error('Error removing selected downloads:', error);
        alert('Failed to remove some downloads. Please try again.');
      }
    }
  };

  const sortTracks = (tracks) => {
    return [...tracks].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return getTrackDisplayName(a).localeCompare(getTrackDisplayName(b));
        case 'artist':
          return getTrackArtist(a).localeCompare(getTrackArtist(b));
        case 'downloadedAt':
        default:
          return new Date(b.downloadedAt) - new Date(a.downloadedAt);
      }
    });
  };

  const filterTracks = (tracks) => {
    let filtered = tracks;
    
    // Apply source filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(track => getTrackSource(track) === filterBy);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track => 
        getTrackDisplayName(track).toLowerCase().includes(query) ||
        getTrackArtist(track).toLowerCase().includes(query) ||
        getTrackAlbum(track).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredAndSortedTracks = sortTracks(filterTracks(downloadedTracks));

  if (downloadedTracks.length === 0) {
    return (
      <div className="screen-container">
        <div className="downloads-container">
          <div className="downloads-empty">
            <BsDownload size="80px" color="#888" />
            <h2>No Downloaded Tracks</h2>
            <p>Start downloading tracks from the Search page to access them offline!</p>
            {!user && (
              <p style={{ color: '#ff6b6b', marginTop: '10px' }}>
                Note: You need to be logged in to manage your library
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="screen-container">
        <div className="downloads-container">
          <div className="downloads-empty">
            <BsDownload size="80px" color="#888" />
            <h2>Authentication Required</h2>
            <p>Please log in to access your downloads and manage your library.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="downloads-container">
        {/* Header Section */}
        <div className="downloads-header">
          <div className="header-content">
            <div className="header-title">
              <div className="title-icon">
                <BsDownload size="32" />
              </div>
              <div className="title-text">
                <h1>Downloads</h1>
                <p>Your offline music collection</p>
              </div>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-number">{downloadedTracks.length}</span>
                <span className="stat-label">Tracks</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{getTotalSize()}</span>
                <span className="stat-label">Total Size</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="downloads-controls">
          <div className="controls-left">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search downloads..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filterBy === 'all' ? 'active' : ''}`}
                onClick={() => setFilterBy('all')}
              >
                All Sources
              </button>
              <button 
                className={`filter-tab ${filterBy === 'jamendo' ? 'active' : ''}`}
                onClick={() => setFilterBy('jamendo')}
              >
                Jamendo
              </button>
              <button 
                className={`filter-tab ${filterBy === 'musiq' ? 'active' : ''}`}
                onClick={() => setFilterBy('musiq')}
              >
                Musiq
              </button>
            </div>
          </div>
          
          <div className="controls-right">
            <div className="sort-controls">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="downloadedAt">Download Date</option>
                <option value="name">Name</option>
                <option value="artist">Artist</option>
              </select>
            </div>
            
            <div className="bulk-actions">
              <button 
                className="bulk-action-btn"
                onClick={selectAllTracks}
              >
                {selectedTracks.length === filteredAndSortedTracks.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {selectedTracks.length > 0 && (
                <button 
                  className="bulk-action-btn danger"
                  onClick={deleteSelectedTracks}
                >
                  Delete Selected ({selectedTracks.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Downloads Grid */}
        <div className="downloads-grid">
          {filteredAndSortedTracks.map((track) => (
            <div 
              key={track.id} 
              className={`download-card ${selectedTracks.includes(track.id) ? 'selected' : ''}`}
            >
              <div className="card-header">
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
                      onClick={() => playTrack(track)}
                      title="Play track"
                    >
                      <AiFillPlayCircle size="24" />
                    </button>
                  </div>
                </div>
                
                <div className="track-info">
                  <h3 className="track-title">{getTrackDisplayName(track)}</h3>
                  <p className="track-artist">{getTrackArtist(track)}</p>
                  <p className="track-album">{getTrackAlbum(track)}</p>
                </div>
              </div>

              <div className="card-meta">
                <div className="meta-item">
                  <span className="meta-label">Duration</span>
                  <span className="meta-value">{formatDuration(track.duration)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Source</span>
                  <span className={`source-badge source-${getTrackSource(track)}`}>
                    {getTrackSource(track)}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Downloaded</span>
                  <span className="meta-value">{formatDate(track.downloadedAt)}</span>
                </div>
              </div>

              <div className="card-actions">
                <div className="action-group">
                  <button 
                    className={`action-btn ${isInLibrary(track) ? 'active' : ''}`}
                    onClick={() => toggleLibrary(track)}
                    title={isInLibrary(track) ? 'Remove from library' : 'Add to library'}
                  >
                    {isInLibrary(track) ? <AiFillHeart size="18" /> : <AiOutlineHeart size="18" />}
                  </button>
                  
                  {track.download_url && (
                    <button 
                      className="action-btn"
                      onClick={() => window.open(track.download_url, '_blank')}
                      title="Open file location"
                    >
                      <AiOutlineFolder size="18" />
                    </button>
                  )}
                </div>
                
                <div className="action-group">
                  <button 
                    className="action-btn delete"
                    onClick={() => removeDownload(track.id)}
                    title="Remove download"
                  >
                    <AiOutlineDelete size="18" />
                  </button>
                </div>
              </div>

              <div className="selection-overlay">
                <input
                  type="checkbox"
                  checked={selectedTracks.includes(track.id)}
                  onChange={() => toggleTrackSelection(track.id)}
                  className="track-checkbox"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
