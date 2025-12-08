'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './page.module.css';
import { CAT_ARCHETYPES } from '@/lib/quizConfig';

interface SimilarUser {
  discordUserId: string;
  username: string;
  avatar: string | null;
  archetype: {
    key: string;
    name: string;
  };
  similarity: number;
  matchingAnswers: number;
  totalQuestions: number;
  matchingQuestionIds: number[];
  differingQuestionIds: number[];
  scoreComparison: {
    theirScores: Record<string, number>;
    scoreDifferences: Record<string, {
      user: number;
      them: number;
      difference: number;
    }>;
  };
}

interface MatchesData {
  userArchetype: string;
  userScores: Record<string, number>;
  similarUsers: SimilarUser[];
  perfectMatches: SimilarUser[];
  sameArchetype: SimilarUser[];
}

export default function MatchesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('catlounge_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch similar users data
    fetch('/api/quiz/similar-users')
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('No quiz result found. Please take the quiz first.');
          }
          if (res.status === 401) {
            throw new Error('Please log in to view your matches.');
          }
          throw new Error('Failed to load matches data');
        }
        return res.json();
      })
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Matches fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your personality matches...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.error}>
            <h2>⚠️ {error}</h2>
            <button onClick={() => router.push('/quiz')} className={styles.button}>
              Take the Quiz
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!matches) return null;

  const userArchetype = CAT_ARCHETYPES.find(a => a.key === matches.userArchetype);

  // Helper to get avatar URL
  const getAvatarUrl = (avatarData: string | null, discordUserId: string) => {
    if (avatarData && avatarData.startsWith('/uploads/')) {
      return avatarData;
    }
    if (avatarData) {
      return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatarData}.png`;
    }
    return '/noprofile.png';
  };

  return (
    <div className={styles.container}>
      <Header onAuthClick={() => {}} />
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src="/kittybackground.mp4" type="video/mp4" />
      </video>
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Your Personality Matches</h1>
            <p className={styles.subtitle}>
              Find members with similar personalities and discover your quiz twins
            </p>
            {userArchetype && (
              <div className={styles.userArchetypeBadge}>
                <Image
                  src={userArchetype.icon}
                  alt={userArchetype.name}
                  width={40}
                  height={40}
                />
                <span>Your Archetype: {userArchetype.name}</span>
              </div>
            )}
          </div>
        </section>

        {/* Quiz Twins Section - 100% Matches */}
        {matches.perfectMatches.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.twinIcon}>👯</span>
                Your Quiz Twins
              </h2>
              <p className={styles.sectionDescription}>
                These members answered every question exactly like you! You share 100% identical personality patterns.
              </p>
              <div className={styles.badge}>{matches.perfectMatches.length} Perfect Match{matches.perfectMatches.length !== 1 ? 'es' : ''}</div>
            </div>
            <div className={styles.matchesGrid}>
              {matches.perfectMatches.map((match) => {
                const archetype = CAT_ARCHETYPES.find(a => a.key === match.archetype.key);
                return (
                  <div key={match.discordUserId} className={`${styles.matchCard} ${styles.perfectMatch}`}>
                    <div className={styles.perfectBadge}>100% Match</div>
                    <div className={styles.matchAvatar}>
                      <Image
                        src={getAvatarUrl(match.avatar, match.discordUserId)}
                        alt={match.username}
                        width={100}
                        height={100}
                        className={styles.avatar}
                        loading="lazy"
                      />
                    </div>
                    <h3 className={styles.matchUsername}>{match.username}</h3>
                    {archetype && (
                      <div className={styles.matchArchetype}>
                        <Image
                          src={archetype.icon}
                          alt={archetype.name}
                          width={24}
                          height={24}
                          loading="lazy"
                        />
                        <span>{archetype.name}</span>
                      </div>
                    )}
                    <div className={styles.matchStats}>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{match.matchingAnswers}/{match.totalQuestions}</span>
                        <span className={styles.statLabel}>Matching Answers</span>
                      </div>
                    </div>
                    <button
                      className={styles.compareButtonCard}
                      onClick={() => router.push(`/quiz/compare?userId=${user?.discordUserId}&compareUserId=${match.discordUserId}`)}
                    >
                      Compare Results →
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Top Similar Users */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.similarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Most Similar Members
            </h2>
            <p className={styles.sectionDescription}>
              These members share the most similar personality patterns with you based on your quiz answers.
            </p>
          </div>
          <div className={styles.matchesList}>
            {matches.similarUsers.slice(0, 10).map((match, index) => {
              const archetype = CAT_ARCHETYPES.find(a => a.key === match.archetype.key);
              const compatibilityPercentage = Math.round((match.matchingAnswers / match.totalQuestions) * 100);
              
              return (
                <div key={match.discordUserId} className={styles.matchRow}>
                  <div className={styles.rankBadge}>#{index + 1}</div>
                  <div className={styles.matchInfo}>
                    <div className={styles.matchHeader}>
                      <Image
                        src={getAvatarUrl(match.avatar, match.discordUserId)}
                        alt={match.username}
                        width={60}
                        height={60}
                        className={styles.avatar}
                        loading="lazy"
                      />
                      <div className={styles.matchDetails}>
                        <h3 className={styles.matchUsername}>{match.username}</h3>
                        {archetype && (
                          <div className={styles.matchArchetype}>
                            <Image
                              src={archetype.icon}
                              alt={archetype.name}
                              width={20}
                              height={20}
                              loading="lazy"
                            />
                            <span>{archetype.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.compatibilityBar}>
                      <div className={styles.compatibilityLabel}>
                        <span>Compatibility</span>
                        <span className={styles.compatibilityPercent}>{compatibilityPercentage}%</span>
                      </div>
                      <div className={styles.progressBar} data-progress={compatibilityPercentage}>
                        <div className={styles.progressFill}></div>
                      </div>
                      <div className={styles.answerStats}>
                        <span className={styles.matching}>
                          ✓ {match.matchingAnswers} matching
                        </span>
                        <span className={styles.differing}>
                          ✗ {match.differingQuestionIds.length} different
                        </span>
                      </div>
                    </div>
                    <button
                      className={styles.compareButton}
                      onClick={() => router.push(`/quiz/compare?userId=${user?.discordUserId}&compareUserId=${match.discordUserId}`)}
                    >
                      <svg className={styles.compareIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                      Compare Results
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Archetype Family - Same Archetype */}
        {matches.sameArchetype.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.familyIcon}>🐱</span>
                Your Archetype Family
              </h2>
              <p className={styles.sectionDescription}>
                These members share your main archetype: <strong>{userArchetype?.name}</strong>
              </p>
              <div className={styles.badge}>{matches.sameArchetype.length} Member{matches.sameArchetype.length !== 1 ? 's' : ''}</div>
            </div>
            <div className={styles.matchesGrid}>
              {matches.sameArchetype.slice(0, 12).map((match) => {
                const archetype = CAT_ARCHETYPES.find(a => a.key === match.archetype.key);
                const compatibilityPercentage = Math.round((match.matchingAnswers / match.totalQuestions) * 100);
                
                return (
                  <div key={match.discordUserId} className={styles.matchCard}>
                    <div className={styles.compatibilityBadge}>{compatibilityPercentage}%</div>
                    <div className={styles.matchAvatar}>
                      <Image
                        src={getAvatarUrl(match.avatar, match.discordUserId)}
                        alt={match.username}
                        width={80}
                        height={80}
                        className={styles.avatar}
                        loading="lazy"
                      />
                    </div>
                    <h3 className={styles.matchUsername}>{match.username}</h3>
                    {archetype && (
                      <div className={styles.matchArchetype}>
                        <Image
                          src={archetype.icon}
                          alt={archetype.name}
                          width={24}
                          height={24}
                          loading="lazy"
                        />
                        <span>{archetype.name}</span>
                      </div>
                    )}
                    <div className={styles.matchStats}>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{match.matchingAnswers}/{match.totalQuestions}</span>
                        <span className={styles.statLabel}>Matching Answers</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {matches.sameArchetype.length > 12 && (
              <button 
                onClick={() => router.push(`/quiz/archetype/${matches.userArchetype}`)}
                className={styles.viewAllButton}
              >
                View All {userArchetype?.name} Members
              </button>
            )}
          </section>
        )}

        {/* Navigation */}
        <section className={styles.navigation}>
          <button onClick={() => router.push('/quiz/result')} className={styles.navButton}>
            ← Back to Results
          </button>
          <button onClick={() => router.push('/quiz/analytics')} className={styles.navButton}>
            View My Analytics
          </button>
        </section>
      </main>
    </div>
  );
}
