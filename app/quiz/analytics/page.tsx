'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './page.module.css';
import { CAT_ARCHETYPES } from '@/lib/quizConfig';

interface AnalyticsData {
  archetype: {
    key: string;
    name: string;
    description: string;
    traits: string[];
    emoji: string;
    icon: string;
  };
  scores: Array<{
    key: string;
    name: string;
    score: number;
    percentage: string;
    isWinner: boolean;
    communityAverage?: number;
    communityPercentage?: number;
  }>;
  questionBreakdown: Array<{
    questionId: number;
    questionText: string;
    userAnswerIndex: number;
    userAnswerLabel: string;
    answerDistribution: Array<{
      answerIndex: number;
      label: string;
      count: number;
      percentage: string;
      isUserChoice: boolean;
    }>;
    impactOnResult: Record<string, number>;
  }>;
  completedAt: string;
  totalQuestions: number;
}

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userAvatar, setUserAvatar] = useState<string>('/catloungepfp.webp');
  const [userName, setUserName] = useState<string>('User');
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [radarAnimated, setRadarAnimated] = useState(false);
  const radarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
    // Get user from localStorage
    const storedUser = localStorage.getItem('catlounge_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserAvatar(user.pfp || '/noprofile.png');
      setUserName(user.username || 'User');
    }
  }, []);

  // Trigger radar chart animation when it comes into view
  useEffect(() => {
    if (!analytics || radarAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRadarAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (radarRef.current) {
      observer.observe(radarRef.current);
    }

    return () => observer.disconnect();
  }, [analytics, radarAnimated]);

  // Style comparison bars and difference indicators
  useEffect(() => {
    if (!analytics) return;

    const comparisonBars = document.querySelectorAll(`.${styles.comparisonBar}`);
    comparisonBars.forEach((bar) => {
      const color = bar.getAttribute('data-color');
      const percentage = bar.getAttribute('data-percentage');
      if (color && bar instanceof HTMLElement) {
        bar.style.backgroundColor = color;
      }
      if (percentage && bar instanceof HTMLElement) {
        bar.style.width = `${percentage}%`;
      }
    });

    const diffs = document.querySelectorAll(`.${styles.comparisonDiff}`);
    diffs.forEach((diff) => {
      const color = diff.getAttribute('data-color');
      if (color && diff instanceof HTMLElement) {
        diff.style.color = color;
      }
    });
  }, [analytics]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/quiz/analytics');
      if (response.status === 401) {
        router.push('/quiz');
        return;
      }
      if (response.status === 404) {
        router.push('/quiz');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getArchetypeColor = (key: string): string => {
    const colors: Record<string, string> = {
      soft_cuddly: '#ff6b9d',
      wise_old: '#8b7355',
      chaos_goblin: '#ff4500',
      shy_anxious: '#b19cd9',
      sleepy_lazy: '#87ceeb',
      elegant_aloof: '#daa520',
    };
    return colors[key] || '#9b59b6';
  };

  if (loading) {
    return (
      <>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>Loading your analytics...</div>
          </div>
        </main>
      </>
    );
  }

  if (error || !analytics) {
    return (
      <>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.error}>{error || 'No analytics data available'}</div>
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
            <div className={styles.heroIcon}>
              <Image 
                src={userAvatar} 
                alt={userName}
                width={120}
                height={120}
                className={styles.archetypeIcon}
              />
            </div>
            <h1 className={styles.title}>
              {t('personalityAnalytics') || 'Your Personality Analytics'}
            </h1>
            <div className={styles.archetypeBadge}>
              {analytics.archetype.icon && (
                <Image 
                  src={analytics.archetype.icon} 
                  alt={analytics.archetype.name}
                  width={24}
                  height={24}
                  className={styles.badgeIcon}
                />
              )}
              <span className={styles.archetypeName}>{analytics.archetype.name}</span>
            </div>
            <p className={styles.completedDate}>
              {t('completedOn') || 'Completed on'} {new Date(analytics.completedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </section>

          {/* Score Breakdown Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 {t('personalityScores') || 'Your Personality Scores'}</h2>
            <p className={styles.sectionDescription}>
              {t('scoresDescription') || 'See how strongly each archetype matches your personality based on'} {analytics.totalQuestions} {t('questions') || 'questions'}
            </p>
            <div className={styles.scoresGrid}>
              {analytics.scores.map((score) => {
                const archetype = CAT_ARCHETYPES.find(a => a.key === score.key);
                const color = getArchetypeColor(score.key);
                const isWinner = score.isWinner;
                
                return (
                  <div 
                    key={score.key} 
                    className={`${styles.scoreCard} ${isWinner ? styles.winnerCard : ''}`}
                    data-border-color={isWinner ? color : undefined}
                  >
                    <div className={styles.scoreHeader}>
                      {archetype?.icon && (
                        <Image 
                          src={archetype.icon} 
                          alt={archetype.name}
                          width={40}
                          height={40}
                          className={styles.scoreIcon}
                        />
                      )}
                      <div className={styles.scoreInfo}>
                        <div className={styles.scoreName}>{score.name}</div>
                        <div className={styles.scoreValue}>{score.score} points</div>
                      </div>
                      {isWinner && <div className={styles.winnerBadge}>👑 Your Type</div>}
                    </div>
                    <div className={styles.scoreBarContainer}>
                      <div 
                        className={styles.scoreBar}
                        data-color={color}
                        data-width={score.percentage}
                      />
                    </div>
                    <div className={styles.scorePercentage}>{score.percentage}%</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Community Comparison */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <path d="M20 8v6M23 11h-6"/>
              </svg>
              How You Compare
            </h2>
            <p className={styles.sectionDescription}>
              See how your personality scores stack up against the community average
            </p>
            <div className={styles.comparisonGrid}>
              {analytics.scores.map((score) => {
                const archetype = CAT_ARCHETYPES.find(a => a.key === score.key);
                const color = getArchetypeColor(score.key);
                const userPercentage = parseFloat(score.percentage);
                const communityPercentage = score.communityPercentage || 0;
                const diff = userPercentage - communityPercentage;
                const diffLabel = diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
                const diffColor = diff > 0 ? '#10b981' : diff < 0 ? '#f97316' : '#6b7280';
                
                return (
                  <div key={score.key} className={styles.comparisonCard}>
                    <div className={styles.comparisonHeader}>
                      {archetype?.icon && (
                        <Image 
                          src={archetype.icon} 
                          alt={archetype.name}
                          width={32}
                          height={32}
                          className={styles.comparisonIcon}
                        />
                      )}
                      <div className={styles.comparisonTitle}>{score.name}</div>
                    </div>
                    <div className={styles.comparisonBars}>
                      <div className={styles.comparisonRow}>
                        <span className={styles.comparisonLabel}>You</span>
                        <div className={styles.comparisonBarContainer}>
                          <div 
                            className={styles.comparisonBar}
                            data-color={color}
                            data-percentage={userPercentage}
                          ></div>
                        </div>
                        <span className={styles.comparisonValue}>{userPercentage.toFixed(1)}%</span>
                      </div>
                      <div className={styles.comparisonRow}>
                        <span className={styles.comparisonLabel}>Avg</span>
                        <div className={styles.comparisonBarContainer}>
                          <div 
                            className={styles.comparisonBar}
                            data-color="#6b7280"
                            data-percentage={communityPercentage}
                          ></div>
                        </div>
                        <span className={styles.comparisonValue}>{communityPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className={styles.comparisonDiff} data-color={diffColor}>
                      {diff > 0 ? '↑' : diff < 0 ? '↓' : '='} {diffLabel} vs average
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Radar Chart Visualization */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2v10l7 4"/>
              </svg>
              {t('personalityBalance') || 'Personality Balance'}
            </h2>
            <p className={styles.sectionDescription}>
              {t('visualRepresentation') || 'Hover over points to see detailed scores'}
            </p>
            <div ref={radarRef} className={styles.radarContainer}>
              <svg viewBox="0 0 400 400" className={styles.radarChart}>
                {/* Background circles */}
                <circle cx="200" cy="200" r="160" fill="none" stroke="#2b2d31" strokeWidth="1" opacity="0.3" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="#2b2d31" strokeWidth="1" opacity="0.3" />
                <circle cx="200" cy="200" r="80" fill="none" stroke="#2b2d31" strokeWidth="1" opacity="0.3" />
                <circle cx="200" cy="200" r="40" fill="none" stroke="#2b2d31" strokeWidth="1" opacity="0.3" />
                
                {/* Axis lines */}
                {analytics.scores.map((_, index) => {
                  const angle = (Math.PI * 2 * index) / analytics.scores.length - Math.PI / 2;
                  const x = 200 + Math.cos(angle) * 160;
                  const y = 200 + Math.sin(angle) * 160;
                  return (
                    <line 
                      key={index}
                      x1="200" 
                      y1="200" 
                      x2={x} 
                      y2={y} 
                      stroke="#2b2d31" 
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}
                
                {/* Data polygon */}
                <polygon
                  points={analytics.scores.map((score, index) => {
                    const angle = (Math.PI * 2 * index) / analytics.scores.length - Math.PI / 2;
                    const distance = radarAnimated ? (parseFloat(score.percentage) / 100) * 160 : 0;
                    const x = 200 + Math.cos(angle) * distance;
                    const y = 200 + Math.sin(angle) * distance;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="#9b59b6"
                  fillOpacity="0.3"
                  stroke="#9b59b6"
                  strokeWidth="2"
                  className={styles.radarPolygon}
                />
                
                {/* Data points with tooltips */}
                {analytics.scores.map((score, index) => {
                  const angle = (Math.PI * 2 * index) / analytics.scores.length - Math.PI / 2;
                  const distance = radarAnimated ? (parseFloat(score.percentage) / 100) * 160 : 0;
                  const x = 200 + Math.cos(angle) * distance;
                  const y = 200 + Math.sin(angle) * distance;
                  const isHovered = hoveredScore === index;
                  return (
                    <g key={index}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isHovered ? "6" : "4"}
                        fill={score.isWinner ? '#ffd700' : '#9b59b6'}
                        stroke="#fff"
                        strokeWidth="2"
                        className={styles.radarPoint}
                        onMouseEnter={() => setHoveredScore(index)}
                        onMouseLeave={() => setHoveredScore(null)}
                      />
                      {isHovered && (
                        <foreignObject x={x + 10} y={y - 30} width="150" height="60">
                          <div className={styles.radarTooltip}>
                            <div className={styles.tooltipTitle}>{score.name}</div>
                            <div className={styles.tooltipValue}>{score.score} points ({score.percentage}%)</div>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
                
                {/* Labels */}
                {analytics.scores.map((score, index) => {
                  const archetype = CAT_ARCHETYPES.find(a => a.key === score.key);
                  const angle = (Math.PI * 2 * index) / analytics.scores.length - Math.PI / 2;
                  const x = 200 + Math.cos(angle) * 185;
                  const y = 200 + Math.sin(angle) * 185;
                  return (
                    <g key={index}>
                      <foreignObject x={x - 12} y={y - 12} width="24" height="24">
                        <div className={styles.radarIconWrapper}>
                          {archetype?.icon && (
                            <Image 
                              src={archetype.icon} 
                              alt={archetype.name}
                              width={24}
                              height={24}
                              className={score.isWinner ? styles.radarIconWinner : styles.radarIcon}
                            />
                          )}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Navigation */}
          <section className={styles.navigation}>
            <button 
              onClick={() => router.push('/quiz/result')}
              className={styles.navButton}
            >
              ← {t('backToResults') || 'Back to Results'}
            </button>
            <button 
              onClick={() => router.push('/quiz/matches')}
              className={styles.navButton}
            >
              <svg className={styles.matchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Find Your Matches
            </button>
            <button 
              onClick={() => router.push(`/quiz/archetype/${analytics.archetype.key}`)}
              className={styles.navButton}
            >
              {t('viewCommunity') || 'View Community'} →
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
