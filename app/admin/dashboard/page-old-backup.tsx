'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  discord_id: string;
  position_order: number;
  custom_nickname: string | null;
  custom_bio: string | null;
  custom_role: string | null;
  custom_avatar_url: string | null;
  custom_banner_url: string | null;
}

export default function AdminDashboard() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    discord_id: '',
    position_order: 0,
    custom_nickname: '',
    custom_bio: '',
    custom_role: '',
    custom_avatar_url: '',
    custom_banner_url: '',
    use_custom_nickname: false,
    use_custom_bio: false,
    use_custom_role: false,
    use_custom_avatar: false,
    use_custom_banner: false,
  });

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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `/api/admin/staff/${editingId}`
        : '/api/admin/staff';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchStaff();
        resetForm();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save staff member');
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('An error occurred');
    }
  };

  const handleEdit = (member: StaffMember) => {
    setFormData({
      name: member.name,
      discord_id: member.discord_id || '',
      position_order: member.position_order,
      custom_nickname: member.custom_nickname || '',
      custom_bio: member.custom_bio || '',
      custom_role: member.custom_role || '',
      custom_avatar_url: member.custom_avatar_url || '',
      custom_banner_url: member.custom_banner_url || '',
      use_custom_nickname: !!member.custom_nickname,
      use_custom_bio: !!member.custom_bio,
      use_custom_role: !!member.custom_role,
      use_custom_avatar: !!member.custom_avatar_url,
      use_custom_banner: !!member.custom_banner_url,
    });
    setEditingId(member.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

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
      alert('An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      discord_id: '',
      position_order: 0,
      custom_nickname: '',
      custom_bio: '',
      custom_role: '',
      custom_avatar_url: '',
      custom_banner_url: '',
      use_custom_nickname: false,
      use_custom_bio: false,
      use_custom_role: false,
      use_custom_avatar: false,
      use_custom_banner: false,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  return (
    <main className={styles.main}>
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src="/kittybackground.mp4" type="video/mp4" />
      </video>

      <div className={styles.container}>
        <div className={styles.topBar}>
          <h1 className={styles.title}>Admin Dashboard - Staff</h1>
          <div className={styles.topButtons}>
            <button 
              className={styles.viewSiteButton}
              onClick={() => router.push('/admin/quiz-stats')}
            >
              📊 Quiz Stats
            </button>
            <button 
              className={styles.viewSiteButton}
              onClick={() => window.location.href = '/staff'}
            >
              View Staff Page
            </button>
            <button 
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.actions}>
            <button 
              className={styles.addButton}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Staff Member'}
            </button>
          </div>

          {showAddForm && (
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>
                {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <p className={styles.formDescription}>
                Staff data is automatically synced from Discord. Use custom overrides below to manually set specific fields.
              </p>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="staff-name">Display Name *</label>
                    <input
                      id="staff-name"
                      type="text"
                      className={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="How the name appears on the staff page"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="staff-discord-id">Discord ID *</label>
                    <input
                      id="staff-discord-id"
                      type="text"
                      className={styles.input}
                      value={formData.discord_id}
                      onChange={(e) => setFormData({...formData, discord_id: e.target.value})}
                      placeholder="18-digit Discord user ID"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="staff-position">Display Order</label>
                    <input
                      id="staff-position"
                      type="number"
                      className={styles.input}
                      value={formData.position_order}
                      onChange={(e) => setFormData({...formData, position_order: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                    <span className={styles.helpText}>Lower numbers appear first</span>
                  </div>
                </div>

                {editingId && (
                  <>
                    <div className={styles.divider}>
                      <span>Custom Overrides (Optional)</span>
                    </div>
                    
                    <div className={styles.formGrid}>
                      <div className={styles.inputGroup}>
                        <label htmlFor="custom-nickname">Custom Nickname</label>
                        <input
                          id="custom-nickname"
                          type="text"
                          className={styles.input}
                          value={formData.custom_nickname}
                          onChange={(e) => setFormData({...formData, custom_nickname: e.target.value})}
                          placeholder="Override server nickname"
                        />
                        <span className={styles.helpText}>Leave empty to use Discord data</span>
                      </div>

                      <div className={styles.inputGroup}>
                        <label htmlFor="custom-role">Custom Role</label>
                        <input
                          id="custom-role"
                          type="text"
                          className={styles.input}
                          value={formData.custom_role}
                          onChange={(e) => setFormData({...formData, custom_role: e.target.value})}
                          placeholder="Override Discord role"
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label htmlFor="custom-avatar">Custom Avatar URL</label>
                        <input
                          id="custom-avatar"
                          type="url"
                          className={styles.input}
                          value={formData.custom_avatar_url}
                          onChange={(e) => setFormData({...formData, custom_avatar_url: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label htmlFor="custom-banner">Custom Banner URL</label>
                        <input
                          id="custom-banner"
                          type="url"
                          className={styles.input}
                          value={formData.custom_banner_url}
                          onChange={(e) => setFormData({...formData, custom_banner_url: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>

                      <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label htmlFor="custom-bio">Custom Bio</label>
                        <textarea
                          id="custom-bio"
                          className={styles.textarea}
                          value={formData.custom_bio}
                          onChange={(e) => setFormData({...formData, custom_bio: e.target.value})}
                          placeholder="Override Discord bio"
                          rows={3}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    {editingId ? 'Update' : 'Add'} Staff Member
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      className={styles.cancelButton}
                      onClick={resetForm}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <div className={styles.staffList}>
              {staffMembers.length === 0 ? (
                <div className={styles.emptyState}>
                  No staff members yet. Add one above!
                </div>
              ) : (
                staffMembers.map((member) => (
                  <div key={member.id} className={styles.staffItem}>
                    <img 
                      src={member.avatar_url || '/noprofile.png'} 
                      alt={member.name}
                      className={styles.avatar}
                    />
                    <div className={styles.info}>
                      <h3 className={styles.name}>{member.name}</h3>
                      <p className={styles.tag}>{member.discord_tag}</p>
                      <p className={styles.role}>{member.role}</p>
                      <p className={styles.bio}>{member.bio}</p>
                    </div>
                    <div className={styles.itemActions}>
                      <button 
                        className={styles.editButton}
                        onClick={() => handleEdit(member)}
                      >
                        Edit
                      </button>
                      <button 
                        className={styles.deleteButton}
                        onClick={() => handleDelete(member.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
