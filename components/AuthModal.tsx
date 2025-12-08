'use client';

import { useState, useEffect } from 'react';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: { username: string; pfp: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pfp, setPfp] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/csrf')
        .then(res => res.json())
        .then(data => setCsrfToken(data.csrfToken))
        .catch(err => console.error('Failed to fetch CSRF token:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('csrfToken', csrfToken);
    if (!isLogin && pfp) {
      formData.append('pfp', pfp);
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${isLogin ? 'Login' : 'Signup'} successful!`);
        
        // Call the success callback with user data
        onLoginSuccess({
          username: data.user.username,
          pfp: data.user.pfp || '/noprofile.png'
        });
        
        setTimeout(() => {
          onClose();
          setUsername('');
          setPassword('');
          setPfp(null);
          setMessage('');
        }, 1500);
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalVideoWrapper}>
          <video autoPlay loop muted playsInline>
            <source src="/kittybackground.mp4" type="video/mp4" />
          </video>
        </div>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <img src="/catloungepfp.webp" alt="Cat Lounge" className={styles.logo} />
          </div>
          <h2 className={styles.title}>{isLogin ? 'Welcome Back' : 'Join Cat Lounge'}</h2>
          <p className={styles.subtitle}>{isLogin ? 'Login to continue your journey' : 'Create your account to get started'}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="pfp">Profile Picture (optional)</label>
              <input
                id="pfp"
                type="file"
                accept="image/*"
                onChange={(e) => setPfp(e.target.files?.[0] || null)}
                className={styles.fileInput}
              />
            </div>
          )}

          {message && (
            <div className={message.includes('successful') ? styles.successMessage : styles.errorMessage}>
              {message}
            </div>
          )}

          <button type="submit" className={styles.submitButton}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <button
          className={styles.toggleButton}
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage('');
          }}
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}
