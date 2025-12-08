'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { QUIZ_QUESTIONS } from '@/lib/quizConfig';

interface QuizStats {
  totalResults: number;
  uniqueUsers: number;
  archetypeCounts: Record<string, number>;
  archetypePercentages: Record<string, number>;
  recentCompletions: number;
  retakeRate: number;
}

interface QuizResult {
  id: number;
  discord_username: string;
  discord_avatar: string;
  archetype_key: string;
  archetype_name: string;
  completed_at: string;
}

interface CompletionTrend {
  date: string;
  count: number;
}

interface QuestionDifficulty {
  questionId: number;
  responseCount: number;
  uniqueAnswers: number;
  mostPopularAnswer: number;
  mostPopularPercentage: number;
  splitScore: number;
}

interface PopularAnswer {
  questionId: number;
  answerIndex: number;
  count: number;
  percentage: number;
}

interface Analytics {
  completionTrends: CompletionTrend[];
  questionDifficulty: QuestionDifficulty[];
  archetypeTrends: any[];
  popularAnswers: PopularAnswer[];
}

const ARCHETYPE_NAMES: Record<string, string> = {
  soft_cuddly: 'Soft & Cuddly',
  chaos_goblin: 'Chaos Goblin',
  royal_fancy: 'Royal & Fancy',
  cool_alley: 'Cool Alley Cat',
  wise_old: 'Wise Old Soul',
  adventurous_hunter: 'Adventurous Hunter',
};

const ARCHETYPE_EMOJIS: Record<string, string> = {
  soft_cuddly: '🐱',
  chaos_goblin: '😼',
  royal_fancy: '👑',
  cool_alley: '😎',
  wise_old: '🧘',
  adventurous_hunter: '🏹',
};

const ARCHETYPE_COLORS: Record<string, string> = {
  soft_cuddly: '#ff69b4',
  chaos_goblin: '#ff6347',
  royal_fancy: '#9370db',
  cool_alley: '#4682b4',
  wise_old: '#daa520',
  adventurous_hunter: '#228b22',
};

export default function QuizStatsPage() {
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // Set archetype colors for progress bars and badges
    if (stats) {
      const bars = document.querySelectorAll(`.${styles.progressFill}`);
      bars.forEach((bar) => {
        const color = bar.getAttribute('data-color');
        const percentage = bar.getAttribute('data-percentage');
        if (color && bar instanceof HTMLElement) {
          bar.style.backgroundColor = color;
        }
        if (percentage && bar instanceof HTMLElement) {
          bar.style.width = `${percentage}%`;
        }
      });

      const badges = document.querySelectorAll(`.${styles.resultBadge}`);
      badges.forEach((badge) => {
        const archetype = badge.getAttribute('data-archetype');
        if (archetype && badge instanceof HTMLElement) {
          badge.style.borderColor = ARCHETYPE_COLORS[archetype];
        }
      });

      const colorDots = document.querySelectorAll(`.${styles.archetypeColorDot}`);
      colorDots.forEach((dot) => {
        const color = dot.getAttribute('data-color');
        if (color && dot instanceof HTMLElement) {
          dot.style.backgroundColor = color;
        }
      });
    }

    // Set chart bar heights
    if (analytics) {
      const chartBars = document.querySelectorAll(`.${styles.barFill}`);
      chartBars.forEach((bar) => {
        const height = bar.getAttribute('data-height');
        if (height && bar instanceof HTMLElement) {
          bar.style.height = `${height}%`;
        }
      });

      // Set heat map cell colors based on intensity
      const heatCells = document.querySelectorAll(`.${styles.heatMapCell}`);
      heatCells.forEach((cell) => {
        const intensity = parseInt(cell.getAttribute('data-intensity') || '0');
        if (cell instanceof HTMLElement) {
          // Color gradient from cool (blue) to hot (red)
          // Low intensity: #3b82f6 (blue)
          // Mid intensity: #a78bfa (purple)
          // High intensity: #f97316 (orange)
          // Very high intensity: #ef4444 (red)
          let color = '#1e293b'; // Very low/no data
          if (intensity > 0 && intensity <= 15) {
            color = '#3b82f6'; // Blue
          } else if (intensity > 15 && intensity <= 30) {
            color = '#8b5cf6'; // Purple
          } else if (intensity > 30 && intensity <= 50) {
            color = '#a78bfa'; // Light purple
          } else if (intensity > 50 && intensity <= 70) {
            color = '#f97316'; // Orange
          } else if (intensity > 70) {
            color = '#ef4444'; // Red
          }
          cell.style.backgroundColor = color;
        }
      });
    }
  }, [stats, analytics]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/quiz-stats');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentResults(data.recentResults);
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
          <source src="/kittybackground.mp4" type="video/mp4" />
        </video>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>Loading statistics...</div>
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
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>
            <svg className={styles.titleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            Quiz Analytics Dashboard
          </h1>
          <div className={styles.topBarActions}>
            <button 
              className={styles.navButton}
              onClick={() => router.push('/admin/dashboard')}
            >
              Staff Dashboard
            </button>
            <button 
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {stats && (
          <>
            {/* Overview Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2z"/>
                    <path d="M9 12h6"/>
                    <path d="M9 16h6"/>
                  </svg>
                </div>
                <div className={styles.statValue}>{stats.totalResults}</div>
                <div className={styles.statLabel}>Total Completions</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className={styles.statValue}>{stats.uniqueUsers}</div>
                <div className={styles.statLabel}>Unique Users</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6"/>
                    <path d="M2.5 22v-6h6"/>
                    <path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                </div>
                <div className={styles.statValue}>{stats.retakeRate.toFixed(1)}%</div>
                <div className={styles.statLabel}>Retake Rate</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className={styles.statValue}>{stats.recentCompletions}</div>
                <div className={styles.statLabel}>Last 24 Hours</div>
              </div>
            </div>

            {/* Completion Trends Chart */}
            {analytics && analytics.completionTrends.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18"/>
                    <path d="M7 12l4-4 4 4 5-5"/>
                  </svg>
                  Completion Trends (Last 30 Days)
                </h2>
                <div className={styles.chartContainer}>
                  <div className={styles.lineChart}>
                    {analytics.completionTrends.map((trend) => {
                      const maxCompletions = Math.max(...analytics.completionTrends.map(t => t.count), 1);
                      return (
                        <div key={trend.date} className={styles.chartBar}>
                          <div className={styles.barTooltip}>
                            {new Date(trend.date).toLocaleDateString()}<br/>
                            {trend.count} completion{trend.count !== 1 ? 's' : ''}
                          </div>
                          <div 
                            className={styles.barFill}
                            data-height={(trend.count / maxCompletions) * 100}
                          >
                            <span className={styles.barValue}>{trend.count}</span>
                          </div>
                          <div className={styles.barLabel}>
                            {new Date(trend.date).getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Question Difficulty Analysis */}
            {analytics && analytics.questionDifficulty.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4"/>
                    <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                  </svg>
                  Question Difficulty Analysis
                </h2>
                <p className={styles.sectionDescription}>
                  Split score shows how divisive each question is (higher = more evenly split answers)
                </p>
                <div className={styles.difficultyGrid}>
                  {analytics.questionDifficulty
                    .sort((a, b) => b.splitScore - a.splitScore)
                    .slice(0, 10)
                    .map((q) => {
                      const question = QUIZ_QUESTIONS.find(quiz => quiz.id === q.questionId);
                      return (
                        <div key={q.questionId} className={styles.difficultyCard}>
                          <div className={styles.difficultyHeader}>
                            <span className={styles.questionNumber}>Q{q.questionId}</span>
                            <span className={styles.splitScore}>{q.splitScore.toFixed(1)}% split</span>
                          </div>
                          <p className={styles.questionText}>
                            {question?.text.substring(0, 100)}...
                          </p>
                          <div className={styles.difficultyStats}>
                            <div className={styles.difficultyStat}>
                              <span className={styles.statLabel}>Responses</span>
                              <span className={styles.statValue}>{q.responseCount}</span>
                            </div>
                            <div className={styles.difficultyStat}>
                              <span className={styles.statLabel}>Most Popular</span>
                              <span className={styles.statValue}>{q.mostPopularPercentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Answer Pattern Heat Map */}
            {analytics && analytics.popularAnswers.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                  </svg>
                  Answer Pattern Heat Map
                </h2>
                <p className={styles.sectionDescription}>
                  Visual breakdown of most and least popular answers across all questions
                </p>
                <div className={styles.heatMapContainer}>
                  {QUIZ_QUESTIONS.slice(0, 15).map((question) => {
                    // Find answer data for this question
                    const questionAnswers = analytics.popularAnswers
                      .filter(a => a.questionId === question.id);
                    
                    // Calculate total responses for this question
                    const totalResponses = questionAnswers.reduce((sum, a) => sum + a.count, 0);
                    
                    // Create heat map cells for each possible answer
                    const answerCells = question.options.map((option, index) => {
                      const answerData = questionAnswers.find(a => a.answerIndex === index);
                      const percentage = answerData ? answerData.percentage : 0;
                      const count = answerData ? answerData.count : 0;
                      
                      // Calculate heat intensity (0-100)
                      const intensity = percentage;
                      
                      return (
                        <div 
                          key={`${question.id}-${index}`}
                          className={styles.heatMapCell}
                          data-intensity={Math.round(intensity)}
                          title={`${option.label}: ${count} picks (${percentage.toFixed(1)}%)`}
                        >
                          <span className={styles.heatMapCellLabel}>{index + 1}</span>
                          <span className={styles.heatMapCellValue}>{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    });
                    
                    return (
                      <div key={question.id} className={styles.heatMapRow}>
                        <div className={styles.heatMapQuestion}>
                          <span className={styles.heatMapQuestionNumber}>Q{question.id}</span>
                          <span className={styles.heatMapQuestionText}>
                            {question.text.substring(0, 60)}{question.text.length > 60 ? '...' : ''}
                          </span>
                        </div>
                        <div className={styles.heatMapCells}>
                          {answerCells}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Archetype Distribution */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Archetype Distribution
              </h2>
              <p className={styles.sectionDescription}>
                Community personality breakdown across all quiz completions
              </p>
              <div className={styles.distributionContainer}>
                {/* Pie Chart */}
                <div className={styles.pieChartContainer}>
                  <svg viewBox="0 0 200 200" className={styles.pieChart}>
                    {(() => {
                      const sortedArchetypes = Object.entries(stats.archetypeCounts)
                        .sort(([,a], [,b]) => b - a);
                      let currentAngle = -90; // Start at top
                      
                      return sortedArchetypes.map(([key, count]) => {
                        const percentage = stats.archetypePercentages[key];
                        const angle = (percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle = endAngle;

                        // Convert to radians
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        // Calculate path
                        const x1 = 100 + 90 * Math.cos(startRad);
                        const y1 = 100 + 90 * Math.sin(startRad);
                        const x2 = 100 + 90 * Math.cos(endRad);
                        const y2 = 100 + 90 * Math.sin(endRad);
                        const largeArc = angle > 180 ? 1 : 0;

                        const pathData = [
                          `M 100 100`,
                          `L ${x1} ${y1}`,
                          `A 90 90 0 ${largeArc} 1 ${x2} ${y2}`,
                          `Z`
                        ].join(' ');

                        return (
                          <g key={key}>
                            <path
                              d={pathData}
                              fill={ARCHETYPE_COLORS[key]}
                              stroke="#1a1a2e"
                              strokeWidth="2"
                              className={styles.pieSlice}
                              data-archetype={key}
                            />
                          </g>
                        );
                      });
                    })()}
                    {/* Center circle for donut effect */}
                    <circle cx="100" cy="100" r="50" fill="#1a1a2e" />
                    <text 
                      x="100" 
                      y="100" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      className={styles.pieChartCenter}
                    >
                      {stats.totalResults}
                      <tspan x="100" dy="20" className={styles.pieChartCenterLabel}>
                        Total
                      </tspan>
                    </text>
                  </svg>
                </div>

                {/* Legend */}
                <div className={styles.archetypeGrid}>
                  {Object.entries(stats.archetypeCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([key, count]) => (
                    <div key={key} className={styles.archetypeCard}>
                      <div className={styles.archetypeHeader}>
                        <div 
                          className={styles.archetypeColorDot}
                          data-color={ARCHETYPE_COLORS[key]}
                        ></div>
                        <span className={styles.archetypeName}>{ARCHETYPE_NAMES[key]}</span>
                      </div>
                      <div className={styles.archetypeStats}>
                        <div className={styles.archetypeCount}>{count} users</div>
                        <div className={styles.archetypePercentage}>
                          {stats.archetypePercentages[key].toFixed(1)}%
                        </div>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          data-percentage={stats.archetypePercentages[key]}
                          data-color={ARCHETYPE_COLORS[key]}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Most Popular Answers */}
            {analytics && analytics.popularAnswers.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Most Popular Answers
                </h2>
                <div className={styles.answersTable}>
                  {analytics.popularAnswers.map((answer, index) => {
                    const question = QUIZ_QUESTIONS.find(q => q.id === answer.questionId);
                    return (
                      <div key={`${answer.questionId}-${answer.answerIndex}`} className={styles.answerRow}>
                        <div className={styles.answerRank}>#{index + 1}</div>
                        <div className={styles.answerInfo}>
                          <div className={styles.answerQuestion}>
                            Q{answer.questionId}: {question?.text.substring(0, 80)}...
                          </div>
                          <div className={styles.answerText}>
                            → {question?.options[answer.answerIndex]?.label || `Answer ${answer.answerIndex}`}
                          </div>
                        </div>
                        <div className={styles.answerStats}>
                          <span className={styles.answerCount}>{answer.count} picks</span>
                          <span className={styles.answerPercent}>{answer.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Results */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4"/>
                  <path d="M12 18v4"/>
                  <path d="M4.93 4.93l2.83 2.83"/>
                  <path d="M16.24 16.24l2.83 2.83"/>
                  <path d="M2 12h4"/>
                  <path d="M18 12h4"/>
                  <path d="M4.93 19.07l2.83-2.83"/>
                  <path d="M16.24 7.76l2.83-2.83"/>
                </svg>
                Recent Quiz Completions
              </h2>
              <div className={styles.resultsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>User</div>
                  <div className={styles.tableCell}>Result</div>
                  <div className={styles.tableCell}>Completed</div>
                </div>
                {recentResults.map((result) => (
                  <div key={result.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>
                      <div className={styles.userInfo}>
                        <img 
                          src={result.discord_avatar || '/noprofile.png'} 
                          alt={result.discord_username}
                          className={styles.userAvatar}
                        />
                        <span>{result.discord_username}</span>
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.resultBadge} data-archetype={result.archetype_key}>
                        <span>{result.archetype_name}</span>
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      {new Date(result.completed_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
