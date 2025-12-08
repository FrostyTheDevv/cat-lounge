"use client";

import { useEffect, useRef, useState } from 'react';
import { SectionRenderer } from './SectionRenderers';
import { ProfileSection } from '@/lib/sectionTypes';

interface LazySectionRendererProps {
  sections: ProfileSection[];
}

export function LazySectionRenderer({ sections }: LazySectionRendererProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element comes into view
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef}>
      {isVisible ? (
        <SectionRenderer sections={sections} />
      ) : (
        <div style={{ minHeight: '200px' }} /> // Placeholder to maintain layout
      )}
    </div>
  );
}
