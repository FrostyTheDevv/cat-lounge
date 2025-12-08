'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './page.module.css';

interface ArchetypeData {
  archetype: {
    key: string;
    name: string;
    description: string;
    traits: string[];
    emoji: string;
    icon: string;
  };
  users: Array<{
    rank: number;
    discordUserId: string;
    username: string;
    avatar: string | null;
    completedAt: string;
    scoring: {
      archetypeScore: number;
      totalScore: number;
      scorePercentage: string;
      allScores: Record<string, number>;
      runnerUp: {
        key: string;
        name: string;
        score: number;
      } | null;
    };
    answeredQuestions: number;
  }>;
  totalCount: number;
  statistics: {
    averageScore: string;
    highestScore: number;
    lowestScore: number;
    scoreRange: number;
  };
}

export default function ArchetypeCommunityPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ArchetypeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.key) {
      fetchArchetypeData();
    }
  }, [params.key]);

  const fetchArchetypeData = async () => {
    try {
      const response = await fetch(`/api/quiz/archetype/${params.key}`);
      if (!response.ok) {
        throw new Error('Failed to fetch archetype data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to load community data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.loading}>Loading community...</div>
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header onAuthClick={() => {}} />
        <main className={styles.main}>
          <div className={styles.error}>{error || 'No data available'}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header onAuthClick={() => {}} />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <div className={styles.heroIcon}>
              <Image 
                src={data.archetype.icon} 
                alt={data.archetype.name}
                width={120}
                height={120}
                className={styles.archetypeIcon}
              />
            </div>
            <h1 className={styles.title}>{data.archetype.name} Community</h1>
            <p className={styles.description}>{data.archetype.description}</p>
            <div className={styles.memberCount}>
              {data.totalCount} {data.totalCount === 1 ? 'Member' : 'Members'}
            </div>
          </section>

          {/* Traits Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What Makes Us {data.archetype.name}</h2>
            <div className={styles.traitsList}>
              {data.archetype.traits.map((trait, index) => (
                <div key={index} className={styles.traitCard}>
                  <span className={styles.traitIcon}>✨</span>
                  <span className={styles.traitText}>{trait}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Statistics Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 Community Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{data.statistics.averageScore}</div>
                <div className={styles.statLabel}>Average Score</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{data.statistics.highestScore}</div>
                <div className={styles.statLabel}>Highest Score</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{data.statistics.lowestScore}</div>
                <div className={styles.statLabel}>Lowest Score</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{data.statistics.scoreRange}</div>
                <div className={styles.statLabel}>Score Range</div>
              </div>
            </div>
          </section>

          {/* Members Gallery */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>👥 Community Members</h2>
            <p className={styles.sectionDescription}>
              Ranked by {data.archetype.name} score (highest to lowest)
            </p>
            <div className={styles.membersGrid}>
              {data.users.map((user) => (
                <div key={user.discordUserId} className={styles.memberCard}>
                  <div className={styles.rankBadge}>#{user.rank}</div>
                  <div className={styles.memberAvatar}>
                    <Image 
                      src={user.avatar || '/noprofile.png'} 
                      alt={user.username}
                      width={80}
                      height={80}
                      className={styles.avatar}
                    />
                  </div>
                  <h3 className={styles.memberName}>{user.username}</h3>
                  
                  <div className={styles.scoreInfo}>
                    <div className={styles.mainScore}>
                      <span className={styles.scoreNumber}>{user.scoring.archetypeScore}</span>
                      <span className={styles.scoreLabel}>points</span>
                    </div>
                    <div className={styles.percentage}>
                      {user.scoring.scorePercentage}% match
                    </div>
                  </div>

                  {user.scoring.runnerUp && (
                    <div className={styles.runnerUp}>
                      <span className={styles.runnerUpLabel}>Runner-up:</span>
                      <span className={styles.runnerUpValue}>
                        {user.scoring.runnerUp.name} ({user.scoring.runnerUp.score})
                      </span>
                    </div>
                  )}

                  <div className={styles.memberStats}>
                    <div className={styles.miniStat}>
                      <span className={styles.miniStatValue}>{user.answeredQuestions}</span>
                      <span className={styles.miniStatLabel}>questions</span>
                    </div>
                    <div className={styles.miniStat}>
                      <span className={styles.miniStatValue}>{user.scoring.totalScore}</span>
                      <span className={styles.miniStatLabel}>total</span>
                    </div>
                  </div>

                  <div className={styles.completedDate}>
                    {new Date(user.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Navigation */}
          <section className={styles.navigation}>
            <button 
              onClick={() => router.push('/quiz/result')}
              className={styles.navButton}
            >
              ← Back to Results
            </button>
            <button 
              onClick={() => router.push('/quiz/analytics')}
              className={styles.navButton}
            >
              View My Analytics →
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
