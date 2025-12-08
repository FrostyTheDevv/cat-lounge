'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LazySectionRenderer } from '@/components/LazySectionRenderer';
import { ProfileSection } from '@/lib/sectionTypes';
import styles from './page.module.css';

interface StaffMember {
  id: number;
  name: string;
  nickname: string | null;
  discord_tag: string;
  role: string;
  bio: string | null;
  avatar_url: string;
  banner_url: string | null;
  avatar_decoration: string | null;
  custom_nickname: string | null;
  custom_bio: string | null;
  custom_bio_emojis: string | null;
  custom_sections: string | null;
  custom_role: string | null;
  custom_avatar_url: string | null;
  custom_banner_url: string | null;
  position_order: number;
}

export default function StaffPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src="/kittybackground.mp4" type="video/mp4" />
      </video>

      <div className={styles.container}>
        <button 
          className={styles.backButton}
          onClick={() => window.location.href = '/'}
        >
          ← Back to Home
        </button>

        <div className={styles.header}>
          <h1 className={styles.title}>Meet the Staff</h1>
          <p className={styles.subtitle}>
            Get to know the team behind Cat Lounge
          </p>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading staff members...</p>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No staff members to display yet.</p>
          </div>
        ) : (
          <div className={styles.staffGrid}>
            {staffMembers.map((member) => (
              <div 
                key={member.id} 
                className={styles.staffCard}
                {...((member.custom_banner_url || member.banner_url) && {
                  style: { '--banner-image': `url(${member.custom_banner_url || member.banner_url})` } as React.CSSProperties
                })}
              >
                {/* Banner Background */}
                <div className={styles.cardBanner}>
                  <div className={styles.badge}>{member.custom_role || member.role}</div>
                </div>

                {/* Avatar with Decoration */}
                <div className={styles.avatarContainer}>
                  <div className={styles.avatarWrapper}>
                    {member.avatar_decoration && (
                      <Image 
                        src={member.avatar_decoration}
                        alt="decoration"
                        width={120}
                        height={120}
                        className={styles.avatarDecoration}
                        priority={false}
                      />
                    )}
                    <Image 
                      src={member.custom_avatar_url || member.avatar_url || '/noprofile.png'} 
                      alt={member.name}
                      width={120}
                      height={120}
                      className={styles.avatar}
                      priority={false}
                    />
                  </div>
                </div>

                {/* Profile Info */}
                <div className={styles.cardBody}>
                  <h3 className={styles.name}>
                    {member.custom_nickname || member.nickname || member.name}
                  </h3>
                  {(member.custom_nickname || member.nickname) && (
                    <p className={styles.username}>@{member.name}</p>
                  )}
                  <p className={styles.discordTag}>{member.discord_tag}</p>
                  {(member.custom_bio || member.bio) && (
                    <div className={styles.bioSection}>
                      <div className={styles.bioLabel}>ABOUT ME</div>
                      <div className={styles.bio}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {member.custom_bio || member.bio || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Custom Profile Sections */}
                  {member.custom_sections && (() => {
                    try {
                      const sections: ProfileSection[] = JSON.parse(member.custom_sections);
                      if (sections && sections.length > 0) {
                        return <LazySectionRenderer sections={sections} />;
                      }
                    } catch (e) {
                      console.error('Error parsing custom sections:', e);
                    }
                    return null;
                  })()}
                  
                  {/* Profile Features Debug Info */}
                  {(member.nickname || member.banner_url || member.avatar_decoration || member.bio) && (
                    <div className={styles.profileFeatures}>
                      {member.nickname && <span className={styles.featureBadge}>📛 Nickname</span>}
                      {member.banner_url && <span className={styles.featureBadge}>🖼️ Banner</span>}
                      {member.avatar_decoration && <span className={styles.featureBadge}>✨ Decoration</span>}
                      {member.bio && <span className={styles.featureBadge}>📝 Bio</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
