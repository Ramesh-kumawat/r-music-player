import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    // Target both window and screen containers
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    // Also scroll any screen containers to top
    const screenContainers = document.querySelectorAll('.screen-container');
    screenContainers.forEach(container => {
      container.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    });
  }, [pathname]);

  return null;
}
