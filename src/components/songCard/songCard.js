import React from 'react'
import "./songCard.css"
import AlbumImage from './albumImage'
import AlbumInfo from './albumInfo'

export default function SongCard({ album, track }) {
    // Prioritize track data over album data for better compatibility
    const displayData = {
      name: track?.name || album?.name || 'Unknown Track',
      artist: track?.artist || (album?.artists && album.artists.map(a => a.name).join(', ')) || 'Unknown Artist',
      album: track?.album || album?.name || 'Unknown Album',
      image: track?.image || album?.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=🎵',
      source: track?.source || 'music',
      duration: track?.duration || null,
      license: track?.license || null
    };

    return (
      <div className="songCard-body">
        <AlbumImage url={displayData.image} />
        <AlbumInfo 
          album={album} 
          track={track}
          displayData={displayData}
        />
      </div>
    );
  }
  