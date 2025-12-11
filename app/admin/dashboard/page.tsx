'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import ImageCropper from '@/components/ImageCropper';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ProfileSectionEditor } from '@/components/ProfileSectionEditor';
import { ProfileSection } from '@/lib/sectionTypes';
import { getCroppedImg, readFile } from '@/lib/imageCrop';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StaffMember {
  id: number;
  name: string;
  nickname: string | null;
  discord_tag: string;
  discord_id: string;
  role: string;
  bio: string | null;
  avatar_url: string;
  banner_url: string | null;
  avatar_decoration: string | null;
  position_order: number;
  custom_nickname: string | null;
  custom_bio: string | null;
  custom_bio_emojis: string | null;
  custom_sections: string | null;
  custom_role: string | null;
  custom_avatar_url: string | null;
  custom_banner_url: string | null;
}

interface SortableStaffCardProps {
  member: StaffMember;
  onEdit: (member: StaffMember) => void;
  onDelete: (id: number, name: string) => void;
}

function SortableStaffCard({ member, onEdit, onDelete }: SortableStaffCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: member.id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.staffCard} ${isDragging ? styles.dragging : ''}`}
      data-over={isOver ? 'true' : undefined}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>

      <div className={styles.cardHeader}>
        {(member.custom_banner_url || member.banner_url) && (
          <div className={styles.cardBanner}>
            <Image 
              src={member.custom_banner_url || member.banner_url || ''} 
              alt="" 
              fill
              style={{ objectFit: 'cover' }}
              priority={false}
            />
          </div>
        )}
        <div className={styles.cardAvatarWrapper}>
          <Image 
            src={member.custom_avatar_url || member.avatar_url || '/noprofile.png'} 
            alt={member.name}
            width={80}
            height={80}
            className={styles.cardAvatar}
            priority={false}
          />
          {member.avatar_decoration && (
            <Image 
              src={member.avatar_decoration} 
              alt=""
              width={80}
              height={80}
              className={styles.cardDecoration}
              priority={false}
            />
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>
          {member.custom_nickname || member.nickname || member.name}
        </h3>
        <p className={styles.cardRole}>
          {member.custom_role || member.role}
        </p>
        {(member.custom_bio || member.bio) && (
          <p className={styles.cardBio}>
            {member.custom_bio || member.bio}
          </p>
        )}
        <div className={styles.cardMeta}>
          <span className={styles.cardMetaItem}>
            🎭 {member.discord_tag}
          </span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button 
          className={styles.editButton}
          onClick={() => onEdit(member)}
          title="Edit staff member"
        >
          <svg className={styles.editIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button 
          className={styles.deleteButton}
          onClick={() => onDelete(member.id, member.name)}
          title="Delete staff member"
        >
          <svg className={styles.deleteIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    custom_nickname: '',
    custom_bio: '',
    custom_bio_emojis: '[]',
    custom_sections: '[]',
    custom_role: '',
    custom_avatar_url: '',
    custom_banner_url: '',
    position_order: 0,
  });

  // Image cropping states
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'avatar' | 'banner'>('avatar');
  const [uploading, setUploading] = useState(false);

  // Drag and drop sensors with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleEdit = (member: StaffMember) => {
    setSelectedMember(member);
    setFormData({
      custom_nickname: member.custom_nickname || '',
      custom_bio: member.custom_bio || '',
      custom_bio_emojis: member.custom_bio_emojis || '[]',
      custom_sections: member.custom_sections || '[]',
      custom_role: member.custom_role || '',
      custom_avatar_url: member.custom_avatar_url || '',
      custom_banner_url: member.custom_banner_url || '',
      position_order: member.position_order,
    });
    setShowEditModal(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageDataUrl = await readFile(file);
      setCropperImage(imageDataUrl);
      setCropperType(type);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read image file');
    }
  };

  const handleCropComplete = async (croppedAreaPixels: any) => {
    if (!cropperImage) return;

    try {
      setUploading(true);
      
      // Get cropped blob
      const croppedBlob = await getCroppedImg(cropperImage, croppedAreaPixels, cropperType);
      
      // Upload to server
      const formDataUpload = new FormData();
      formDataUpload.append('image', croppedBlob, `${cropperType}.webp`);
      formDataUpload.append('type', cropperType);

      const response = await fetch('/api/admin/staff/upload-image', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Update form data with new URL
      if (cropperType === 'avatar') {
        setFormData({...formData, custom_avatar_url: data.url});
      } else {
        setFormData({...formData, custom_banner_url: data.url});
      }

      setCropperImage(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedMember) return;

    try {
      const response = await fetch(`/api/admin/staff/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchStaff();
        setShowEditModal(false);
        setSelectedMember(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchStaff();
      } else {
        alert('Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = staffMembers.findIndex((m) => m.id === active.id);
      const newIndex = staffMembers.findIndex((m) => m.id === over.id);

      const newOrder = arrayMove(staffMembers, oldIndex, newIndex);
      setStaffMembers(newOrder);

      // Update position_order for all affected staff
      const updates = newOrder.map((member, index) => ({
        id: member.id,
        position_order: index,
      }));

      try {
        await fetch('/api/admin/staff/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });
      } catch (error) {
        console.error('Error saving order:', error);
        // Revert on error
        fetchStaff();
      }
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src="/kittybackground.mp4" type="video/mp4" />
      </video>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <img src="/catloungepfp.webp" alt="Cat Lounge" className={styles.headerLogo} />
            <div>
              <h1 className={styles.headerTitle}>Staff Dashboard</h1>
              <p className={styles.headerSubtitle}>Manage your team members</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button 
              className={styles.navButton}
              onClick={() => router.push('/admin/quiz-stats')}
            >
              <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Quiz Stats
            </button>
            <button 
              className={styles.navButton}
              onClick={() => router.push('/admin/oversight')}
            >
              <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Oversight
            </button>
            <button 
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div>
              <div className={styles.statValue}>{staffMembers.length}</div>
              <div className={styles.statLabel}>Total Staff</div>
            </div>
          </div>

        </div>

        {/* Staff Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={staffMembers.map(m => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.staffGrid}>
              {staffMembers.map((member) => (
                <SortableStaffCard
                  key={member.id}
                  member={member}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className={`${styles.staffCard} ${styles.grabbing}`}> 
                {(() => {
                  const member = staffMembers.find(m => m.id === activeId);
                  if (!member) return null;
                  return (
                    <>
                      <div className={styles.dragHandle}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <line x1="3" y1="12" x2="21" y2="12" />
                          <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                      </div>
                      <div className={styles.cardHeader}>
                        {(member.custom_banner_url || member.banner_url) && (
                          <div className={styles.cardBanner}>
                            <img src={member.custom_banner_url || member.banner_url || ''} alt="" />
                          </div>
                        )}
                        <div className={styles.cardAvatarWrapper}>
                          <img 
                            src={member.custom_avatar_url || member.avatar_url || '/noprofile.png'} 
                            alt={member.name}
                            className={styles.cardAvatar}
                          />
                          {member.avatar_decoration && (
                            <img 
                              src={member.avatar_decoration} 
                              alt=""
                              className={styles.cardDecoration}
                            />
                          )}
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <h3 className={styles.cardName}>
                          {member.custom_nickname || member.nickname || member.name}
                        </h3>
                        <p className={styles.cardRole}>
                          {member.custom_role || member.role}
                        </p>
                        {(member.custom_bio || member.bio) && (
                          <p className={styles.cardBio}>
                            {member.custom_bio || member.bio}
                          </p>
                        )}
                        <div className={styles.cardMeta}>
                          <span className={styles.cardMetaItem}>
                            🎭 {member.discord_tag}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedMember && (
        <div className={styles.modal} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Staff Member</h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>



            <div className={styles.modalBody}>
              {/* Live Preview */}
              <div className={styles.modalPreview}>
                {showComparison ? (
                  <div className={styles.comparisonView}>
                    {/* Discord Profile */}
                    <div className={styles.comparisonColumn}>
                      <div className={styles.comparisonLabel}>Discord Profile</div>
                      <div className={styles.previewCard}>
                        {selectedMember.banner_url && (
                          <div className={styles.previewBanner}>
                            <img src={selectedMember.banner_url} alt="" />
                          </div>
                        )}
                        <div className={styles.previewAvatarWrapper}>
                          <img 
                            src={selectedMember.avatar_url || '/noprofile.png'} 
                            alt=""
                            className={styles.previewAvatar}
                          />
                          {selectedMember.avatar_decoration && (
                            <img 
                              src={selectedMember.avatar_decoration} 
                              alt=""
                              className={styles.previewDecoration}
                            />
                          )}
                        </div>
                        <div className={styles.previewInfo}>
                          <h3>{selectedMember.nickname || selectedMember.name}</h3>
                          <p>{selectedMember.role}</p>
                          {selectedMember.bio && <p className={styles.previewBio}>{selectedMember.bio}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Custom Profile */}
                    <div className={styles.comparisonColumn}>
                      <div className={styles.comparisonLabel}>Custom Profile</div>
                      <div className={styles.previewCard}>
                        {(formData.custom_banner_url || selectedMember.banner_url) && (
                          <div className={styles.previewBanner}>
                            <img src={formData.custom_banner_url || selectedMember.banner_url || ''} alt="" />
                          </div>
                        )}
                        <div className={styles.previewAvatarWrapper}>
                          <img 
                            src={formData.custom_avatar_url || selectedMember.avatar_url || '/noprofile.png'} 
                            alt=""
                            className={styles.previewAvatar}
                          />
                          {selectedMember.avatar_decoration && (
                            <img 
                              src={selectedMember.avatar_decoration} 
                              alt=""
                              className={styles.previewDecoration}
                            />
                          )}
                        </div>
                        <div className={styles.previewInfo}>
                          <h3>{formData.custom_nickname || selectedMember.nickname || selectedMember.name}</h3>
                          <p>{formData.custom_role || selectedMember.role}</p>
                          {(formData.custom_bio || selectedMember.bio) && (
                            <p className={styles.previewBio}>{formData.custom_bio || selectedMember.bio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.previewCard}>
                    {(formData.custom_banner_url || selectedMember.banner_url) && (
                      <div className={styles.previewBanner}>
                        <img src={formData.custom_banner_url || selectedMember.banner_url || ''} alt="" />
                      </div>
                    )}
                    <div className={styles.previewAvatarWrapper}>
                      <img 
                        src={formData.custom_avatar_url || selectedMember.avatar_url || '/noprofile.png'} 
                        alt=""
                        className={styles.previewAvatar}
                      />
                      {selectedMember.avatar_decoration && (
                        <img 
                          src={selectedMember.avatar_decoration} 
                          alt=""
                          className={styles.previewDecoration}
                        />
                      )}
                    </div>
                    <div className={styles.previewInfo}>
                      <h3>{formData.custom_nickname || selectedMember.nickname || selectedMember.name}</h3>
                      <p>{formData.custom_role || selectedMember.role}</p>
                      {(formData.custom_bio || selectedMember.bio) && (
                        <p className={styles.previewBio}>{formData.custom_bio || selectedMember.bio}</p>
                      )}
                      <div className={styles.previewMeta}>
                        <span>🎭 {selectedMember.discord_tag}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Content */}
              <div className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label>Custom Nickname</label>
                  <input
                    type="text"
                    value={formData.custom_nickname}
                    onChange={(e) => setFormData({...formData, custom_nickname: e.target.value})}
                    placeholder={selectedMember.nickname || selectedMember.name}
                  />
                  <small>Leave empty to use Discord nickname</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Custom Role</label>
                  <input
                    type="text"
                    value={formData.custom_role}
                    onChange={(e) => setFormData({...formData, custom_role: e.target.value})}
                    placeholder={selectedMember.role}
                  />
                  <small>This appears below the name</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Custom Bio</label>
                  <RichTextEditor
                    value={formData.custom_bio}
                    emojis={JSON.parse(formData.custom_bio_emojis || '[]')}
                    onChange={(value: string, emojis) => {
                      setFormData({
                        ...formData,
                        custom_bio: value,
                        custom_bio_emojis: JSON.stringify(emojis || [])
                      });
                    }}
                    placeholder="Add a custom bio using markdown formatting..."
                  />
                  <small>Use markdown for formatting: **bold**, *italic*, headings, lists, links, etc.</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Profile Sections</label>
                  <ProfileSectionEditor
                    sections={JSON.parse(formData.custom_sections || '[]')}
                    onChange={(sections: ProfileSection[]) => {
                      setFormData({
                        ...formData,
                        custom_sections: JSON.stringify(sections)
                      });
                    }}
                  />
                  <small>Add and customize sections to showcase different aspects of your profile</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Profile Picture (Avatar)</label>
                  <div className={styles.imageUploadSection}>
                    <input
                      type="text"
                      value={formData.custom_avatar_url}
                      onChange={(e) => setFormData({...formData, custom_avatar_url: e.target.value})}
                      placeholder="https://... or upload below"
                      className={styles.urlInput}
                    />
                    <label className={styles.uploadButton}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                        onChange={(e) => handleFileSelect(e, 'avatar')}
                        className={styles.hiddenFileInput}
                      />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Image
                    </label>
                  </div>
                  <small>Upload a custom avatar or paste URL. Recommended: 256x256px, 1:1 ratio</small>
                </div>

                <div className={styles.formGroup}>
                  <label>Banner Image</label>
                  <div className={styles.imageUploadSection}>
                    <input
                      type="text"
                      value={formData.custom_banner_url}
                      onChange={(e) => setFormData({...formData, custom_banner_url: e.target.value})}
                      placeholder="https://... or upload below"
                      className={styles.urlInput}
                    />
                    <label className={styles.uploadButton}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                        onChange={(e) => handleFileSelect(e, 'banner')}
                        className={styles.hiddenFileInput}
                      />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Image
                    </label>
                  </div>
                  <small>Upload a custom banner or paste URL. Recommended: 1024x576px, 16:9 ratio</small>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={showComparison}
                      onChange={(e) => setShowComparison(e.target.checked)}
                    />
                    <span>Show Discord vs Custom comparison</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSave}
              >
                <svg className={styles.saveIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper */}
      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          type={cropperType}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}

      {/* Loading Overlay */}
      {uploading && (
        <div className={styles.uploadingOverlay}>
          <div className={styles.uploadingSpinner}></div>
          <p>Uploading image...</p>
        </div>
      )}
    </main>
  );
}
