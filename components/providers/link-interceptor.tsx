'use client';

import { useEffect } from 'react';
import NProgress from 'nprogress';

export function LinkInterceptor() {
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        const currentUrl = window.location.pathname;

        // Start progress if navigating to a different page
        if (href && href.startsWith('/') && href !== currentUrl && !href.startsWith('#')) {
          NProgress.start();
        }
      }
    };

    const handleRouteChange = () => {
      NProgress.done();
    };

    // Listen for anchor clicks
    document.addEventListener('click', handleAnchorClick);

    // Listen for browser back/forward
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return null;
}
