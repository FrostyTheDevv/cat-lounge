'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import styles from './page.module.css';

interface LeaderboardEntry {
  discord_username: string;
  discord_avatar: string;
  archetype_key: string;
  archetype_name: string;
  archetype_icon: string;
  uniqueness_score: number;
  rank: number;
  rarity_tier: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    // Set rarity badge colors
    const badges = document.querySelectorAll(`.${styles.rarityBadge}`);
    badges.forEach((badge) => {
      const color = badge.getAttribute('data-color');
      if (color && badge instanceof HTMLElement) {
        badge.style.borderColor = color;
        badge.style.color = color;
      }
    });
  }, [leaderboard]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/quiz/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (tier: string) => {
    const colors: Record<string, string> = {
      'Legendary': '#ffd700',
      'Epic': '#9b59b6',
      'Rare': '#3498db',
      'Uncommon': '#2ecc71',
      'Common': '#95a5a6',
    };
    return colors[tier] || '#95a5a6';
  };

  const getRarityIcon = (tier: string) => {
    const icons: Record<string, string> = {
      'Legendary': '👑',
      'Epic': '💜',
      'Rare': '💙',
      'Uncommon': '💚',
      'Common': '⚪',
    };
    return icons[tier] || '⚪';
  };

  if (loading) {
    return (
      <>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>Loading leaderboard...</div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.error}>{error}</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header onAuthClick={() => {}} />
      <main className={styles.main}>
        <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
          <source src="/kittybackground.mp4" type="video/mp4" />
        </video>
        <div className={styles.container}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <h1 className={styles.title}>
              <svg className={styles.titleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Personality Leaderboard
            </h1>
            <p className={styles.subtitle}>
              Celebrating the most unique cat personalities in our community
            </p>
          </section>

          {/* Leaderboard */}
          <section className={styles.leaderboardSection}>
            {leaderboard.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No leaderboard data available yet. Be the first to take the quiz!</p>
              </div>
            ) : (
              <div className={styles.leaderboardList}>
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.rank}
                    className={`${styles.leaderboardCard} ${entry.rank <= 3 ? styles.topThree : ''}`}
                  >
                    <div className={styles.rankBadge} data-rank={entry.rank}>
                      {entry.rank <= 3 ? (
                        <span className={styles.rankMedal}>
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className={styles.rankNumber}>#{entry.rank}</span>
                      )}
                    </div>

                    <div className={styles.userInfo}>
                      <Image 
                        src={entry.discord_avatar || '/noprofile.png'} 
                        alt={entry.discord_username}
                        width={64}
                        height={64}
                        className={styles.userAvatar}
                        loading="lazy"
                      />
                      <div className={styles.userDetails}>
                        <div className={styles.username}>{entry.discord_username}</div>
                        <div className={styles.archetypeInfo}>
                          <Image 
                            src={entry.archetype_icon} 
                            alt={entry.archetype_name}
                            width={20}
                            height={20}
                            className={styles.archetypeIcon}
                            loading="lazy"
                          />
                          <span className={styles.archetypeName}>{entry.archetype_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.rarityInfo}>
                      <div 
                        className={styles.rarityBadge}
                        data-color={getRarityColor(entry.rarity_tier)}
                      >
                        <span className={styles.rarityIcon}>{getRarityIcon(entry.rarity_tier)}</span>
                        <span className={styles.rarityTier}>{entry.rarity_tier}</span>
                      </div>
                      <div className={styles.uniquenessScore}>
                        {entry.uniqueness_score.toFixed(1)}% Unique
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Navigation */}
          <div className={styles.navigation}>
            <button 
              onClick={() => router.push('/quiz/result')}
              className={styles.navButton}
            >
              ← Back to Results
            </button>
            <button 
              onClick={() => router.push('/quiz')}
              className={styles.navButton}
            >
              Take Quiz →
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
