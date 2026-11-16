import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    // 1. Hash Navigation (e.g. /#workspace, /#how-it-works, /#faq)
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const scrollToHashElement = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const navHeight = 90; // Fixed navbar height + comfortable padding
          const elPosition = el.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elPosition - navHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          return true;
        }
        return false;
      };

      // Try immediately, or retry once DOM settles
      if (!scrollToHashElement()) {
        const timeout = setTimeout(scrollToHashElement, 100);
        return () => clearTimeout(timeout);
      }
    } else {
      // 2. Regular route navigation: restore to top cleanly
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }

    // Refresh ScrollTrigger instances cleanly
    if (typeof window !== 'undefined' && ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }, [location.pathname, location.hash]);

  return null;
}
