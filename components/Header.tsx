'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProfileModal from './ProfileModal';
import styles from './Header.module.css';
import { useLanguage } from '@/lib/LanguageContext';
import { languages } from '@/lib/translations';

interface HeaderProps {
  onAuthClick: () => void;
}

export default function Header({ onAuthClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; pfp: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const currentLanguage = languages.find(l => l.code === language) || languages[0];
  
  useEffect(() => {
    const storedUser = localStorage.getItem('catlounge_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
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
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img src="/catloungepfp.webp" alt="Cat Lounge" className={styles.logoIcon} />
          <span className={styles.logoText}>Cat Lounge</span>
        </div>

        {/* Mobile hamburger menu button */}
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>

        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.mobileNavOpen : ''}`}>
          <div className={styles.dropdown}>
            <button 
              className={styles.navButton}
              onClick={() => setShowResourcesMenu(!showResourcesMenu)}
            >
              {t('resources')}
              <span className={styles.arrow}>▼</span>
            </button>
            {showResourcesMenu && (
              <div className={styles.dropdownMenu}>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => { window.location.href = '/'; setShowResourcesMenu(false); }}
                >
                  Home
                </button>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => { window.location.href = '/quiz'; setShowResourcesMenu(false); }}
                >
                  {t('takeQuiz')}
                </button>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => { window.location.href = '/staff'; setShowResourcesMenu(false); }}
                >
                  {t('meetTheStaff')}
                </button>
              </div>
            )}
          </div>

          <div className={styles.dropdown}>
            <button 
              className={styles.langButton}
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <img src={currentLanguage.flagUrl} alt="" className={styles.flag} />
              {currentLanguage.code}
            </button>
            {showLanguageMenu && (
              <div className={styles.dropdownMenu}>
                {languages.map((lang) => (
                  <button 
                    key={lang.code}
                    className={styles.dropdownItem} 
                    onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                  >
                    <img src={lang.flagUrl} alt="" className={styles.flagSmall} /> {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.profileWrapper}>
            <button 
              className={styles.accountButton} 
              onClick={() => user ? setShowProfileMenu(!showProfileMenu) : onAuthClick()}
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
        </nav>
      </div>
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={user}
          onUpdate={handleProfileUpdate}
        />
      )}
    </header>
  );
}
