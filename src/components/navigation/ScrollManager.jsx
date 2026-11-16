import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    let active = true;

    // 1. Hash Navigation (e.g. /#workspace, /#how-it-works, /#faq)
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const scrollToHashElement = () => {
        if (!active) return false;
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };

      // Staggered attempts to account for route mounting, image loads, and GSAP layout shifts
      scrollToHashElement();
      const t1 = setTimeout(scrollToHashElement, 120);
      const t2 = setTimeout(scrollToHashElement, 350);
      const t3 = setTimeout(scrollToHashElement, 700);

      return () => {
        active = false;
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
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
