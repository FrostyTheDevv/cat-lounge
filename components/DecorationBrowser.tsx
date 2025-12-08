'use client';

import { useState, useEffect } from 'react';
import styles from './DecorationBrowser.module.css';

interface AvatarDecoration {
  id: number;
  sku_id: string;
  asset_name: string;
  asset_url: string;
  thumbnail_url: string | null;
  description: string | null;
}

interface BannerDecoration {
  id: number;
  sku_id: string;
  asset_name: string;
  asset_url: string;
  thumbnail_url: string | null;
  is_animated: boolean;
}

interface ProfileEffect {
  id: number;
  sku_id: string;
  effect_name: string;
  asset_url: string;
  thumbnail_url: string | null;
  is_animated: boolean;
  description: string | null;
}

interface DecorationBrowserProps {
  type: 'avatar' | 'banner' | 'effect';
  selected: string | null;
  onSelect: (assetUrl: string | null, assetName: string) => void;
}

export default function DecorationBrowser({ type, selected, onSelect }: DecorationBrowserProps) {
  const [decorations, setDecorations] = useState<{
    avatarDecorations: AvatarDecoration[];
    bannerDecorations: BannerDecoration[];
    profileEffects: ProfileEffect[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDecorations();
  }, []);

  const fetchDecorations = async () => {
    try {
      const response = await fetch('/api/admin/decorations/list');
      if (response.ok) {
        const data = await response.json();
        setDecorations(data);
      }
    } catch (error) {
      console.error('Error fetching decorations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading decorations...</div>;
  }

  if (!decorations) {
    return <div className={styles.error}>Failed to load decorations</div>;
  }

  const getItems = () => {
    switch (type) {
      case 'avatar':
        return decorations.avatarDecorations.filter(d => 
          d.asset_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      case 'banner':
        return decorations.bannerDecorations.filter(d => 
          d.asset_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      case 'effect':
        return decorations.profileEffects.filter(d => 
          d.effect_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
  };

  const items = getItems();

  return (
    <div className={styles.browser}>
      <div className={styles.browserHeader}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Search ${type} decorations...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          className={styles.clearButton}
          onClick={() => onSelect(null, '')}
          disabled={!selected}
        >
          Clear Selection
        </button>
      </div>

      <div className={styles.grid}>
        {items.map((item: any) => {
          const assetUrl = item.asset_url;
          const assetName = type === 'effect' ? item.effect_name : item.asset_name;
          const isSelected = selected === assetUrl;
          const isAnimated = type !== 'avatar' && item.is_animated;
          
          // Generate preview based on decoration name/category
          const getDecorationEmoji = (name: string) => {
            const lowerName = name.toLowerCase();
            if (lowerName.includes('snow') || lowerName.includes('frost')) return '❄️';
            if (lowerName.includes('fire') || lowerName.includes('flame')) return '🔥';
            if (lowerName.includes('heart') || lowerName.includes('love')) return '💕';
            if (lowerName.includes('star')) return '⭐';
            if (lowerName.includes('crown') || lowerName.includes('royal')) return '👑';
            if (lowerName.includes('flower') || lowerName.includes('sakura') || lowerName.includes('blossom')) return '🌸';
            if (lowerName.includes('butterfly')) return '🦋';
            if (lowerName.includes('rainbow')) return '🌈';
            if (lowerName.includes('lightning') || lowerName.includes('electric')) return '⚡';
            if (lowerName.includes('water') || lowerName.includes('ocean') || lowerName.includes('wave')) return '🌊';
            if (lowerName.includes('leaf') || lowerName.includes('autumn')) return '🍂';
            if (lowerName.includes('pumpkin') || lowerName.includes('halloween')) return '🎃';
            if (lowerName.includes('ghost') || lowerName.includes('spooky')) return '👻';
            if (lowerName.includes('bat')) return '🦇';
            if (lowerName.includes('candy')) return '🍬';
            if (lowerName.includes('christmas') || lowerName.includes('santa')) return '🎅';
            if (lowerName.includes('gift') || lowerName.includes('present')) return '🎁';
            if (lowerName.includes('tree')) return '🎄';
            if (lowerName.includes('sun') || lowerName.includes('summer')) return '☀️';
            if (lowerName.includes('beach')) return '🏖️';
            if (lowerName.includes('tropical')) return '🌴';
            if (lowerName.includes('watermelon')) return '🍉';
            if (lowerName.includes('ice cream') || lowerName.includes('popsicle')) return '🍦';
            if (lowerName.includes('moon')) return '🌙';
            if (lowerName.includes('planet') || lowerName.includes('cosmic')) return '🪐';
            if (lowerName.includes('galaxy') || lowerName.includes('nebula')) return '🌌';
            if (lowerName.includes('meteor')) return '☄️';
            if (lowerName.includes('aurora')) return '🌌';
            if (lowerName.includes('dragon')) return '🐉';
            if (lowerName.includes('unicorn')) return '🦄';
            if (lowerName.includes('phoenix')) return '🔥';
            if (lowerName.includes('wings') || lowerName.includes('angel')) return '🪽';
            if (lowerName.includes('magic') || lowerName.includes('sparkle')) return '✨';
            if (lowerName.includes('cat')) return '🐱';
            if (lowerName.includes('dog')) return '🐶';
            if (lowerName.includes('bunny') || lowerName.includes('rabbit')) return '🐰';
            if (lowerName.includes('fox')) return '🦊';
            if (lowerName.includes('panda')) return '🐼';
            if (lowerName.includes('pizza')) return '🍕';
            if (lowerName.includes('donut')) return '🍩';
            if (lowerName.includes('sushi')) return '🍣';
            if (lowerName.includes('cake')) return '🎂';
            if (lowerName.includes('coffee')) return '☕';
            if (lowerName.includes('music') || lowerName.includes('note')) return '🎵';
            if (lowerName.includes('disco')) return '🪩';
            if (lowerName.includes('gaming') || lowerName.includes('controller')) return '🎮';
            if (lowerName.includes('trophy')) return '🏆';
            if (lowerName.includes('neon') || lowerName.includes('glow')) return '💫';
            if (lowerName.includes('bubble')) return '🫧';
            if (lowerName.includes('confetti')) return '🎊';
            if (lowerName.includes('gradient')) return '🌈';
            return '✨';
          };

          return (
            <div
              key={item.id}
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(assetUrl, assetName)}
              title={assetName}
            >
              <div className={styles.itemImage} data-emoji={getDecorationEmoji(assetName)}>
                <img 
                  src={item.thumbnail_url || assetUrl} 
                  alt={assetName}
                  loading="lazy"
                  onError={(e) => {
                    // Hide image if it fails to load, show emoji fallback
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    // If image loads successfully, hide the emoji
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const before = window.getComputedStyle(parent, '::before');
                      if (before) {
                        (parent as HTMLElement).style.setProperty('--show-emoji', 'none');
                      }
                    }
                  }}
                />
                {isAnimated && (
                  <span className={styles.animatedBadge}>
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                    </svg>
                  </span>
                )}
              </div>
              <div className={styles.itemName}>
                {assetName.replace(/_/g, ' ')}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className={styles.noResults}>
            No {type} decorations found
          </div>
        )}
      </div>
    </div>
  );
}
