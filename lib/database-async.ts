import { queryAll, queryFirst, execute } from './db-client';
import bcrypt from 'bcryptjs';

// ==================== STAFF FUNCTIONS ====================

export async function updateStaffFromDiscord(data: {
  discord_id: string;
  discord_tag: string;
  name: string;
  nickname?: string | null;
  avatar_url: string;
  banner_url?: string | null;
  avatar_decoration?: string | null;
  role: string;
  bio?: string | null;
}) {
  const existing = await queryFirst<{ id: number }>(
    'SELECT id FROM staff WHERE discord_id = ?',
    [data.discord_id]
  );

  if (existing) {
    // Update existing staff member
    await execute(
      `UPDATE staff SET
        discord_tag = ?,
        name = ?,
        avatar_url = ?,
        banner_url = ?,
        avatar_decoration_asset = ?,
        role = ?,
        bio = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE discord_id = ?`,
      [
        data.discord_tag,
        data.name,
        data.avatar_url,
        data.banner_url || null,
        data.avatar_decoration || null,
        data.role,
        data.bio || null,
        data.discord_id,
      ]
    );
    return existing.id;
  } else {
    // Insert new staff member
    const result = await execute(
      `INSERT INTO staff (
        discord_id, discord_tag, name, avatar_url, banner_url,
        avatar_decoration_asset, role, bio, position_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position_order), 0) + 1 FROM staff))`,
      [
        data.discord_id,
        data.discord_tag,
        data.name,
        data.avatar_url,
        data.banner_url || null,
        data.avatar_decoration || null,
        data.role,
        data.bio || null,
      ]
    );
    return Number(result.lastInsertRowid);
  }
}

export async function removeNonStaffMembers(currentStaffIds: string[]) {
  if (currentStaffIds.length === 0) return;

  const placeholders = currentStaffIds.map(() => '?').join(',');
  await execute(
    `DELETE FROM staff WHERE discord_id NOT IN (${placeholders})`,
    currentStaffIds
  );
}

export async function getAllStaff() {
  return await queryAll(
    `SELECT 
      id, name, discord_tag, role, bio, avatar_url, discord_id,
      position_order, custom_nickname, custom_bio, custom_bio_emojis,
      custom_role, custom_avatar_url, custom_banner_url, custom_sections,
      banner_url, avatar_decoration_asset, avatar_decoration_sku_id,
      created_at, updated_at
    FROM staff 
    ORDER BY position_order ASC, name ASC`
  );
}

export async function getStaffById(id: number) {
  return await queryFirst(
    `SELECT * FROM staff WHERE id = ?`,
    [id]
  );
}

export async function createStaffMember(
  name: string,
  discord_tag: string,
  role: string,
  bio: string | null,
  avatar_url: string,
  discord_id: string,
  position_order?: number
) {
  const result = await execute(
    `INSERT INTO staff (name, discord_tag, role, bio, avatar_url, discord_id, position_order)
     VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, (SELECT COALESCE(MAX(position_order), 0) + 1 FROM staff)))`,
    [name, discord_tag, role, bio, avatar_url, discord_id, position_order || null]
  );

  return { id: Number(result.lastInsertRowid) };
}

export async function updateStaffMember(
  id: number,
  custom_nickname: string | null,
  custom_bio: string | null,
  custom_bio_emojis: string | null,
  custom_sections: string | null,
  custom_role: string | null,
  custom_avatar_url: string | null,
  custom_banner_url: string | null,
  position_order?: number
) {
  await execute(
    `UPDATE staff SET
      custom_nickname = ?,
      custom_bio = ?,
      custom_bio_emojis = ?,
      custom_sections = ?,
      custom_role = ?,
      custom_avatar_url = ?,
      custom_banner_url = ?,
      position_order = COALESCE(?, position_order),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      custom_nickname,
      custom_bio,
      custom_bio_emojis,
      custom_sections,
      custom_role,
      custom_avatar_url,
      custom_banner_url,
      position_order,
      id,
    ]
  );
}

export async function deleteStaffMember(id: number) {
  await execute('DELETE FROM staff WHERE id = ?', [id]);
}

export async function updateStaffPositionOrder(id: number, position_order: number) {
  await execute(
    'UPDATE staff SET position_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [position_order, id]
  );
}

// ==================== PROFILE CHANGE LOGGING ====================

export async function logProfileChange(
  staffId: number,
  changedByDiscordId: string,
  changedByUsername: string,
  changeType: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null
) {
  await execute(
    `INSERT INTO profile_changes (
      staff_id, changed_by_discord_id, changed_by_username,
      change_type, field_name, old_value, new_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [staffId, changedByDiscordId, changedByUsername, changeType, fieldName, oldValue, newValue]
  );
}

export async function getAllProfileChanges(limit: number = 100) {
  return await queryAll(
    `SELECT 
      pc.*,
      s.name as staff_name,
      s.discord_tag as staff_discord_tag
    FROM profile_changes pc
    LEFT JOIN staff s ON pc.staff_id = s.id
    ORDER BY pc.changed_at DESC
    LIMIT ?`,
    [limit]
  );
}

// ==================== SYSTEM SETTINGS ====================

export function isEditingLocked(): boolean {
  // Note: This needs to be synchronous for the current code structure
  // For now, return false - we'll handle this differently
  return false;
}

export async function setEditingLocked(locked: boolean) {
  await execute(
    `INSERT OR REPLACE INTO system_settings (key, value, updated_at)
     VALUES ('editing_locked', ?, CURRENT_TIMESTAMP)`,
    [locked ? '1' : '0']
  );
}

export async function getEditingLocked(): Promise<boolean> {
  const result = await queryFirst<{ value: string }>(
    'SELECT value FROM system_settings WHERE key = ?',
    ['editing_locked']
  );
  return result?.value === '1';
}

// ==================== DECORATION FUNCTIONS ====================

export async function assignDecorationToStaff(data: {
  staffId: number;
  decorationType: string;
  decorationId: number;
  assignedByDiscordId: string;
  assignedByUsername: string;
  isOverride: boolean;
}) {
  const result = await execute(
    `INSERT INTO staff_decoration_assignments (
      staff_id, decoration_type, decoration_id,
      assigned_by_discord_id, assigned_by_username, is_override
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.staffId,
      data.decorationType,
      data.decorationId,
      data.assignedByDiscordId,
      data.assignedByUsername,
      data.isOverride ? 1 : 0,
    ]
  );
  return result;
}

export async function removeDecorationAssignment(assignmentId: number) {
  await execute(
    'DELETE FROM staff_decoration_assignments WHERE id = ?',
    [assignmentId]
  );
}

export async function getStaffDecorationAssignments(staffId: number) {
  return await queryAll(
    `SELECT sda.*, s.name as staff_name
     FROM staff_decoration_assignments sda
     LEFT JOIN staff s ON sda.staff_id = s.id
     WHERE sda.staff_id = ?
     ORDER BY sda.assigned_at DESC`,
    [staffId]
  );
}

export async function getAllDecorationAssignments() {
  return await queryAll(
    `SELECT sda.*, s.name as staff_name, s.discord_tag
     FROM staff_decoration_assignments sda
     LEFT JOIN staff s ON sda.staff_id = s.id
     ORDER BY sda.assigned_at DESC`
  );
}

// ==================== QUIZ FUNCTIONS ====================

export async function saveQuizResult(
  discordUserId: string,
  discordUsername: string,
  discordAvatar: string | null,
  guildId: string,
  archetypeKey: string,
  archetypeName: string,
  scoreBreakdown: string,
  answers: string
) {
  // Check if user already has a result
  const existing = await queryFirst<{ id: number }>(
    'SELECT id FROM quiz_results WHERE discord_user_id = ? AND guild_id = ?',
    [discordUserId, guildId]
  );

  if (existing) {
    await execute(
      `UPDATE quiz_results SET
        discord_username = ?,
        discord_avatar = ?,
        archetype_key = ?,
        archetype_name = ?,
        score_breakdown = ?,
        answers = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [discordUsername, discordAvatar, archetypeKey, archetypeName, scoreBreakdown, answers, existing.id]
    );
    return existing.id;
  } else {
    const result = await execute(
      `INSERT INTO quiz_results (
        discord_user_id, discord_username, discord_avatar, guild_id,
        archetype_key, archetype_name, score_breakdown, answers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [discordUserId, discordUsername, discordAvatar, guildId, archetypeKey, archetypeName, scoreBreakdown, answers]
    );
    return Number(result.lastInsertRowid);
  }
}

export async function getQuizResult(discordUserId: string, guildId: string) {
  return await queryFirst(
    'SELECT * FROM quiz_results WHERE discord_user_id = ? AND guild_id = ?',
    [discordUserId, guildId]
  );
}

export async function getAllQuizResults(limit: number = 100) {
  return await queryAll(
    'SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT ?',
    [limit]
  );
}

// Export all functions
export const db = {
  updateStaffFromDiscord,
  removeNonStaffMembers,
  getAllStaff,
  getStaffById,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  updateStaffPositionOrder,
  logProfileChange,
  getAllProfileChanges,
  isEditingLocked,
  setEditingLocked,
  getEditingLocked,
  assignDecorationToStaff,
  removeDecorationAssignment,
  getStaffDecorationAssignments,
  getAllDecorationAssignments,
  saveQuizResult,
  getQuizResult,
  getAllQuizResults,
};
