import React, { useEffect, useState } from "react";
import "./player.css";
import { useLocation, useNavigate } from "react-router-dom";
import { IconContext } from "react-icons";
import { 
  AiOutlineHeart, 
  AiFillHeart, 
  AiOutlineDownload,
  AiOutlineShareAlt
} from "react-icons/ai";
import Queue from "../../components/queue/queue";
import AudioPlayer from "../../components/audioPlayer/audioPlayer";
import authService from "../../services/authService";
import musicService from "../../services/musicService";

export default function Player({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);

  useEffect(() => {
    // Clear any invalid now playing data on mount
    try {
      musicService.clearInvalidNowPlaying();
    } catch (error) {
      console.error('Error clearing invalid now playing:', error);
    }
    
    // Check if audio is actually playing in the background
    const checkAudioState = () => {
      try {
        const audioElements = document.querySelectorAll('audio');
        let isAnyAudioPlaying = false;
        
        audioElements.forEach(audio => {
          if (!audio.paused && audio.currentTime > 0) {
            isAnyAudioPlaying = true;
          }
        });
        
        setIsGlobalPlaying(isAnyAudioPlaying);
      } catch (error) {
        console.error('Error checking audio state:', error);
      }
    };
    
    // Check audio state after a short delay to allow audio to load
    setTimeout(checkAudioState, 500);
    
    // Force sync audio progress when returning to player
    const syncAudioProgress = () => {
      try {
        if (window.forceSyncAudioProgress) {
          console.log('🔄 Player mounted - forcing audio progress sync');
          window.forceSyncAudioProgress();
        }
      } catch (error) {
        console.error('Error syncing audio progress:', error);
      }
    };
    
    // Try to sync immediately and after a delay
    syncAudioProgress();
    setTimeout(syncAudioProgress, 200);
    setTimeout(syncAudioProgress, 1000);
    
    // Scroll to top when navigating to player
    setTimeout(() => {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const container = document.querySelector('.screen-container');
        if (container) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        console.error('Error scrolling to top:', error);
      }
    }, 100);
    
    if (location.state) {
      console.log('🎵 Player received location state:', location.state);
      
      // Handle track with tracks array (from search)
      if (location.state?.track && location.state?.tracks) {
        const trackArray = location.state.tracks;
        const selectedTrack = location.state.track;
        
        console.log('🎯 Handling track with tracks array:', {
          selectedTrack,
          trackArrayLength: trackArray.length,
          firstTrack: trackArray[0]
        });
        
        // Find the index of the selected track in the array
        const selectedIndex = trackArray.findIndex(t => t.id === selectedTrack.id);
        const trackIndex = selectedIndex >= 0 ? selectedIndex : 0;
        
        console.log('📍 Track index calculation:', {
          selectedIndex,
          finalTrackIndex: trackIndex,
          trackAtIndex: trackArray[trackIndex]
        });
        
        setTracks(trackArray);
        setCurrentTrack(selectedTrack);
        setCurrentIndex(trackIndex);
        setPlaylistInfo(null);
      }
      // Handle tracks array only
      else if (location.state?.tracks) {
        console.log('📋 Handling tracks array only:', {
          tracksLength: location.state.tracks.length,
          firstTrack: location.state.tracks[0]
        });
        
        setTracks(location.state.tracks);
        setCurrentTrack(location.state.tracks[0]);
        setCurrentIndex(0);
        setPlaylistInfo(null);
      }
      // Handle single track
      else if (location.state?.track) {
        console.log('🎵 Handling single track:', location.state.track);
        
        setTracks([location.state.track]);
        setCurrentTrack(location.state.track);
        setCurrentIndex(0);
        setPlaylistInfo(null);
      }
      // Handle playlist
      else if (location.state?.playlist) {
        console.log('📚 Handling playlist:', location.state.playlist);
        
        setTracks(location.state.playlist.tracks);
        setCurrentTrack(location.state.playlist.tracks[0]);
        setCurrentIndex(0);
        setPlaylistInfo(location.state.playlist);
      }
    } else {
      console.log('🔄 No location state, attempting to restore from persistent storage');
      // Fallback: restore from persistent now playing
      const restored = musicService.loadNowPlaying();
      if (restored && restored.tracks.length > 0) {
        console.log('💾 Restored from persistent storage:', restored);
        setTracks(restored.tracks);
        setCurrentTrack(restored.tracks[restored.currentIndex]);
        setCurrentIndex(restored.currentIndex);
        setPlaylistInfo(null);
      } else {
        // No valid tracks to restore, clear data and redirect to home
        console.log('❌ No valid tracks to restore, clearing data and redirecting to home');
        musicService.clearNowPlaying();
        navigate('/');
      }
    }
  }, [location.state]);

  useEffect(() => {
    // Support both Spotify format and direct track format
    const track = tracks[currentIndex]?.track || tracks[currentIndex];
    
    console.log('🎵 Player useEffect - Track data:', {
      currentIndex,
      tracksLength: tracks.length,
      rawTrack: tracks[currentIndex],
      processedTrack: track,
      hasTrackProperty: tracks[currentIndex]?.track !== undefined
    });
    
    setCurrentTrack(track);
    
    // Only save valid tracks (not demo tracks)
    if (tracks && tracks.length > 0) {
      const validTracks = tracks.filter(t => {
        const trackData = t?.track || t;
        return trackData && trackData.id && trackData.preview_url && 
               !trackData.id.includes('demo') && 
               trackData.source !== 'demo';
      });
      
      if (validTracks.length > 0) {
        console.log('💾 Saving now playing with valid tracks:', validTracks.length);
        musicService.saveNowPlaying(validTracks, currentIndex);
      }
    }
    
    // Check if current track is liked
    if (user && track) {
      setIsLiked(user.favorites?.some(fav => fav.id === track.id) || false);
    }
  }, [currentIndex, tracks, user]);

  const toggleLike = () => {
    if (!user || !currentTrack) return;
    
    if (isLiked) {
      authService.removeFromFavorites(currentTrack.id);
      user.favorites = user.favorites.filter(fav => fav.id !== currentTrack.id);
    } else {
      authService.addToFavorites(currentTrack);
      if (!user.favorites) user.favorites = [];
      user.favorites.push(currentTrack);
    }
    setIsLiked(!isLiked);
  };

  const downloadTrack = async () => {
    if (currentTrack?.download_url) {
      try {
        await musicService.downloadTrack(currentTrack);
        console.log('Track downloaded successfully');
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const shareTrack = () => {
    if (navigator.share && currentTrack) {
      navigator.share({
        title: currentTrack.name,
        text: `Listen to ${currentTrack.name} by ${currentTrack.artist}`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="screen-container">
      {/* Main Player Container */}
      <div className="player-container">
        
        {/* Track Display Section */}
        <div className="track-display">
          <div className="track-artwork">
            {currentTrack?.image ? (
              <img src={currentTrack.image} alt={currentTrack.name} />
            ) : (
              <div className="artwork-placeholder">
                <span>🎵</span>
              </div>
            )}
          </div>
          
          <div className="track-info">
            <h1 
              className="track-name" 
              title={currentTrack?.name || 'No Track Selected'}
            >
              {currentTrack?.name ? 
                (currentTrack.name.length > 50 ? currentTrack.name.substring(0, 50) + '...' : currentTrack.name) 
                : 'No Track Selected'
              }
            </h1>
            <h2 
              className="track-artist" 
              title={currentTrack?.artist || 'Unknown Artist'}
            >
              {currentTrack?.artist ? 
                (currentTrack.artist.length > 40 ? currentTrack.artist.substring(0, 40) + '...' : currentTrack.artist) 
                : 'Unknown Artist'
              }
            </h2>
            {currentTrack?.album && (
              <p 
                className="track-album" 
                title={currentTrack.album}
              >
                {currentTrack.album.length > 60 ? currentTrack.album.substring(0, 60) + '...' : currentTrack.album}
              </p>
            )}
          </div>
          
          <div className="track-actions">
            <button 
              className={`action-btn ${isLiked ? 'liked' : ''}`}
              onClick={toggleLike}
              title={isLiked ? "Remove from Favorites" : "Add to Favorites"}
            >
              <IconContext.Provider value={{ size: "20px" }}>
                {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
              </IconContext.Provider>
            </button>
            
            {currentTrack?.download_url && (
              <button 
                className="action-btn"
                onClick={downloadTrack}
                title="Download Track"
              >
                <IconContext.Provider value={{ size: "20px" }}>
                  <AiOutlineDownload />
                </IconContext.Provider>
              </button>
            )}
            
            <button 
              className="action-btn"
              onClick={shareTrack}
              title="Share Track"
            >
              <IconContext.Provider value={{ size: "20px" }}>
                <AiOutlineShareAlt />
              </IconContext.Provider>
            </button>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="audio-controls">
          <AudioPlayer
            currentTrack={currentTrack}
            tracks={tracks}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            isGlobalPlaying={isGlobalPlaying}
            setIsGlobalPlaying={setIsGlobalPlaying}
          />
        </div>

        {/* Queue Section */}
        <div className="queue-section">
          <div className="queue-header">
            <h3>Up Next ({tracks?.length || 0})</h3>
            <button 
              className="toggle-queue-btn"
              onClick={() => setShowQueue(!showQueue)}
            >
              {showQueue ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showQueue && (
            <div className="queue-container">
              <Queue 
                tracks={tracks} 
                setCurrentIndex={setCurrentIndex}
                currentIndex={currentIndex}
              />
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}