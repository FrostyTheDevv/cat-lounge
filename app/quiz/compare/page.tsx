'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface ComparisonData {
  user: {
    discord_user_id: string;
    discord_username: string;
    discord_avatar: string;
    archetype: {
      key: string;
      name: string;
      emoji: string;
      icon: string;
    };
    score_percentage: number;
    topTraits: string[];
  };
  compareUser: {
    discord_user_id: string;
    discord_username: string;
    discord_avatar: string;
    archetype: {
      key: string;
      name: string;
      emoji: string;
      icon: string;
    };
    score_percentage: number;
    topTraits: string[];
  };
  compatibility: {
    score: number;
    commonTraits: string[];
    complementaryTraits: string[];
    message: string;
  };
}

export default function ComparePage({
  searchParams,
}: {
  searchParams: { userId?: string; compareUserId?: string };
}) {
  const router = useRouter();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const fetchComparison = async () => {
      if (!searchParams.userId || !searchParams.compareUserId) {
        setError('Missing user IDs for comparison');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/quiz/compare?userId=${searchParams.userId}&compareUserId=${searchParams.compareUserId}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load comparison');
        }

        const data = await response.json();
        setComparison(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [searchParams.userId, searchParams.compareUserId]);

  const handleShare = async () => {
    if (!comparison) return;

    const message = `I compared my cat personality with ${comparison.compareUser.discord_username}!\n\n` +
      `Me: ${comparison.user.archetype.name} ${comparison.user.archetype.emoji}\n` +
      `Them: ${comparison.compareUser.archetype.name} ${comparison.compareUser.archetype.emoji}\n\n` +
      `Compatibility: ${comparison.compatibility.score}%\n` +
      `${comparison.compatibility.message}\n\n` +
      `Compare yours at Cat Lounge! 🐱`;

    try {
      await navigator.clipboard.writeText(message);
      setShareMessage('Copied to clipboard!');
      setTimeout(() => setShareMessage(''), 2000);
    } catch (err) {
      setShareMessage('Failed to copy');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>⚠️ Error</h2>
          <p>{error || 'Failed to load comparison'}</p>
          <button onClick={() => router.push('/quiz/result')} className={styles.backButton}>
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 75) return '#2ecc71'; // Green
    if (score >= 50) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  };

  useEffect(() => {
    if (comparison) {
      const scoreCircle = document.querySelector(`.${styles.scoreCircle}`);
      if (scoreCircle) {
        const color = (scoreCircle as HTMLElement).getAttribute('data-color');
        if (color) {
          (scoreCircle as HTMLElement).style.borderColor = color;
        }
      }
    }
  }, [comparison]);

  return (
    <div className={styles.container}>
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src="/kittybackground.mp4" type="video/mp4" />
      </video>
      <div className={styles.header}>
        <h1 className={styles.title}>Cat Personality Comparison 🐱↔️🐱</h1>
        <p className={styles.subtitle}>See how your feline personalities match up!</p>
      </div>

      {/* Compatibility Score */}
      <div className={styles.compatibilitySection}>
        <div className={styles.compatibilityScore}>
          <div 
            className={styles.scoreCircle}
            data-color={getCompatibilityColor(comparison.compatibility.score)}
          >
            <span className={styles.scoreNumber}>{comparison.compatibility.score}%</span>
            <span className={styles.scoreLabel}>Match</span>
          </div>
        </div>
        <p className={styles.compatibilityMessage}>{comparison.compatibility.message}</p>
      </div>

      {/* User Comparison */}
      <div className={styles.comparison}>
        {/* User 1 */}
        <div className={styles.userCard}>
          <div className={styles.userHeader}>
            <img
              src={comparison.user.discord_avatar || '/cat-icons/default.png'}
              alt={comparison.user.discord_username}
              className={styles.userAvatar}
            />
            <h2 className={styles.username}>{comparison.user.discord_username}</h2>
          </div>
          <div className={styles.archetypeDisplay}>
            <span className={styles.archetypeEmoji}>{comparison.user.archetype.emoji}</span>
            <h3 className={styles.archetypeName}>{comparison.user.archetype.name}</h3>
            <p className={styles.archetypeScore}>{comparison.user.score_percentage}% Match</p>
          </div>
          <div className={styles.traits}>
            <h4>Top Traits</h4>
            <ul>
              {comparison.user.topTraits.map((trait, index) => (
                <li key={index}>{trait}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* VS Divider */}
        <div className={styles.vsDivider}>
          <span className={styles.vsText}>VS</span>
        </div>

        {/* User 2 */}
        <div className={styles.userCard}>
          <div className={styles.userHeader}>
            <img
              src={comparison.compareUser.discord_avatar || '/cat-icons/default.png'}
              alt={comparison.compareUser.discord_username}
              className={styles.userAvatar}
            />
            <h2 className={styles.username}>{comparison.compareUser.discord_username}</h2>
          </div>
          <div className={styles.archetypeDisplay}>
            <span className={styles.archetypeEmoji}>{comparison.compareUser.archetype.emoji}</span>
            <h3 className={styles.archetypeName}>{comparison.compareUser.archetype.name}</h3>
            <p className={styles.archetypeScore}>{comparison.compareUser.score_percentage}% Match</p>
          </div>
          <div className={styles.traits}>
            <h4>Top Traits</h4>
            <ul>
              {comparison.compareUser.topTraits.map((trait, index) => (
                <li key={index}>{trait}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Common & Complementary Traits */}
      <div className={styles.analysisSection}>
        {comparison.compatibility.commonTraits.length > 0 && (
          <div className={styles.analysisCard}>
            <h3>🤝 Shared Traits</h3>
            <p className={styles.analysisDescription}>
              You both have these traits in your top 3!
            </p>
            <ul className={styles.traitList}>
              {comparison.compatibility.commonTraits.map((trait, index) => (
                <li key={index} className={styles.commonTrait}>{trait}</li>
              ))}
            </ul>
          </div>
        )}

        {comparison.compatibility.complementaryTraits.length > 0 && (
          <div className={styles.analysisCard}>
            <h3>⚖️ Complementary Traits</h3>
            <p className={styles.analysisDescription}>
              Your differences balance each other out!
            </p>
            <ul className={styles.traitList}>
              {comparison.compatibility.complementaryTraits.map((trait, index) => (
                <li key={index} className={styles.complementaryTrait}>{trait}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={handleShare} className={styles.shareButton}>
          <svg className={styles.shareIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {shareMessage || 'Share Comparison'}
        </button>
        <button onClick={() => router.push('/quiz/result')} className={styles.backButton}>
          Back to My Results
        </button>
        <button onClick={() => router.push('/quiz')} className={styles.retakeButton}>
          Take Quiz Again
        </button>
      </div>
    </div>
  );
}
