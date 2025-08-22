import React from 'react'
import "./queue.css"

export default function Queue({ tracks, setCurrentIndex, currentIndex }) {
    // Helper function to format duration
    const formatDuration = (seconds) => {
      if (!seconds || seconds === 0) return '0:00';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Helper function to get track display name
    const getTrackDisplayName = (track) => {
      if (!track) return 'Unknown Track';
      
      // Handle different track data structures
      if (track.track && track.track.name) {
        return track.track.name;
      } else if (track.name) {
        return track.name;
      } else if (track.title) {
        return track.title;
      }
      
      return 'Unknown Track';
    };

    // Helper function to get artist name
    const getArtistName = (track) => {
      if (!track) return 'Unknown Artist';
      
      // Handle different track data structures
      if (track.track && track.track.artist) {
        return track.track.artist;
      } else if (track.artist) {
        return track.artist;
      } else if (track.artists && track.artists.length > 0) {
        return Array.isArray(track.artists) ? track.artists[0] : track.artists;
      }
      
      return 'Unknown Artist';
    };

    // Helper function to get track duration
    const getTrackDuration = (track) => {
      if (!track) return 0;
      
      // Handle different track data structures
      if (track.track && track.track.duration) {
        return track.track.duration;
      } else if (track.duration) {
        return track.duration;
      } else if (track.length) {
        return track.length;
      }
      
      return 0;
    };

    if (!tracks || tracks.length === 0) {
      return (
        <div className="queue-container flex">
          <div className="queue flex">
            <p className="upNext">Up Next</p>
            <div className="queue-list">
              <div className="queue-item flex empty-queue">
                <p className="track-name">No tracks in queue</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="queue-container flex">
        <div className="queue flex">
          <p className="upNext">Up Next</p>
          <div className="queue-list">
            {tracks.map((track, index) => {
              const trackName = getTrackDisplayName(track);
              const artistName = getArtistName(track);
              const duration = getTrackDuration(track);
              const isCurrentTrack = index === currentIndex;
              
              return (
                <div
                  key={`${track.id || track.track?.id || index}-${index}`}
                  className={`queue-item flex ${isCurrentTrack ? 'current-track' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  title={`${trackName} - ${artistName}`}
                >
                  <div className="track-info">
                    <p className={`track-name ${isCurrentTrack ? 'current' : ''}`}>
                      {trackName}
                    </p>
                    <p className="track-artist">{artistName}</p>
                  </div>
                  <div className="track-duration">
                    <p>{formatDuration(duration)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

