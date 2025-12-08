'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

interface StaffMember {
  id: number;
  discord_id: string;
  discord_tag: string;
  name: string;
  custom_nickname: string | null;
  custom_bio: string | null;
  custom_bio_emojis: string | null;
  custom_sections: string | null;
  avatar_url: string | null;
  updated_at: string;
}

interface ProfileChange {
  id: number;
  staff_id: number;
  changed_by_discord_id: string;
  changed_by_username: string;
  change_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

interface SystemStatus {
  editingLocked: boolean;
  totalStaff: number;
  recentChanges: number;
}

interface DecorationStats {
  avatarDecorations: number;
  profileEffects: number;
  banners: number;
  themes: number;
}

export default function OversightPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [changes, setChanges] = useState<ProfileChange[]>([]);
  const [status, setStatus] = useState<SystemStatus>({
    editingLocked: false,
    totalStaff: 0,
    recentChanges: 0,
  });
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load staff members
      const staffRes = await fetch('/api/staff');
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
      }

      // Load recent changes
      const changesRes = await fetch('/api/admin/oversight/changes');
      if (changesRes.ok) {
        const changesData = await changesRes.json();
        setChanges(changesData);
      }

      // Load system status
      const statusRes = await fetch('/api/admin/oversight/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Failed to load oversight data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLockdown = async () => {
    try {
      const res = await fetch('/api/admin/oversight/lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !status.editingLocked }),
      });

      if (res.ok) {
        setStatus(prev => ({ ...prev, editingLocked: !prev.editingLocked }));
      }
    } catch (error) {
      console.error('Failed to toggle lockdown:', error);
    }
  };

  const backupProfiles = async () => {
    try {
      const res = await fetch('/api/admin/oversight/backup');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `staff-backup-${Date.now()}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to backup profiles:', error);
    }
  };

  const viewStaffChanges = (staffId: number) => {
    setSelectedStaff(staffId === selectedStaff ? null : staffId);
  };

  const syncDecorations = async () => {
    try {
      setSyncing(true);
      setSyncStatus('Syncing decorations from Discord...');

      const res = await fetch('/api/admin/decorations/sync', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSyncStatus(
          `Sync complete! Found: ${data.stats.avatarDecorations} avatar decorations, ` +
          `${data.stats.profileEffects} profile effects, ${data.stats.banners} banners, ` +
          `${data.stats.themes} themes`
        );
        setTimeout(() => setSyncStatus(null), 5000);
      } else {
        const error = await res.json();
        setSyncStatus(`Sync failed: ${error.error}`);
        setTimeout(() => setSyncStatus(null), 5000);
      }
    } catch (error) {
      console.error('Failed to sync decorations:', error);
      setSyncStatus('Sync failed: Network error');
      setTimeout(() => setSyncStatus(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const downloadAssets = async () => {
    try {
      setDownloading(true);
      setDownloadStatus('Downloading and optimizing decoration assets...');

      const res = await fetch('/api/admin/decorations/download', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        const avatarStats = data.stats.avatarDecorations;
        const bannerStats = data.stats.banners;
        setDownloadStatus(
          `Download complete! Avatar decorations: ${avatarStats.success} success, ` +
          `${avatarStats.skipped} skipped, ${avatarStats.failed} failed. ` +
          `Banners: ${bannerStats.success} success, ${bannerStats.skipped} skipped, ${bannerStats.failed} failed.`
        );
        setTimeout(() => setDownloadStatus(null), 7000);
      } else {
        const error = await res.json();
        setDownloadStatus(`Download failed: ${error.error}`);
        setTimeout(() => setDownloadStatus(null), 5000);
      }
    } catch (error) {
      console.error('Failed to download assets:', error);
      setDownloadStatus('Download failed: Network error');
      setTimeout(() => setDownloadStatus(null), 5000);
    } finally {
      setDownloading(false);
    }
  };

  const staffChanges = changes.filter(c => c.staff_id === selectedStaff);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading oversight panel...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🛡️ Owner Oversight Panel</h1>
        <p>Manage all staff profiles and system settings</p>
      </header>

      {/* System Status */}
      <section className={styles.statusSection}>
        <div className={styles.statusCard}>
          <h3>System Status</h3>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Total Staff:</span>
              <span className={styles.statusValue}>{status.totalStaff}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Recent Changes:</span>
              <span className={styles.statusValue}>{status.recentChanges}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Editing Status:</span>
              <span className={`${styles.statusValue} ${status.editingLocked ? styles.locked : styles.unlocked}`}>
                {status.editingLocked ? '🔒 Locked' : '🔓 Unlocked'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Controls */}
      <section className={styles.controlsSection}>
        <h2>System Controls</h2>
        <div className={styles.controls}>
          <button
            onClick={toggleLockdown}
            className={`${styles.btn} ${status.editingLocked ? styles.btnUnlock : styles.btnLock}`}
          >
            {status.editingLocked ? '🔓 Unlock Editing' : '🔒 Lock All Editing'}
          </button>
          <button onClick={backupProfiles} className={`${styles.btn} ${styles.btnBackup}`}>
            💾 Backup All Profiles
          </button>
          <button 
            onClick={syncDecorations} 
            className={`${styles.btn} ${styles.btnSync}`}
            disabled={syncing}
          >
            {syncing ? '⏳ Syncing...' : '🎨 Sync Decorations'}
          </button>
          <button 
            onClick={downloadAssets} 
            className={`${styles.btn} ${styles.btnDownload}`}
            disabled={downloading}
          >
            {downloading ? '⏳ Downloading...' : '📥 Download Assets'}
          </button>
          <button onClick={loadData} className={`${styles.btn} ${styles.btnRefresh}`}>
            🔄 Refresh Data
          </button>
        </div>
        {syncStatus && (
          <div className={styles.syncStatus}>
            {syncStatus}
          </div>
        )}
        {downloadStatus && (
          <div className={styles.downloadStatus}>
            {downloadStatus}
          </div>
        )}
      </section>

      {/* Staff Overview */}
      <section className={styles.staffSection}>
        <h2>Staff Members ({staff.length})</h2>
        <div className={styles.staffGrid}>
          {staff.map(member => (
            <div key={member.id} className={styles.staffCard}>
              <div className={styles.staffHeader}>
                {member.avatar_url && (
                  <Image 
                    src={member.avatar_url} 
                    alt={member.name} 
                    width={50}
                    height={50}
                    className={styles.avatar}
                    priority={false}
                  />
                )}
                <div className={styles.staffInfo}>
                  <h3>{member.custom_nickname || member.name}</h3>
                  <p className={styles.discordTag}>{member.discord_tag}</p>
                </div>
              </div>
              <div className={styles.staffMeta}>
                <span className={styles.metaLabel}>Last Updated:</span>
                <span className={styles.metaValue}>
                  {new Date(member.updated_at).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => viewStaffChanges(member.id)}
                className={styles.viewChangesBtn}
              >
                {selectedStaff === member.id ? 'Hide Changes' : 'View Change History'}
              </button>
              {selectedStaff === member.id && (
                <div className={styles.changesPanel}>
                  <h4>Change History</h4>
                  {staffChanges.length === 0 ? (
                    <p className={styles.noChanges}>No changes recorded</p>
                  ) : (
                    <div className={styles.changesList}>
                      {staffChanges.map(change => (
                        <div key={change.id} className={styles.changeItem}>
                          <div className={styles.changeHeader}>
                            <span className={styles.changeType}>{change.change_type}</span>
                            <span className={styles.changeDate}>
                              {new Date(change.changed_at).toLocaleString()}
                            </span>
                          </div>
                          <p className={styles.changeBy}>
                            Changed by: {change.changed_by_username}
                          </p>
                          {change.field_name && (
                            <div className={styles.changeDetails}>
                              <div className={styles.changeField}>
                                <strong>Field:</strong> {change.field_name}
                              </div>
                              {change.old_value && (
                                <div className={styles.oldValue}>
                                  <strong>Old:</strong> {change.old_value}
                                </div>
                              )}
                              {change.new_value && (
                                <div className={styles.newValue}>
                                  <strong>New:</strong> {change.new_value}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Changes */}
      <section className={styles.changesSection}>
        <h2>Recent Changes Across All Staff</h2>
        <div className={styles.recentChangesList}>
          {changes.slice(0, 20).map(change => {
            const staffMember = staff.find(s => s.id === change.staff_id);
            return (
              <div key={change.id} className={styles.recentChangeItem}>
                <div className={styles.recentChangeHeader}>
                  <span className={styles.staffName}>
                    {staffMember?.name || 'Unknown Staff'}
                  </span>
                  <span className={styles.changeDate}>
                    {new Date(change.changed_at).toLocaleString()}
                  </span>
                </div>
                <div className={styles.recentChangeBody}>
                  <span className={styles.changeType}>{change.change_type}</span>
                  {change.field_name && <span> - {change.field_name}</span>}
                  <span className={styles.changedBy}> by {change.changed_by_username}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
