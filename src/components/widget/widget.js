import React, { useState, useEffect } from "react";
import "./widgets.css";
import musicService from "../../services/musicService";
import WidgetCard from "./widgetCard";

export default function Widgets({ user }) {
  const [trending, setTrending] = useState([]);
  const [radioStations, setRadioStations] = useState([]);
  const [recentFavorites, setRecentFavorites] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load trending music
        const trendingMusic = await musicService.getTrendingMusic(5);
        setTrending(trendingMusic);

        // Load popular radio stations
        const popularRadio = await musicService.getPopularRadioStations(5);
        setRadioStations(popularRadio);

        // Load user's recent favorites
        if (user && user.favorites) {
          const recentFavs = user.favorites.slice(-5).reverse();
          setRecentFavorites(recentFavs);
        }
      } catch (error) {
        console.error('Error loading widget data:', error);
      }
    };
    
    loadData();
  }, [user]);



  return (
    <div className="widgets-body flex">
      <WidgetCard title="Trending Music" data={trending} type="tracks" />
      <WidgetCard title="Popular Radio" data={radioStations} type="radio" />
      <WidgetCard title="Your Favorites" data={recentFavorites} type="favorites" />
    </div>
  );
}