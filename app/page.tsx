'use client';

import { useState, useEffect } from 'react';
import AuthModal from '@/components/AuthModal';
import ProfileModal from '@/components/ProfileModal';
import Header from '@/components/Header';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './page.module.css';

export default function Home() {
  const { t, getCurrentLanguageObject, languages, setLanguage } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; pfp: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem('catlounge_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.profileWrapper}`)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLoginSuccess = (userData: { username: string; pfp: string }) => {
    setUser(userData);
    localStorage.setItem('catlounge_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('catlounge_user');
  };

  const handleProfileUpdate = (userData: { username: string; pfp: string }) => {
    setUser(userData);
    localStorage.setItem('catlounge_user', JSON.stringify(userData));
  };

  return (
    <>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={user}
          onUpdate={handleProfileUpdate}
        />
      )}
      
      <main className={styles.main}>
        <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
          <source src="/kittybackground.mp4" type="video/mp4" />
        </video>
        
        <nav className={styles.floatingNav}>
          <div className={styles.navLeft}>
            <img src="/catloungepfp.webp" alt="Cat Lounge" className={styles.navLogo} />
            <span className={styles.navTitle}>Cat Lounge</span>
          </div>
          <div className={styles.navRight}>
            <div className={styles.navDropdown}>
              <button 
                className={styles.navButton}
                onClick={() => setShowResourcesMenu(!showResourcesMenu)}
              >
                {t('resources')} ▼
              </button>
              {showResourcesMenu && (
                <div className={styles.dropdownMenu}>
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => window.location.href = '/quiz'}
                  >
                    {t('takeQuiz')}
                  </button>
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => window.location.href = '/staff'}
                  >
                    {t('meetTheStaff')}
                  </button>
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => { setShowResourcesMenu(false); setIsProfileModalOpen(true); }}
                  >
                    {t('settings')}
                  </button>
                </div>
              )}
            </div>

            <div className={styles.navDropdown}>
              <button 
                className={styles.navButton}
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              >
                <img src={getCurrentLanguageObject().flagUrl} alt="" className={styles.languageFlag} />
                {getCurrentLanguageObject().name}
              </button>
              {showLanguageMenu && (
                <div className={styles.dropdownMenu}>
                  {languages.map((lang) => (
                    <button 
                      key={lang.code}
                      className={styles.dropdownItem} 
                      onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                    >
                      <img src={lang.flagUrl} alt="" className={styles.languageFlagSmall} /> {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.accountSection}>
              <div className={styles.profileWrapper}>
                <button 
                  className={styles.accountButton} 
                  onClick={() => user ? setShowProfileMenu(!showProfileMenu) : setIsAuthModalOpen(true)}
                >
                  <img src={user?.pfp || "/noprofile.png"} alt="Account" className={styles.accountIcon} />
                </button>
                {user && (
                  <>
                    <span className={styles.username}>{user.username}</span>
                    {showProfileMenu && (
                      <div className={styles.profileDropdown}>
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            setIsProfileModalOpen(true);
                            setShowProfileMenu(false);
                          }}
                        >
                          <span>⚙️</span>
                          Settings
                        </button>
                        <div className={styles.dropdownDivider}></div>
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            window.location.href = '/admin/login';
                            setShowProfileMenu(false);
                          }}
                        >
                          <span>🔐</span>
                          Admin
                        </button>
                        <div className={styles.dropdownDivider}></div>
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            handleLogout();
                            setShowProfileMenu(false);
                          }}
                        >
                          <span>🚪</span>
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <h1 className={styles.mainTitle}>
              {t('welcomeTitle')} 🐾
            </h1>
            
            <p className={styles.subtitle}>
              {t('welcomeSubtitle')}
            </p>

            <div className={styles.buttons}>
              <a href="/quiz" className={styles.imageButton}>
                <img src="/takethequiz.png" alt="Take the Quiz" />
              </a>
              
              <a href="https://discord.gg/catlounge" target="_blank" rel="noopener noreferrer" className={styles.imageButton}>
                <img src="/jointheserver.png" alt="Join the Server" />
              </a>

              <button 
                className={styles.aboutButton}
                onClick={() => setShowAbout(!showAbout)}
              >
                <img src="/aboutus.png" alt="About Us" />
              </button>
            </div>
          </div>

          <div className={styles.rightSection}>
            <img src="/catloungebanner.webp" alt="Cat Lounge" className={styles.serverBanner} />
          </div>
        </div>

        {showAbout && (
          <div className={styles.aboutModal} onClick={() => setShowAbout(false)}>
            <div className={styles.aboutModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalVideoWrapper}>
                <video autoPlay loop muted playsInline>
                  <source src="/kittybackground.mp4" type="video/mp4" />
                </video>
              </div>
              <button className={styles.closeButton} onClick={() => setShowAbout(false)}>×</button>
              <div className={styles.aboutSection}>
          <div className={styles.aboutContainer}>
            <div className={styles.aboutBubble}>
              <h2 className={styles.aboutTitle}>{t('aboutTitle1')}</h2>
              <p className={styles.aboutText}>
                {t('aboutText1')}
              </p>
            </div>

            <div className={styles.aboutBubble}>
              <h2 className={styles.aboutTitle}>{t('aboutTitle2')}</h2>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature1')}</strong> — {t('feature1Desc')}
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature2')}</strong> — {t('feature2Desc')}
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature3')}</strong> — {t('feature3Desc')}
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature4')}</strong> — {t('feature4Desc')}
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature5')}</strong> — {t('feature5Desc')}
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature6')}</strong> — {t('feature6Desc')}
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature7')}</strong> — {t('feature7Desc')}
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureBullet}>🐾</span>
                  <div>
                    <strong>{t('feature8')}</strong> — {t('feature8Desc')}
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
        )}
      </main>
    </>
  );
}
