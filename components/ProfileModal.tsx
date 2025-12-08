'use client';

import { useState, useEffect } from 'react';
import styles from './ProfileModal.module.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; pfp: string };
  onUpdate: (userData: { username: string; pfp: string }) => void;
}

export default function ProfileModal({ isOpen, onClose, currentUser, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState(currentUser.username);
  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState('#5865f2');
  const [avatarDecoration, setAvatarDecoration] = useState<string>('none');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pfp, setPfp] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // Preview profile picture
  useEffect(() => {
    if (pfp) {
      const url = URL.createObjectURL(pfp);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pfp]);

  // Preview banner
  useEffect(() => {
    if (banner) {
      const url = URL.createObjectURL(banner);
      setBannerPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [banner]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    // Validate new password if provided
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setMessage('New passwords do not match');
        setIsLoading(false);
        return;
      }
      if (newPassword.length < 8) {
        setMessage('Password must be at least 8 characters long');
        setIsLoading(false);
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        setMessage('Password must contain uppercase, lowercase, and numbers');
        setIsLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('currentUsername', currentUser.username);
    formData.append('newUsername', username);
    if (displayName) formData.append('displayName', displayName);
    if (pronouns) formData.append('pronouns', pronouns);
    if (bio) formData.append('bio', bio);
    if (themeColor) formData.append('themeColor', themeColor);
    if (avatarDecoration) formData.append('avatarDecoration', avatarDecoration);
    formData.append('csrfToken', csrfToken);
    if (currentPassword) formData.append('currentPassword', currentPassword);
    if (newPassword) formData.append('newPassword', newPassword);
    if (pfp) formData.append('pfp', pfp);
    if (banner) formData.append('banner', banner);

    try {
      const response = await fetch('/api/auth/update', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        onUpdate({
          username: data.user.username,
          pfp: data.user.pfp
        });
        setTimeout(() => {
          onClose();
          setMessage('');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPfp(null);
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
          <h2 className={styles.title}>Profile Settings</h2>
          <p className={styles.subtitle}>Update your account information</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.leftColumn}>
            <div className={styles.profileCard}>
              <div className={styles.profileBanner} ref={(el) => { if (el) el.style.backgroundColor = themeColor; }}>
                {bannerPreview && (
                  <img src={bannerPreview} alt="Banner" className={styles.bannerImage} />
                )}
              </div>
              
              <div className={styles.profileBody}>
                <div className={styles.avatarContainer}>
                  <div className={styles.avatarWrapper} ref={(el) => { if (el) el.style.borderColor = themeColor; }}>
                    <img src={previewUrl || currentUser.pfp} alt="Profile" className={styles.avatar} />
                    {avatarDecoration !== 'none' && (
                      <div className={styles.avatarDecoration} data-decoration={avatarDecoration}></div>
                    )}
                  </div>
                  <div className={styles.statusIndicator}></div>
                </div>

                <div className={styles.badgeList}>
                  <div className={styles.badge} title="Server Owner">👑</div>
                  <div className={styles.badge} title="Verified">✓</div>
                </div>

                <div className={styles.profileContent}>
                  <div className={styles.profileHeader}>
                    <h3 className={styles.displayName}>{displayName || username}</h3>
                    <span className={styles.username}>@{username}</span>
                  </div>

                  {pronouns && (
                    <div className={styles.pronounsTag}>{pronouns}</div>
                  )}

                  <div className={styles.dividerLine}></div>

                  {bio && (
                    <div className={styles.bioSection}>
                      <h4 className={styles.sectionTitle}>ABOUT ME</h4>
                      <p className={styles.bioText}>{bio}</p>
                    </div>
                  )}

                  <div className={styles.memberSince}>
                    <h4 className={styles.sectionTitle}>MEMBER SINCE</h4>
                    <p className={styles.dateText}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.uploadButtons}>
              <label htmlFor="pfp" className={styles.changeButton}>
                Change Avatar
                <input
                  id="pfp"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPfp(e.target.files?.[0] || null)}
                  className={styles.fileInputHidden}
                />
              </label>
              <label htmlFor="banner" className={styles.changeButton}>
                Change Banner
                <input
                  id="banner"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBanner(e.target.files?.[0] || null)}
                  className={styles.fileInputHidden}
                />
              </label>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">USERNAME</label>
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
              <label htmlFor="displayName">DISPLAY NAME</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={styles.input}
                placeholder="How others see you"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="pronouns">PRONOUNS</label>
              <input
                id="pronouns"
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                className={styles.input}
                placeholder="e.g., he/him, she/her, they/them"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="bio">BIO</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={styles.textarea}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={200}
              />
            </div>

            <div className={styles.divider}>
              <span>PROFILE CUSTOMIZATION</span>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="themeColor">PROFILE THEME COLOR</label>
              <div className={styles.colorPickerWrapper}>
                <input
                  id="themeColor"
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className={styles.colorInput}
                  placeholder="#5865f2"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="avatarDecoration">AVATAR DECORATION</label>
              <select
                id="avatarDecoration"
                value={avatarDecoration}
                onChange={(e) => setAvatarDecoration(e.target.value)}
                className={styles.select}
              >
                <option value="none">None</option>
                <option value="sparkle">✨ Sparkle</option>
                <option value="crown">👑 Crown</option>
                <option value="star">⭐ Star</option>
                <option value="heart">💖 Heart</option>
                <option value="fire">🔥 Fire</option>
                <option value="snowflake">❄️ Snowflake</option>
              </select>
            </div>

            <div className={styles.divider}>
              <span>CHANGE PASSWORD (OPTIONAL)</span>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">CURRENT PASSWORD</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
                placeholder="Required to change password"
              />
            </div>

            <div className={styles.passwordRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword">NEW PASSWORD</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={styles.fullWidth}>
              <div className={message.includes('success') ? styles.successMessage : styles.errorMessage}>
                {message}
              </div>
            </div>
          )}

          <div className={styles.fullWidth}>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
