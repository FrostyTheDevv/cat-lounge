'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type QuizState = 
  | 'intro'
  | 'authPending'
  | 'checkingMembership'
  | 'notInGuild'
  | 'ready'
  | 'inProgress'
  | 'submitting'
  | 'result'
  | 'error';

interface Question {
  id: number;
  text: string;
  options: { label: string }[];
}

interface QuizResult {
  archetype: {
    key: string;
    name: string;
    description: string;
    traits: string[];
    emoji: string;
  };
  icon: string;
  scores: Record<string, number>;
  roleAssigned: boolean;
  roleError: string | null;
}

export default function QuizPage() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>('intro');
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; optionIndex: number }[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string>('');
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    checkQuizStatus();
  }, []);

  const checkQuizStatus = async (recheck: boolean = false) => {
    setState('checkingMembership');
    
    try {
      let response, data;
      
      if (recheck) {
        // Re-verify membership with Discord API
        response = await fetch('/api/quiz/recheck', {
          method: 'POST',
        });
        data = await response.json();
      } else {
        // Just check session cookie
        response = await fetch('/api/quiz/status');
        data = await response.json();
      }

      if (data.authenticated && data.inGuild) {
        setUser(data.user);
        // Check if user has already completed quiz
        await checkExistingResult();
      } else if (data.authenticated && !data.inGuild) {
        setUser(data.user);
        setState('notInGuild');
      } else if (data.inGuild !== undefined) {
        // Recheck returned result but not authenticated
        if (data.inGuild) {
          setUser(data.user);
          setState('ready');
        } else {
          setState('notInGuild');
        }
      } else {
        setState('intro');
      }
    } catch (err) {
      console.error('Status check error:', err);
      setState('intro');
    }
  };

  const checkExistingResult = async () => {
    try {
      const response = await fetch('/api/quiz/my-result');
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setHasResult(true);
          setState('ready');
          return;
        }
      }
    } catch (err) {
      // No result found, continue
    }
    setState('ready');
  };

  const handleStartAuth = () => {
    setState('authPending');
    window.location.href = '/api/auth/discord';
  };

  const handleStartQuiz = async () => {
    try {
      const response = await fetch('/api/quiz/questions');
      const data = await response.json();

      if (response.ok) {
        setQuestions(data.questions);
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setState('inProgress');
      } else {
        setError(data.error || 'Failed to load questions');
        setState('error');
      }
    } catch (err) {
      setError('Failed to load questions');
      setState('error');
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: questions[currentQuestionIndex].id,
      optionIndex,
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setState('submitting');

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
        setState('result');
      } else {
        setError(data.error || 'Failed to submit quiz');
        setState('error');
      }
    } catch (err) {
      setError('Failed to submit quiz');
      setState('error');
    }
  };

  const handleRetake = () => {
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setResult(null);
    setState('ready');
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

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

        {/* INTRO STATE */}
        {state === 'intro' && (
          <div className={styles.introCard}>
            <div className={styles.header}>
              <img src="/Test.png" alt="Quiz" className={styles.introCatIcon} />
              <h1 className={styles.title}>What Kind of Cat Are You?</h1>
              <p className={styles.subtitle}>
                Discover your feline personality archetype with our scientifically questionable quiz!
              </p>
            </div>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureEmoji}>📝</span>
                <div>
                  <h3>20 Questions</h3>
                  <p>Carefully crafted to reveal your inner cat</p>
                </div>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureEmoji}>🎭</span>
                <div>
                  <h3>6 Unique Archetypes</h3>
                  <p>From Chaos Goblin to Royal & Fancy</p>
                </div>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureEmoji}>👑</span>
                <div>
                  <h3>Discord Role</h3>
                  <p>Get your archetype role in our server</p>
                </div>
              </div>
            </div>
            <button className={styles.startButton} onClick={handleStartAuth}>
              Login with Discord to Start
            </button>
            <p className={styles.disclaimer}>
              You must be a member of Cat Lounge to take this quiz
            </p>
          </div>
        )}

        {/* AUTH PENDING STATE */}
        {state === 'authPending' && (
          <div className={styles.loadingCard}>
            <div className={styles.spinner}></div>
            <p>Redirecting to Discord...</p>
          </div>
        )}

        {/* CHECKING MEMBERSHIP STATE */}
        {state === 'checkingMembership' && (
          <div className={styles.loadingCard}>
            <div className={styles.spinner}></div>
            <p>Checking your membership...</p>
          </div>
        )}

        {/* NOT IN GUILD STATE */}
        {state === 'notInGuild' && (
          <div className={styles.errorCard}>
            <span className={styles.bigEmoji}>😿</span>
            <h2>Not in Cat Lounge</h2>
            <p>You need to be a member of the Cat Lounge Discord server to take this quiz.</p>
            <button className={styles.primaryButton} onClick={() => window.open('https://discord.gg/catlounge', '_blank')}>
              Join Cat Lounge
            </button>
            <button className={styles.secondaryButton} onClick={() => checkQuizStatus(true)}>
              I Just Joined - Check Again
            </button>
          </div>
        )}

        {/* READY STATE */}
        {state === 'ready' && user && !hasResult && (
          <div className={styles.readyCard}>
            <div className={styles.userInfo}>
              <img src={user.avatar} alt={user.username} className={styles.userAvatar} />
              <div>
                <h2>Welcome, {user.username}!</h2>
                <p>Ready to discover your cat personality?</p>
              </div>
            </div>
            <button className={styles.startButton} onClick={handleStartQuiz}>
              Begin Quiz
            </button>
          </div>
        )}

        {/* ALREADY COMPLETED STATE */}
        {state === 'ready' && user && hasResult && (
          <div className={styles.readyCard}>
            <div className={styles.userInfo}>
              <img src={user.avatar} alt={user.username} className={styles.userAvatar} />
              <div>
                <h2>Welcome back, {user.username}!</h2>
                <p>You've already completed the quiz!</p>
              </div>
            </div>
            <button className={styles.startButton} onClick={() => router.push('/quiz/result')}>
              View Your Result
            </button>
            <button className={styles.secondaryButton} onClick={handleStartQuiz}>
              Retake Quiz
            </button>
          </div>
        )}

        {/* IN PROGRESS STATE */}
        {state === 'inProgress' && currentQuestion && (
          <div className={styles.quizCard}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                data-progress={progress.toFixed(0)}
              ></div>
            </div>
            <div className={styles.questionNumber}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <h2 className={styles.questionText}>{currentQuestion.text}</h2>
            <div className={styles.options}>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`${styles.option} ${currentAnswer?.optionIndex === index ? styles.selected : ''}`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className={styles.navigation}>
              <button
                className={styles.navButton}
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
              >
                ← Back
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  className={styles.navButton}
                  onClick={handleNext}
                  disabled={!currentAnswer}
                >
                  Next →
                </button>
              ) : (
                <button
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  disabled={answers.length !== questions.length}
                >
                  See My Result 🐾
                </button>
              )}
            </div>
          </div>
        )}

        {/* SUBMITTING STATE */}
        {state === 'submitting' && (
          <div className={styles.loadingCard}>
            <div className={styles.spinner}></div>
            <p>Calculating your cat personality...</p>
          </div>
        )}

        {/* RESULT STATE */}
        {state === 'result' && result && (
          <div className={styles.resultCard}>
            <img src={result.icon} alt={result.archetype.name} className={styles.resultIcon} />
            <h1 className={styles.resultTitle}>You are...</h1>
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
            {result.roleAssigned ? (
              <div className={styles.roleSuccess}>
                ✅ Your Discord role has been updated!
              </div>
            ) : (
              <div className={styles.roleError}>
                ⚠️ Role assignment failed: {result.roleError || 'Unknown error'}
              </div>
            )}
            <button className={styles.retakeButton} onClick={handleRetake}>
              Retake Quiz
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {state === 'error' && (
          <div className={styles.errorCard}>
            <span className={styles.bigEmoji}>😿</span>
            <h2>Oops!</h2>
            <p>{error}</p>
            <button className={styles.primaryButton} onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
