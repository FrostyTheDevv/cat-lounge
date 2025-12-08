'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Decoration {
  id: number;
  asset_hash?: string;
  banner_hash?: string;
  effect_id?: string;
  theme_name?: string;
  name: string | null;
  description: string | null;
  is_animated: boolean;
  is_premium: boolean;
  category: string | null;
  tags: string | null;
  local_path: string | null;
  cdn_url: string | null;
  thumbnail_url: string | null;
  last_seen: string;
  is_active: boolean;
}

interface DecorationData {
  avatarDecorations?: Decoration[];
  profileEffects?: Decoration[];
  bannerDecorations?: Decoration[];
  profileThemes?: Decoration[];
}

type Category = 'all' | 'avatar' | 'effect' | 'banner' | 'theme';
type Availability = 'all' | 'premium' | 'free';
type SortOption = 'recent' | 'name';

export default function DecorationManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [decorations, setDecorations] = useState<DecorationData>({});
  const [category, setCategory] = useState<Category>('all');
  const [availability, setAvailability] = useState<Availability>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [selectedDecoration, setSelectedDecoration] = useState<Decoration | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDecorations();
    loadStaff();
  }, [category, availability, search, sort]);

  const loadDecorations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category,
        availability,
        search,
        sort,
        active: 'true',
      });

      const res = await fetch(`/api/admin/decorations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDecorations(data.data);
      }
    } catch (error) {
      console.error('Failed to load decorations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const openAssignModal = () => {
    setShowAssignModal(true);
    setSelectedStaff([]);
  };

  const assignDecoration = async () => {
    if (!selectedDecoration || selectedStaff.length === 0) return;

    const decorationType = selectedDecoration.asset_hash ? 'avatar'
      : selectedDecoration.banner_hash ? 'banner'
      : selectedDecoration.effect_id ? 'effect'
      : 'theme';

    try {
      for (const staffId of selectedStaff) {
        await fetch('/api/admin/decorations/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId,
            decorationType,
            decorationId: selectedDecoration.id,
            isOverride: true,
          }),
        });
      }

      setShowAssignModal(false);
      setSelectedStaff([]);
      alert(`Decoration assigned to ${selectedStaff.length} staff member(s)`);
    } catch (error) {
      console.error('Failed to assign decoration:', error);
      alert('Failed to assign decoration');
    }
  };

  const toggleStaffSelection = (staffId: number) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/admin/decorations/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowUploadModal(false);
        loadDecorations(); // Reload decorations
        alert('Decoration uploaded successfully!');
      } else {
        const data = await res.json();
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getCategoryCount = () => {
    let count = 0;
    if (decorations.avatarDecorations) count += decorations.avatarDecorations.length;
    if (decorations.profileEffects) count += decorations.profileEffects.length;
    if (decorations.bannerDecorations) count += decorations.bannerDecorations.length;
    if (decorations.profileThemes) count += decorations.profileThemes.length;
    return count;
  };

  const renderDecorationCard = (decoration: Decoration, type: string) => {
    const imageSrc = decoration.local_path 
      ? `/${decoration.local_path}` 
      : decoration.thumbnail_url || decoration.cdn_url;

    return (
      <div
        key={decoration.id}
        className={styles.decorationCard}
        onClick={() => setSelectedDecoration(decoration)}
      >
        <div className={styles.decorationPreview}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={decoration.name || 'Decoration'}
              className={styles.decorationImage}
            />
          ) : (
            <div className={styles.decorationPlaceholder}>
              {type === 'avatar' && '🎨'}
              {type === 'effect' && '✨'}
              {type === 'banner' && '🖼️'}
              {type === 'theme' && '🎨'}
            </div>
          )}
          {decoration.is_animated && (
            <div className={styles.animatedBadge}>
              <span>🎬</span>
            </div>
          )}
          {decoration.is_premium && (
            <div className={styles.premiumBadge}>
              <span>👑</span>
            </div>
          )}
        </div>
        <div className={styles.decorationInfo}>
          <h4>{decoration.name || `${type} #${decoration.id}`}</h4>
          {decoration.description && (
            <p className={styles.decorationDesc}>{decoration.description}</p>
          )}
          <div className={styles.decorationMeta}>
            <span className={styles.metaTag}>{type}</span>
            {decoration.category && (
              <span className={styles.metaTag}>{decoration.category}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDecorations = () => {
    const allDecorations: React.ReactElement[] = [];

    if (decorations.avatarDecorations) {
      allDecorations.push(
        ...decorations.avatarDecorations.map(dec => renderDecorationCard(dec, 'avatar'))
      );
    }

    if (decorations.profileEffects) {
      allDecorations.push(
        ...decorations.profileEffects.map(dec => renderDecorationCard(dec, 'effect'))
      );
    }

    if (decorations.bannerDecorations) {
      allDecorations.push(
        ...decorations.bannerDecorations.map(dec => renderDecorationCard(dec, 'banner'))
      );
    }

    if (decorations.profileThemes) {
      allDecorations.push(
        ...decorations.profileThemes.map(dec => renderDecorationCard(dec, 'theme'))
      );
    }

    return allDecorations;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading decorations...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>🎨 Decoration Manager</h1>
          <p>Browse and assign Discord decorations to staff members</p>
        </div>
        <button className={styles.btnUpload} onClick={() => setShowUploadModal(true)}>
          ➕ Upload Custom Decoration
        </button>
      </header>

      {/* Controls */}
      <section className={styles.controls}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search decorations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={styles.select}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              <option value="avatar">Avatar Decorations</option>
              <option value="effect">Profile Effects</option>
              <option value="banner">Banners</option>
              <option value="theme">Themes</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Availability:</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as Availability)}
              className={styles.select}
              aria-label="Filter by availability"
            >
              <option value="all">All</option>
              <option value="premium">Premium Only</option>
              <option value="free">Free Only</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Sort By:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={styles.select}
              aria-label="Sort decorations"
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        <div className={styles.stats}>
          <span className={styles.statBadge}>
            {getCategoryCount()} decorations found
          </span>
        </div>
      </section>

      {/* Decoration Grid */}
      <section className={styles.decorationGrid}>
        {renderDecorations()}
      </section>

      {/* Detail Modal */}
      {selectedDecoration && (
        <div className={styles.modal} onClick={() => setSelectedDecoration(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedDecoration(null)}
            >
              ✕
            </button>
            <div className={styles.modalPreview}>
              {selectedDecoration.local_path || selectedDecoration.cdn_url ? (
                <img
                  src={selectedDecoration.local_path 
                    ? `/${selectedDecoration.local_path}` 
                    : selectedDecoration.cdn_url || ''}
                  alt={selectedDecoration.name || 'Decoration'}
                  className={styles.modalImage}
                />
              ) : (
                <div className={styles.modalPlaceholder}>No preview available</div>
              )}
            </div>
            <div className={styles.modalInfo}>
              <h2>{selectedDecoration.name || 'Unnamed Decoration'}</h2>
              {selectedDecoration.description && (
                <p className={styles.modalDescription}>{selectedDecoration.description}</p>
              )}
              <div className={styles.modalMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Type:</span>
                  <span>{selectedDecoration.asset_hash ? 'Avatar' : selectedDecoration.banner_hash ? 'Banner' : selectedDecoration.effect_id ? 'Effect' : 'Theme'}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Animated:</span>
                  <span>{selectedDecoration.is_animated ? 'Yes 🎬' : 'No'}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Premium:</span>
                  <span>{selectedDecoration.is_premium ? 'Yes 👑' : 'No'}</span>
                </div>
                {selectedDecoration.category && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Category:</span>
                    <span>{selectedDecoration.category}</span>
                  </div>
                )}
                {selectedDecoration.tags && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Tags:</span>
                    <span>{selectedDecoration.tags}</span>
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <button className={styles.btnAssign} onClick={openAssignModal}>
                  Assign to Staff
                </button>
                <button className={styles.btnPreview}>
                  Preview on Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedDecoration && (
        <div className={styles.modal} onClick={() => setShowAssignModal(false)}>
          <div className={styles.assignModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setShowAssignModal(false)}
            >
              ✕
            </button>
            <h2>Assign Decoration to Staff</h2>
            <p className={styles.assignDesc}>
              Select staff members to assign <strong>{selectedDecoration.name || 'this decoration'}</strong> to:
            </p>
            <div className={styles.staffList}>
              {staffList.map(staff => (
                <label key={staff.id} className={styles.staffCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(staff.id)}
                    onChange={() => toggleStaffSelection(staff.id)}
                  />
                  <img
                    src={staff.avatar_url || '/default-avatar.png'}
                    alt={staff.name}
                    className={styles.staffAvatar}
                  />
                  <span>{staff.custom_nickname || staff.name}</span>
                </label>
              ))}
            </div>
            <div className={styles.assignActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.btnConfirm}
                onClick={assignDecoration}
                disabled={selectedStaff.length === 0}
              >
                Assign to {selectedStaff.length} Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modal} onClick={() => setShowUploadModal(false)}>
          <div className={styles.uploadModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setShowUploadModal(false)}
            >
              ✕
            </button>
            <h2>Upload Custom Decoration</h2>
            <form onSubmit={handleUpload} className={styles.uploadForm}>
              <div className={styles.formGroup}>
                <label>Decoration Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className={styles.input}
                  placeholder="Enter decoration name"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  className={styles.textarea}
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Decoration Type *</label>
                <select name="decorationType" required className={styles.select} title="Select decoration type">
                  <option value="avatar">Avatar Decoration</option>
                  <option value="banner">Banner</option>
                  <option value="effect">Profile Effect</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  className={styles.input}
                  placeholder="e.g., custom, seasonal, special"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tags</label>
                <input
                  type="text"
                  name="tags"
                  className={styles.input}
                  placeholder="Comma-separated tags"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="isPremium"
                    value="true"
                  />
                  <span>Mark as Premium</span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="decoration-file">Image File *</label>
                <input
                  id="decoration-file"
                  type="file"
                  name="file"
                  required
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  className={styles.fileInput}
                />
                <small className={styles.hint}>
                  Max 5MB. Supported: PNG, JPEG, WebP, GIF, SVG
                </small>
              </div>

              <div className={styles.uploadActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnConfirm}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Decoration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
