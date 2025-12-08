'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

interface QuizResult {
  archetype: {
    key: string;
    name: string;
    description: string;
    traits: string[];
    emoji: string;
    icon: string;
  };
  scores: Record<string, number>;
  roleAssigned: boolean;
  roleError: string | null;
}

const ARCHETYPE_NAMES: Record<string, string> = {
  soft_cuddly: 'Soft & Cuddly',
  chaos_goblin: 'Chaos Goblin',
  royal_fancy: 'Royal & Fancy',
  cool_alley: 'Cool Alley Cat',
  wise_old: 'Wise Old Soul',
  adventurous_hunter: 'Adventurous Hunter',
};

interface Statistics {
  totalUsers: number;
  archetypeStats: {
    key: string;
    name: string;
    emoji: string;
    icon: string;
    count: number;
    percentage: string;
    isUserArchetype: boolean;
  }[];
}

export default function QuizResultPage() {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [challengeLink, setChallengeLink] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchResult();
  }, []);

  useEffect(() => {
    // Set progress bar widths using CSS custom properties
    if (result) {
      const bars = document.querySelectorAll(`.${styles.scoreBarFill}`);
      bars.forEach((bar) => {
        const percentage = bar.getAttribute('data-percentage');
        if (percentage && bar instanceof HTMLElement) {
          bar.style.setProperty('--score-width', `${percentage}%`);
        }
      });
    }
  }, [result]);

  const checkAuthAndFetchResult = async () => {
    try {
      // Check if user is authenticated
      const statusRes = await fetch('/api/quiz/status');
      const statusData = await statusRes.json();

      if (!statusData.authenticated) {
        router.push('/quiz');
        return;
      }

      setAuthenticated(true);

      // Fetch user's quiz result
      const resultRes = await fetch('/api/quiz/my-result');
      if (resultRes.ok) {
        const data = await resultRes.json();
        setResult(data.result);
      }

      // Fetch statistics
      const statsRes = await fetch('/api/quiz/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }
    } catch (error) {
      console.error('Error fetching result:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxScore = () => {
    if (!result) return 0;
    return Math.max(...Object.values(result.scores));
  };

  const getScorePercentage = (score: number) => {
    const maxScore = getMaxScore();
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  const getSortedScores = () => {
    if (!result) return [];
    return Object.entries(result.scores)
      .sort(([, a], [, b]) => b - a)
      .map(([key, score]) => ({
        key,
        name: ARCHETYPE_NAMES[key],
        score,
        percentage: getScorePercentage(score),
        isWinner: key === result.archetype.key,
      }));
  };

  const handleShareTwitter = () => {
    if (!result) return;
    const text = `I just discovered my cat personality: ${result.archetype.name}! ${result.archetype.emoji}\n\nFind out yours at Cat Lounge! 🐱`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareDiscord = () => {
    if (!result) return;
    const message = `I'm a **${result.archetype.name}** ${result.archetype.emoji}! What cat personality are you? Take the quiz at Cat Lounge!`;
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = window.location.origin + '/quiz';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPersonalityNarrative = (key: string): string => {
    const narratives: Record<string, string> = {
      soft_cuddly: "Your journey through life is one of comfort and connection. You've discovered that true strength lies in gentleness, and your ability to create safe, warm spaces for others is a rare gift. You understand that rest isn't laziness—it's restoration. Your presence alone brings peace to those around you.",
      chaos_goblin: "You've embraced the beautiful chaos of existence! Your energy is infectious, and you've learned that life is too short to take everything seriously. Your playful spirit reminds others to find joy in the unexpected. You're not just living—you're celebrating every moment with wild enthusiasm.",
      royal_fancy: "You've cultivated a sense of self-worth that others admire. Your journey has taught you that quality matters more than quantity, and that taking care of yourself isn't selfish—it's essential. You've mastered the art of graceful living and know your worth.",
      cool_alley: "Your path has been one of independence and self-discovery. You've learned to trust your instincts and forge your own way. Your confidence comes from within, and you've proven time and again that you don't need to follow the crowd to find success. You're the master of your own destiny.",
      wise_old: "Your journey is one of deep observation and understanding. You've learned that wisdom comes from patience and careful thought. You see patterns others miss and understand that the best answers come from quiet contemplation. Your insight is a beacon for others.",
      adventurous_hunter: "Your life is an adventure, and you wouldn't have it any other way. You've learned that curiosity leads to discovery, and that taking calculated risks often leads to the greatest rewards. Your alertness and quick thinking have served you well on your journey."
    };
    return narratives[key] || narratives.soft_cuddly;
  };

  const getStrengths = (key: string): string[] => {
    const strengths: Record<string, string[]> = {
      soft_cuddly: [
        "Creating comfortable, welcoming environments",
        "Providing emotional support without judgment",
        "Knowing when rest and recuperation are needed",
        "Building deep, meaningful connections"
      ],
      chaos_goblin: [
        "Bringing energy and excitement to any situation",
        "Thinking outside the box and finding creative solutions",
        "Lifting spirits and making people laugh",
        "Adapting quickly to change"
      ],
      royal_fancy: [
        "Maintaining high standards and attention to detail",
        "Carrying yourself with confidence and poise",
        "Knowing your worth and not settling for less",
        "Appreciating and creating beauty"
      ],
      cool_alley: [
        "Solving problems independently",
        "Staying calm under pressure",
        "Adapting to any environment",
        "Inspiring others with your confidence"
      ],
      wise_old: [
        "Seeing the big picture others miss",
        "Providing thoughtful advice and perspective",
        "Remaining calm in chaos",
        "Learning from every experience"
      ],
      adventurous_hunter: [
        "Staying alert and aware of opportunities",
        "Taking initiative and acting decisively",
        "Pushing beyond comfort zones",
        "Keeping skills sharp through practice"
      ]
    };
    return strengths[key] || strengths.soft_cuddly;
  };

  const getGrowthAreas = (key: string): string[] => {
    const growth: Record<string, string[]> = {
      soft_cuddly: [
        "Setting boundaries to avoid overextending yourself",
        "Stepping outside your comfort zone occasionally",
        "Asserting your needs when necessary"
      ],
      chaos_goblin: [
        "Developing focus for long-term projects",
        "Considering consequences before acting",
        "Finding balance between play and responsibility"
      ],
      royal_fancy: [
        "Being flexible when things don't go as planned",
        "Showing warmth to those who haven't 'earned' it yet",
        "Accepting imperfection in yourself and others"
      ],
      cool_alley: [
        "Asking for help when you need it",
        "Opening up emotionally to deepen connections",
        "Recognizing that vulnerability is strength"
      ],
      wise_old: [
        "Taking action instead of just observing",
        "Sharing your wisdom more actively",
        "Embracing spontaneity occasionally"
      ],
      adventurous_hunter: [
        "Slowing down to enjoy the present moment",
        "Developing patience with slower processes",
        "Balancing action with reflection"
      ]
    };
    return growth[key] || growth.soft_cuddly;
  };

  const getAlternativePathHint = (key: string, percentage: number): string => {
    if (percentage >= 85) {
      return "So close! Just a few different choices and this could have been you.";
    } else if (percentage >= 70) {
      return "You have strong traits of this personality too—consider it your secondary nature.";
    } else {
      return "This personality resonates with parts of who you are.";
    }
  };

  const handleChallengeFriend = async () => {
    try {
      // Get current user's discord ID
      const statusRes = await fetch('/api/quiz/status');
      const statusData = await statusRes.json();
      
      if (statusData.authenticated && statusData.discordUserId) {
        const compareUrl = `${window.location.origin}/quiz/compare?userId=${statusData.discordUserId}&compareUserId=FRIEND_ID`;
        const message = `🐱 Challenge: Compare your cat personality with mine!\n\n` +
          `I'm a ${result?.archetype.name} ${result?.archetype.emoji}!\n\n` +
          `Take the quiz, then visit this link (replace FRIEND_ID with your Discord ID):\n${compareUrl}\n\n` +
          `Or just take the quiz at: ${window.location.origin}/quiz`;
        
        await navigator.clipboard.writeText(message);
        setChallengeLink(message);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setChallengeLink('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating challenge link:', error);
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
          <source src="/kittybackground.mp4" type="video/mp4" />
        </video>
        <div className={styles.container}>
          <div className={styles.loading}>Loading your results...</div>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className={styles.main}>
        <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
          <source src="/kittybackground.mp4" type="video/mp4" />
        </video>
        <div className={styles.container}>
          <div className={styles.noResult}>
            <h2>No Results Found</h2>
            <p>You haven't taken the quiz yet!</p>
            <button 
              className={styles.button}
              onClick={() => router.push('/quiz')}
            >
              Take the Quiz
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src="/kittybackground.mp4" type="video/mp4" />
      </video>

      <div className={styles.container}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          ← Back to Home
        </button>

        <div className={styles.resultCard}>
          <Image 
            src={result.archetype.icon} 
            alt={result.archetype.name} 
            className={styles.resultIcon}
            width={120}
            height={120}
            priority
          />
          <h1 className={styles.resultTitle}>Your Cat Personality</h1>
          <h2 className={styles.archetypeName}>{result.archetype.name}</h2>
          <p className={styles.archetypeDescription}>{result.archetype.description}</p>

          <div className={styles.traits}>
            <h3>Your Traits:</h3>
            <div className={styles.traitList}>
              {result.archetype.traits.map((trait, index) => (
                <span key={index} className={styles.trait}>{trait}</span>
              ))}
            </div>
          </div>

          {/* Personality Journey Narrative */}
          <div className={styles.journeySection}>
            <h3 className={styles.journeyTitle}>🌟 Your Personality Journey</h3>
            <div className={styles.journeyContent}>
              {getPersonalityNarrative(result.archetype.key)}
            </div>
          </div>

          {/* Strengths & Growth */}
          <div className={styles.insightsSection}>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <svg className={styles.insightIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <h4>Your Superpowers</h4>
              </div>
              <ul className={styles.insightList}>
                {getStrengths(result.archetype.key).map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <svg className={styles.insightIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <h4>Growth Opportunities</h4>
              </div>
              <ul className={styles.insightList}>
                {getGrowthAreas(result.archetype.key).map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Alternative Paths */}
          <div className={styles.alternativeSection}>
            <h3 className={styles.alternativeTitle}>🔀 The Roads Not Taken</h3>
            <p className={styles.alternativeDescription}>
              You were close to these personalities too! Here's how you ranked:
            </p>
            <div className={styles.runnerUps}>
              {getSortedScores().slice(1, 4).map((item, index) => (
                <div key={item.key} className={styles.runnerUpCard}>
                  <div className={styles.runnerUpRank}>#{index + 2}</div>
                  <div className={styles.runnerUpName}>{item.name}</div>
                  <div className={styles.runnerUpScore}>{item.percentage.toFixed(0)}%</div>
                  <p className={styles.runnerUpHint}>
                    {getAlternativePathHint(item.key, item.percentage)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Share Section */}
          <div className={styles.shareSection}>
            <h3 className={styles.shareTitle}>Share Your Result</h3>
            <div className={styles.shareButtons}>
              <button 
                onClick={handleShareTwitter}
                className={styles.shareButton + ' ' + styles.shareTwitter}
                title="Share on Twitter"
                aria-label="Share your result on Twitter"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.shareIcon}>
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
                Twitter
              </button>
              <button 
                onClick={handleShareDiscord}
                className={styles.shareButton + ' ' + styles.shareDiscord}
                title="Copy Discord message"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.shareIcon}>
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                </svg>
                Discord
              </button>
              <button 
                onClick={handleCopyLink}
                className={styles.shareButton + ' ' + styles.shareCopy}
                title="Copy quiz link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.shareIcon}>
                  {copied ? (
                    <path d="M20 6L9 17l-5-5"/>
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </>
                  )}
                </svg>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className={styles.shareNote}>
              Want a shareable image? Right-click the result card above and select "Save Image" or take a screenshot!
            </p>
          </div>
        </div>

        <div className={styles.scoresSection}>
          <h2 className={styles.sectionTitle}>
            How Close Were You to Other Personalities?
          </h2>
          <p className={styles.sectionSubtitle}>
            See your scores across all cat archetypes
          </p>

          <div className={styles.scoresList}>
            {getSortedScores().map((item, index) => (
              <div 
                key={item.key} 
                className={`${styles.scoreCard} ${item.isWinner ? styles.winner : ''}`}
              >
                <div className={styles.scoreRank}>#{index + 1}</div>
                <div className={styles.scoreInfo}>
                  <div className={styles.scoreName}>
                    {item.name}
                    {item.isWinner && <span className={styles.winnerBadge}>Your Result</span>}
                  </div>
                  <div className={styles.scoreBar}>
                    <div 
                      className={styles.scoreBarFill}
                      data-percentage={item.percentage}
                    ></div>
                  </div>
                  <div className={styles.scoreValue}>
                    {item.score} points ({item.percentage.toFixed(1)}% of max)
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.retakeButton}
              onClick={() => router.push('/quiz')}
              aria-label="Retake the cat personality quiz"
            >
              Retake Quiz
            </button>
            <button 
              onClick={() => router.push('/quiz/analytics')}
              className={styles.analyticsButton}
              aria-label="View detailed personality analytics"
            >
              <svg className={styles.analyticsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              View Detailed Analytics
            </button>
            <button 
              onClick={() => router.push('/quiz/matches')}
              className={styles.matchesButton}
            >
              <svg className={styles.matchesIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Find Your Personality Matches
            </button>
            <button 
              onClick={() => router.push('/quiz/leaderboard')}
              className={styles.leaderboardButton}
            >
              <svg className={styles.leaderboardIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              View Leaderboard
            </button>
            <button 
              onClick={handleChallengeFriend}
              className={styles.challengeButton}
            >
              <svg className={styles.challengeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                <path d="M17 11l-5-5-5 5"/>
                <path d="M12 18V6"/>
              </svg>
              {copied && challengeLink ? 'Challenge Copied!' : 'Challenge a Friend'}
            </button>
          </div>
          {challengeLink && (
            <div className={styles.challengeNote}>
              <p>Challenge link copied! Share it with a friend to compare results.</p>
              <p className={styles.challengeHint}>💡 Tip: Your friend needs to complete the quiz first, then replace FRIEND_ID in the link with their Discord ID.</p>
            </div>
          )}
        </div>

        {/* STATISTICS SECTION */}
        {statistics && (
          <div className={styles.statisticsSection}>
            <h2 className={styles.sectionTitle}>
              Community Statistics
            </h2>
            <p className={styles.sectionSubtitle}>
              See how your personality compares to {statistics.totalUsers} other Cat Lounge members
            </p>

            <div className={styles.statsList}>
              {statistics.archetypeStats.map((stat, index) => (
                <div 
                  key={stat.key} 
                  className={`${styles.statCard} ${stat.isUserArchetype ? styles.userStat : ''}`}
                >
                  <div className={styles.statRank}>#{index + 1}</div>
                  <div className={styles.statIcon}>
                    <Image 
                      src={stat.icon} 
                      alt={stat.name}
                      width={48}
                      height={48}
                      className={styles.statIconImage}
                    />
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statName}>
                      {stat.name}
                      {stat.isUserArchetype && <span className={styles.youBadge}>← You</span>}
                    </div>
                    <div className={styles.statBar}>
                      <div 
                        className={styles.statBarFill}
                        data-width={stat.percentage}
                      ></div>
                    </div>
                    <div className={styles.statValue}>
                      {stat.count} {stat.count === 1 ? 'person' : 'people'} ({stat.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
