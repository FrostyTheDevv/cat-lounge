import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

export const db = new Database(path.join(process.cwd(), 'catlounge.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    pfp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login DATETIME,
    account_locked_until DATETIME
  );

  CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_user_id TEXT NOT NULL,
    discord_username TEXT,
    discord_avatar TEXT,
    guild_id TEXT NOT NULL,
    archetype_key TEXT NOT NULL,
    archetype_name TEXT NOT NULL,
    score_breakdown TEXT NOT NULL,
    answers TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    username TEXT,
    success BOOLEAN NOT NULL,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE,
    discord_tag TEXT NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    role TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    avatar_decoration TEXT,
    custom_nickname TEXT,
    custom_bio TEXT,
    custom_bio_emojis TEXT,
    custom_sections TEXT,
    custom_role TEXT,
    custom_avatar_url TEXT,
    custom_banner_url TEXT,
    position_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quiz_answer_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_user_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    answer_index INTEGER NOT NULL,
    archetype_weights TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(discord_user_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    discord_avatar TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    permission_level TEXT NOT NULL,
    guild_roles TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profile_change_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    changed_by_discord_id TEXT NOT NULL,
    changed_by_username TEXT NOT NULL,
    change_type TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS avatar_decorations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_hash TEXT UNIQUE NOT NULL,
    sku_id TEXT UNIQUE,
    name TEXT,
    description TEXT,
    is_animated BOOLEAN DEFAULT 0,
    is_premium BOOLEAN DEFAULT 1,
    category TEXT,
    tags TEXT,
    local_path TEXT,
    cdn_url TEXT,
    thumbnail_url TEXT,
    expires_at DATETIME,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS profile_effects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    effect_id TEXT UNIQUE NOT NULL,
    sku_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    effect_type INTEGER,
    asset_hash TEXT,
    is_animated BOOLEAN DEFAULT 1,
    is_premium BOOLEAN DEFAULT 1,
    rarity TEXT,
    tags TEXT,
    animation_data TEXT,
    local_path TEXT,
    cdn_url TEXT,
    thumbnail_url TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS banner_decorations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    banner_hash TEXT UNIQUE NOT NULL,
    name TEXT,
    description TEXT,
    is_animated BOOLEAN DEFAULT 0,
    is_premium BOOLEAN DEFAULT 1,
    category TEXT,
    tags TEXT,
    local_path TEXT,
    cdn_url TEXT,
    thumbnail_url TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS profile_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme_name TEXT UNIQUE NOT NULL,
    primary_color TEXT NOT NULL,
    accent_color TEXT,
    theme_colors TEXT,
    is_premium BOOLEAN DEFAULT 1,
    gradient_data TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS decoration_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,
    decorations_found INTEGER DEFAULT 0,
    decorations_added INTEGER DEFAULT 0,
    decorations_updated INTEGER DEFAULT 0,
    sync_started DATETIME DEFAULT CURRENT_TIMESTAMP,
    sync_completed DATETIME,
    status TEXT,
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS staff_decorations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    discord_id TEXT NOT NULL,
    avatar_decoration_hash TEXT,
    profile_effect_id TEXT,
    banner_hash TEXT,
    banner_color TEXT,
    accent_color TEXT,
    theme_colors TEXT,
    badges TEXT,
    has_nitro BOOLEAN DEFAULT 0,
    last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    UNIQUE(staff_id)
  );

  CREATE TABLE IF NOT EXISTS staff_decoration_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    decoration_type TEXT NOT NULL,
    decoration_id INTEGER NOT NULL,
    assigned_by_discord_id TEXT NOT NULL,
    assigned_by_username TEXT NOT NULL,
    is_override BOOLEAN DEFAULT 0,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id)
  );

  CREATE INDEX IF NOT EXISTS idx_answer_patterns_user ON quiz_answer_patterns(discord_user_id);
  CREATE INDEX IF NOT EXISTS idx_answer_patterns_question ON quiz_answer_patterns(question_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_results_archetype ON quiz_results(archetype_key);
  CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(discord_user_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_results_updated_at ON quiz_results(updated_at);
  CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at);
  CREATE INDEX IF NOT EXISTS idx_staff_position_order ON staff(position_order);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_discord_id ON admin_sessions(discord_id);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
  CREATE INDEX IF NOT EXISTS idx_profile_change_history_staff ON profile_change_history(staff_id);
  CREATE INDEX IF NOT EXISTS idx_profile_change_history_changed_by ON profile_change_history(changed_by_discord_id);
  CREATE INDEX IF NOT EXISTS idx_avatar_decorations_sku ON avatar_decorations(sku_id);
  CREATE INDEX IF NOT EXISTS idx_avatar_decorations_active ON avatar_decorations(is_active);
  CREATE INDEX IF NOT EXISTS idx_profile_effects_sku ON profile_effects(sku_id);
  CREATE INDEX IF NOT EXISTS idx_profile_effects_active ON profile_effects(is_active);
  CREATE INDEX IF NOT EXISTS idx_banner_decorations_active ON banner_decorations(is_active);
  CREATE INDEX IF NOT EXISTS idx_profile_themes_active ON profile_themes(is_active);
  CREATE INDEX IF NOT EXISTS idx_staff_decorations_staff ON staff_decorations(staff_id);
  CREATE INDEX IF NOT EXISTS idx_staff_decorations_discord ON staff_decorations(discord_id);
  CREATE INDEX IF NOT EXISTS idx_staff_decoration_assignments_staff ON staff_decoration_assignments(staff_id);
  CREATE INDEX IF NOT EXISTS idx_staff_decoration_assignments_type ON staff_decoration_assignments(decoration_type);
`);

// Migration: Add custom_bio_emojis column if it doesn't exist
try {
  db.exec(`ALTER TABLE staff ADD COLUMN custom_bio_emojis TEXT`);
} catch (error) {
  // Column already exists, ignore error
}

// Migration: Add custom_sections column if it doesn't exist
try {
  db.exec(`ALTER TABLE staff ADD COLUMN custom_sections TEXT`);
} catch (error) {
  // Column already exists, ignore error
}

export interface User {
  id: number;
  username: string;
  password: string;
  pfp: string | null;
  created_at: string;
}

export interface QuizResult {
  id: number;
  user_id: number;
  kitty_type: string;
  completed_at: string;
}

// User operations
export const createUser = (username: string, password: string, pfp?: string) => {
  // Use higher work factor (12) for stronger security
  const hashedPassword = bcrypt.hashSync(password, 12);
  const stmt = db.prepare('INSERT INTO users (username, password, pfp) VALUES (?, ?, ?)');
  return stmt.run(username, hashedPassword, pfp || null);
};

export const getUserByUsername = (username: string): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | undefined;
};

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(password, hashedPassword);
};

export const updateUserPfp = (userId: number, pfp: string) => {
  const stmt = db.prepare('UPDATE users SET pfp = ? WHERE id = ?');
  return stmt.run(pfp, userId);
};

// Security functions
export const recordLoginAttempt = (ipAddress: string, username: string | null, success: boolean) => {
  const stmt = db.prepare('INSERT INTO login_attempts (ip_address, username, success) VALUES (?, ?, ?)');
  return stmt.run(ipAddress, username, success ? 1 : 0);
};

export const getRecentFailedAttempts = (ipAddress: string, minutes: number = 15): number => {
  // Validate minutes is a safe integer to prevent SQL injection
  const safeMinutes = Math.max(1, Math.min(1440, Math.floor(minutes))); // 1-1440 minutes (24 hours max)
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM login_attempts 
    WHERE ip_address = ? 
    AND success = 0 
    AND attempted_at > datetime('now', '-' || ? || ' minutes')
  `);
  const result = stmt.get(ipAddress, safeMinutes) as { count: number };
  return result.count;
};

export const isAccountLocked = (username: string): boolean => {
  const stmt = db.prepare('SELECT account_locked_until FROM users WHERE username = ?');
  const result = stmt.get(username) as { account_locked_until: string | null } | undefined;
  
  if (!result || !result.account_locked_until) return false;
  
  const lockUntil = new Date(result.account_locked_until);
  const now = new Date();
  return lockUntil > now;
};

export const lockAccount = (username: string, minutes: number = 30) => {
  const lockUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  const stmt = db.prepare('UPDATE users SET account_locked_until = ?, failed_login_attempts = failed_login_attempts + 1 WHERE username = ?');
  return stmt.run(lockUntil, username);
};

export const resetFailedAttempts = (username: string) => {
  const stmt = db.prepare('UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE username = ?');
  return stmt.run(username);
};

// Quiz result operations
export interface DiscordQuizResult {
  id: number;
  discord_user_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  guild_id: string;
  archetype_key: string;
  archetype_name: string;
  score_breakdown: string;
  answers: string;
  completed_at: string;
  updated_at: string;
}

export const saveQuizResult = (
  discord_user_id: string,
  discord_username: string,
  discord_avatar: string,
  guild_id: string,
  archetype_key: string,
  archetype_name: string,
  score_breakdown: object,
  answers: object[]
) => {
  const stmt = db.prepare(`
    INSERT INTO quiz_results (
      discord_user_id, discord_username, discord_avatar, guild_id, 
      archetype_key, archetype_name, score_breakdown, answers
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    discord_user_id,
    discord_username,
    discord_avatar,
    guild_id,
    archetype_key,
    archetype_name,
    JSON.stringify(score_breakdown),
    JSON.stringify(answers)
  );
};

export const getQuizResultByDiscordId = (discord_user_id: string): DiscordQuizResult | undefined => {
  const stmt = db.prepare('SELECT * FROM quiz_results WHERE discord_user_id = ? ORDER BY completed_at DESC LIMIT 1');
  return stmt.get(discord_user_id) as DiscordQuizResult | undefined;
};

export const updateQuizResult = (
  discord_user_id: string,
  guild_id: string,
  archetype_key: string,
  archetype_name: string,
  score_breakdown: object,
  answers: object[]
) => {
  const stmt = db.prepare(`
    UPDATE quiz_results 
    SET archetype_key = ?, archetype_name = ?, score_breakdown = ?, answers = ?, updated_at = CURRENT_TIMESTAMP
    WHERE discord_user_id = ? AND guild_id = ?
  `);
  return stmt.run(
    archetype_key,
    archetype_name,
    JSON.stringify(score_breakdown),
    JSON.stringify(answers),
    discord_user_id,
    guild_id
  );
};

// Staff operations
export interface StaffMember {
  id: number;
  discord_id: string | null;
  discord_tag: string;
  name: string;
  nickname: string | null;
  role: string;
  bio: string | null;
  avatar_url: string | null;
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
  created_at: string;
  updated_at: string;
}

export const getAllStaff = (): StaffMember[] => {
  const stmt = db.prepare('SELECT * FROM staff ORDER BY position_order ASC, created_at ASC');
  return stmt.all() as StaffMember[];
};

export const getStaffById = (id: number): StaffMember | undefined => {
  const stmt = db.prepare('SELECT * FROM staff WHERE id = ?');
  return stmt.get(id) as StaffMember | undefined;
};

export const createStaffMember = (
  name: string,
  discord_tag: string,
  role: string,
  bio?: string,
  avatar_url?: string,
  discord_id?: string,
  position_order: number = 0
) => {
  const stmt = db.prepare(
    'INSERT INTO staff (name, discord_tag, role, bio, avatar_url, discord_id, position_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  return stmt.run(name, discord_tag, role, bio || null, avatar_url || null, discord_id || null, position_order);
};

export const updateStaffMember = (
  id: number,
  name: string,
  discord_tag: string,
  role: string,
  bio?: string,
  avatar_url?: string,
  discord_id?: string,
  position_order?: number
) => {
  const stmt = db.prepare(
    'UPDATE staff SET name = ?, discord_tag = ?, role = ?, bio = ?, avatar_url = ?, discord_id = ?, position_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  return stmt.run(name, discord_tag, role, bio || null, avatar_url || null, discord_id || null, position_order || 0, id);
};

export const deleteStaffMember = (id: number) => {
  const stmt = db.prepare('DELETE FROM staff WHERE id = ?');
  return stmt.run(id);
};

export const updateStaffFromDiscord = (
  discord_id: string,
  discord_tag: string,
  name: string,
  nickname: string | null,
  avatar_url: string,
  banner_url: string | null,
  avatar_decoration: string | null,
  role?: string,
  bio?: string
) => {
  // Use INSERT OR REPLACE to handle both new and existing staff
  // Preserves custom_* fields on update by not including them in the UPDATE clause
  const stmt = db.prepare(`
    INSERT INTO staff (discord_id, discord_tag, name, nickname, role, bio, avatar_url, banner_url, avatar_decoration, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(discord_id) DO UPDATE SET
      discord_tag = excluded.discord_tag,
      name = excluded.name,
      nickname = excluded.nickname,
      role = COALESCE(excluded.role, staff.role),
      bio = COALESCE(excluded.bio, staff.bio),
      avatar_url = excluded.avatar_url,
      banner_url = excluded.banner_url,
      avatar_decoration = excluded.avatar_decoration,
      updated_at = datetime('now')
  `);
  return stmt.run(discord_id, discord_tag, name, nickname, role || 'Staff Member', bio || null, avatar_url, banner_url, avatar_decoration);
};

// Quiz Statistics Functions
export interface QuizStatistics {
  totalResults: number;
  uniqueUsers: number;
  archetypeCounts: Record<string, number>;
  archetypePercentages: Record<string, number>;
  recentCompletions: number; // Last 24 hours
  retakeRate: number; // Percentage of users who retook
}

export const getAllQuizResults = (limit?: number): DiscordQuizResult[] => {
  const stmt = limit
    ? db.prepare('SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT ?')
    : db.prepare('SELECT * FROM quiz_results ORDER BY completed_at DESC');
  
  const results = limit ? stmt.all(limit) : stmt.all();
  return results as DiscordQuizResult[];
};

export const getQuizStatistics = (): QuizStatistics => {
  // Total results
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM quiz_results');
  const totalResults = (totalStmt.get() as { count: number }).count;

  // Unique users
  const uniqueStmt = db.prepare('SELECT COUNT(DISTINCT discord_user_id) as count FROM quiz_results');
  const uniqueUsers = (uniqueStmt.get() as { count: number }).count;

  // Archetype counts (only count latest result per user)
  const archetypeStmt = db.prepare(`
    SELECT archetype_key, COUNT(*) as count 
    FROM (
      SELECT discord_user_id, archetype_key, MAX(updated_at) as latest
      FROM quiz_results
      GROUP BY discord_user_id
    ) as latest_results
    GROUP BY archetype_key
  `);
  const archetypeCounts: Record<string, number> = {};
  const archetypeResults = archetypeStmt.all() as { archetype_key: string; count: number }[];
  
  archetypeResults.forEach(row => {
    archetypeCounts[row.archetype_key] = row.count;
  });

  // Calculate percentages
  const archetypePercentages: Record<string, number> = {};
  Object.entries(archetypeCounts).forEach(([key, count]) => {
    archetypePercentages[key] = uniqueUsers > 0 ? (count / uniqueUsers) * 100 : 0;
  });

  // Recent completions (last 24 hours)
  const recentStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM quiz_results 
    WHERE completed_at >= datetime('now', '-1 day')
  `);
  const recentCompletions = (recentStmt.get() as { count: number }).count;

  // Retake rate
  const retakeRate = uniqueUsers > 0 ? ((totalResults - uniqueUsers) / uniqueUsers) * 100 : 0;

  return {
    totalResults,
    uniqueUsers,
    archetypeCounts,
    archetypePercentages,
    recentCompletions,
    retakeRate,
  };
};

export const getQuizResultsByArchetype = (archetypeKey: string): DiscordQuizResult[] => {
  const stmt = db.prepare('SELECT * FROM quiz_results WHERE archetype_key = ? ORDER BY completed_at DESC');
  return stmt.all(archetypeKey) as DiscordQuizResult[];
};

export const getQuizLeaderboard = (limit: number = 10) => {
  // Get users sorted by completion time
  const stmt = db.prepare(`
    SELECT discord_user_id, discord_username, discord_avatar, archetype_key, archetype_name, completed_at
    FROM quiz_results
    WHERE id IN (
      SELECT MAX(id) FROM quiz_results GROUP BY discord_user_id
    )
    ORDER BY completed_at ASC
    LIMIT ?
  `);
  return stmt.all(limit);
};

// Quiz Answer Pattern Functions
export const saveAnswerPattern = (
  discordUserId: string,
  questionId: number,
  answerIndex: number,
  archetypeWeights: Record<string, number>
) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO quiz_answer_patterns 
    (discord_user_id, question_id, answer_index, archetype_weights, completed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  return stmt.run(discordUserId, questionId, answerIndex, JSON.stringify(archetypeWeights));
};

export interface AnswerPattern {
  id: number;
  discord_user_id: string;
  question_id: number;
  answer_index: number;
  archetype_weights: string;
  completed_at: string;
}

export const getAnswerPatternsByUser = (discordUserId: string): AnswerPattern[] => {
  const stmt = db.prepare(`
    SELECT * FROM quiz_answer_patterns 
    WHERE discord_user_id = ? 
    ORDER BY question_id ASC
  `);
  return stmt.all(discordUserId) as AnswerPattern[];
};

export const getAnswerDistribution = (questionId: number) => {
  const stmt = db.prepare(`
    SELECT answer_index, COUNT(*) as count
    FROM quiz_answer_patterns
    WHERE question_id = ?
    GROUP BY answer_index
    ORDER BY answer_index ASC
  `);
  return stmt.all(questionId);
};

export const calculateSimilarityScore = (userId1: string, userId2: string): number => {
  const user1Answers = getAnswerPatternsByUser(userId1);
  const user2Answers = getAnswerPatternsByUser(userId2);
  
  if (user1Answers.length === 0 || user2Answers.length === 0) return 0;
  
  let matchingAnswers = 0;
  const totalQuestions = Math.min(user1Answers.length, user2Answers.length);
  
  user1Answers.forEach((answer1) => {
    const answer2 = user2Answers.find((a) => a.question_id === answer1.question_id);
    if (answer2 && answer1.answer_index === answer2.answer_index) {
      matchingAnswers++;
    }
  });
  
  return totalQuestions > 0 ? (matchingAnswers / totalQuestions) * 100 : 0;
};

export const findSimilarUsers = (discordUserId: string, limit: number = 10) => {
  // Get all users who completed the quiz
  const allUsersStmt = db.prepare(`
    SELECT DISTINCT discord_user_id, discord_username, discord_avatar, archetype_key
    FROM quiz_results
    WHERE discord_user_id != ?
    AND id IN (SELECT MAX(id) FROM quiz_results GROUP BY discord_user_id)
  `);
  const allUsers = allUsersStmt.all(discordUserId) as any[];
  
  // Calculate similarity for each user
  const similarities = allUsers.map(user => ({
    ...user,
    similarity: calculateSimilarityScore(discordUserId, user.discord_user_id),
  }));
  
  // Sort by similarity and return top matches
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};

export const getUsersByArchetype = (archetypeKey: string, limit?: number) => {
  const query = `
    SELECT discord_user_id, discord_username, discord_avatar, archetype_key, archetype_name, completed_at
    FROM quiz_results
    WHERE archetype_key = ?
    AND id IN (SELECT MAX(id) FROM quiz_results GROUP BY discord_user_id)
    ORDER BY completed_at DESC
    ${limit ? 'LIMIT ?' : ''}
  `;
  
  const stmt = db.prepare(query);
  return limit ? stmt.all(archetypeKey, limit) : stmt.all(archetypeKey);
};

export const getQuestionBreakdown = (questionId: number) => {
  const distribution = getAnswerDistribution(questionId);
  const totalResponses = distribution.reduce((sum: number, d: any) => sum + d.count, 0);
  
  return distribution.map((d: any) => ({
    answerIndex: d.answer_index,
    count: d.count,
    percentage: totalResponses > 0 ? (d.count / totalResponses) * 100 : 0,
  }));
};

// Advanced Analytics Functions
export interface CompletionTrend {
  date: string;
  count: number;
}

export const getCompletionTrends = (days: number = 30): CompletionTrend[] => {
  const stmt = db.prepare(`
    SELECT DATE(completed_at) as date, COUNT(*) as count
    FROM quiz_results
    WHERE completed_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(completed_at)
    ORDER BY date ASC
  `);
  return stmt.all(days) as CompletionTrend[];
};

export interface QuestionDifficulty {
  questionId: number;
  responseCount: number;
  uniqueAnswers: number;
  mostPopularAnswer: number;
  mostPopularPercentage: number;
  splitScore: number; // How evenly split the answers are (higher = more difficult/divisive)
}

export const getQuestionDifficulty = (): QuestionDifficulty[] => {
  const stmt = db.prepare(`
    SELECT 
      question_id,
      COUNT(*) as response_count,
      COUNT(DISTINCT answer_index) as unique_answers
    FROM quiz_answer_patterns
    GROUP BY question_id
    ORDER BY question_id ASC
  `);
  
  const basicStats = stmt.all() as any[];
  
  return basicStats.map(stat => {
    const distribution = getAnswerDistribution(stat.question_id) as any[];
    const mostPopular = distribution.reduce((max, d) => d.count > max.count ? d : max, distribution[0] || { count: 0, answer_index: 0 });
    const mostPopularPercentage = stat.response_count > 0 ? (mostPopular.count / stat.response_count) * 100 : 0;
    
    // Calculate split score (standard deviation of percentages)
    const avgPercentage = 100 / (distribution.length || 1);
    const variance = distribution.reduce((sum, d) => {
      const percentage = (d.count / stat.response_count) * 100;
      return sum + Math.pow(percentage - avgPercentage, 2);
    }, 0) / (distribution.length || 1);
    const splitScore = Math.sqrt(variance);
    
    return {
      questionId: stat.question_id,
      responseCount: stat.response_count,
      uniqueAnswers: stat.unique_answers,
      mostPopularAnswer: mostPopular.answer_index,
      mostPopularPercentage,
      splitScore
    };
  });
};

export interface ArchetypeTrend {
  archetype_key: string;
  period: string;
  count: number;
}

export const getArchetypeTrends = (days: number = 30): ArchetypeTrend[] => {
  const stmt = db.prepare(`
    SELECT archetype_key, DATE(completed_at) as period, COUNT(*) as count
    FROM quiz_results
    WHERE completed_at >= datetime('now', '-' || ? || ' days')
    AND id IN (SELECT MAX(id) FROM quiz_results GROUP BY discord_user_id, DATE(completed_at))
    GROUP BY archetype_key, DATE(completed_at)
    ORDER BY period ASC, archetype_key ASC
  `);
  return stmt.all(days) as ArchetypeTrend[];
};

export interface PopularAnswer {
  questionId: number;
  answerIndex: number;
  count: number;
  percentage: number;
}

export const getMostPopularAnswers = (limit: number = 10): PopularAnswer[] => {
  const stmt = db.prepare(`
    SELECT question_id, answer_index, COUNT(*) as count
    FROM quiz_answer_patterns
    GROUP BY question_id, answer_index
    ORDER BY count DESC
    LIMIT ?
  `);
  
  const results = stmt.all(limit) as any[];
  
  // Calculate percentages
  return results.map(r => {
    const totalForQuestion = db.prepare('SELECT COUNT(*) as count FROM quiz_answer_patterns WHERE question_id = ?')
      .get(r.question_id) as { count: number };
    
    return {
      questionId: r.question_id,
      answerIndex: r.answer_index,
      count: r.count,
      percentage: totalForQuestion.count > 0 ? (r.count / totalForQuestion.count) * 100 : 0
    };
  });
};

export interface CommunityAverageScores {
  [archetypeKey: string]: {
    averageScore: number;
    averagePercentage: number;
    totalUsers: number;
  };
}

export const getCommunityAverageScores = (): CommunityAverageScores => {
  // Get all latest results (one per user)
  const stmt = db.prepare(`
    SELECT score_breakdown
    FROM quiz_results
    WHERE id IN (
      SELECT MAX(id)
      FROM quiz_results
      GROUP BY discord_user_id
    )
  `);
  
  const results = stmt.all() as { score_breakdown: string }[];
  
  // Parse all score breakdowns and calculate averages
  const scoreSums: Record<string, number> = {};
  const scoreCounts: Record<string, number> = {};
  
  results.forEach(result => {
    const breakdown = JSON.parse(result.score_breakdown);
    Object.entries(breakdown).forEach(([key, score]) => {
      if (!scoreSums[key]) {
        scoreSums[key] = 0;
        scoreCounts[key] = 0;
      }
      scoreSums[key] += score as number;
      scoreCounts[key]++;
    });
  });
  
  // Calculate averages and find max score for percentage calculation
  const averages: CommunityAverageScores = {};
  const avgScores: Record<string, number> = {};
  
  Object.keys(scoreSums).forEach(key => {
    avgScores[key] = scoreSums[key] / scoreCounts[key];
  });
  
  const maxAvgScore = Math.max(...Object.values(avgScores));
  
  Object.keys(scoreSums).forEach(key => {
    averages[key] = {
      averageScore: avgScores[key],
      averagePercentage: maxAvgScore > 0 ? (avgScores[key] / maxAvgScore) * 100 : 0,
      totalUsers: scoreCounts[key]
    };
  });
  
  return averages;
};

// Admin session operations
export interface AdminSession {
  id: number;
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  access_token: string;
  refresh_token: string;
  permission_level: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'STAFF';
  guild_roles: string; // JSON array of role IDs
  session_token: string;
  expires_at: string;
  created_at: string;
  last_activity: string;
}

export const createAdminSession = (
  discordId: string,
  discordUsername: string,
  discordAvatar: string | null,
  accessToken: string,
  refreshToken: string,
  permissionLevel: AdminSession['permission_level'],
  guildRoles: string[],
  sessionToken: string,
  expiresAt: Date
) => {
  const stmt = db.prepare(`
    INSERT INTO admin_sessions (
      discord_id, discord_username, discord_avatar, access_token, refresh_token,
      permission_level, guild_roles, session_token, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    discordId,
    discordUsername,
    discordAvatar,
    accessToken,
    refreshToken,
    permissionLevel,
    JSON.stringify(guildRoles),
    sessionToken,
    expiresAt.toISOString()
  );
};

export const getAdminSessionByToken = (sessionToken: string): AdminSession | undefined => {
  const stmt = db.prepare('SELECT * FROM admin_sessions WHERE session_token = ?');
  return stmt.get(sessionToken) as AdminSession | undefined;
};

export const getAdminSessionByDiscordId = (discordId: string): AdminSession | undefined => {
  const stmt = db.prepare('SELECT * FROM admin_sessions WHERE discord_id = ? ORDER BY created_at DESC LIMIT 1');
  return stmt.get(discordId) as AdminSession | undefined;
};

export const updateAdminSessionActivity = (sessionToken: string) => {
  const stmt = db.prepare('UPDATE admin_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_token = ?');
  return stmt.run(sessionToken);
};

export const deleteAdminSession = (sessionToken: string) => {
  const stmt = db.prepare('DELETE FROM admin_sessions WHERE session_token = ?');
  return stmt.run(sessionToken);
};

export const deleteExpiredAdminSessions = () => {
  const stmt = db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')");
  return stmt.run();
};

// Profile change history operations
export interface ProfileChangeHistory {
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

export const logProfileChange = (
  staffId: number,
  changedByDiscordId: string,
  changedByUsername: string,
  changeType: string,
  fieldName: string | null,
  oldValue: any,
  newValue: any
) => {
  const stmt = db.prepare(`
    INSERT INTO profile_change_history (
      staff_id, changed_by_discord_id, changed_by_username, change_type,
      field_name, old_value, new_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    staffId,
    changedByDiscordId,
    changedByUsername,
    changeType,
    fieldName,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null
  );
};

export const getProfileChangeHistory = (staffId: number, limit: number = 50): ProfileChangeHistory[] => {
  const stmt = db.prepare(`
    SELECT * FROM profile_change_history
    WHERE staff_id = ?
    ORDER BY changed_at DESC
    LIMIT ?
  `);
  return stmt.all(staffId, limit) as ProfileChangeHistory[];
};

export const getAllProfileChanges = (limit: number = 100): ProfileChangeHistory[] => {
  const stmt = db.prepare(`
    SELECT * FROM profile_change_history
    ORDER BY changed_at DESC
    LIMIT ?
  `);
  return stmt.all(limit) as ProfileChangeHistory[];
};

// System settings operations
export const getSystemSetting = (key: string): string | undefined => {
  const stmt = db.prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?');
  const result = stmt.get(key) as { setting_value: string } | undefined;
  return result?.setting_value;
};

export const setSystemSetting = (key: string, value: string) => {
  const stmt = db.prepare(`
    INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(key, value);
};

export const isEditingLocked = (): boolean => {
  const lockdown = getSystemSetting('editing_locked');
  return lockdown === 'true';
};

export const setEditingLocked = (locked: boolean) => {
  return setSystemSetting('editing_locked', locked ? 'true' : 'false');
};

// Decoration operations
export interface AvatarDecoration {
  id: number;
  asset_hash: string;
  sku_id: string | null;
  name: string | null;
  description: string | null;
  is_animated: boolean;
  is_premium: boolean;
  category: string | null;
  tags: string | null;
  local_path: string | null;
  cdn_url: string | null;
  thumbnail_url: string | null;
  expires_at: string | null;
  first_seen: string;
  last_seen: string;
  is_active: boolean;
}

export interface ProfileEffect {
  id: number;
  effect_id: string;
  sku_id: string | null;
  name: string;
  description: string | null;
  effect_type: number | null;
  asset_hash: string | null;
  is_animated: boolean;
  is_premium: boolean;
  rarity: string | null;
  tags: string | null;
  animation_data: string | null;
  local_path: string | null;
  cdn_url: string | null;
  thumbnail_url: string | null;
  first_seen: string;
  last_seen: string;
  is_active: boolean;
}

export interface BannerDecoration {
  id: number;
  banner_hash: string;
  name: string | null;
  description: string | null;
  is_animated: boolean;
  is_premium: boolean;
  category: string | null;
  tags: string | null;
  local_path: string | null;
  cdn_url: string | null;
  thumbnail_url: string | null;
  first_seen: string;
  last_seen: string;
  is_active: boolean;
}

export interface ProfileTheme {
  id: number;
  theme_name: string;
  primary_color: string;
  accent_color: string | null;
  theme_colors: string | null;
  is_premium: boolean;
  gradient_data: string | null;
  first_seen: string;
  last_seen: string;
  is_active: boolean;
}

export interface DecorationSyncLog {
  id: number;
  sync_type: string;
  decorations_found: number;
  decorations_added: number;
  decorations_updated: number;
  sync_started: string;
  sync_completed: string | null;
  status: string | null;
  error_message: string | null;
}

// Avatar decoration operations
export const upsertAvatarDecoration = (decoration: Omit<AvatarDecoration, 'id' | 'first_seen' | 'last_seen' | 'is_active'>) => {
  const stmt = db.prepare(`
    INSERT INTO avatar_decorations (
      asset_hash, sku_id, name, description, is_animated, is_premium,
      category, tags, local_path, cdn_url, thumbnail_url, expires_at, last_seen
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(asset_hash) DO UPDATE SET
      sku_id = excluded.sku_id,
      name = excluded.name,
      description = excluded.description,
      is_animated = excluded.is_animated,
      is_premium = excluded.is_premium,
      category = excluded.category,
      tags = excluded.tags,
      local_path = excluded.local_path,
      cdn_url = excluded.cdn_url,
      thumbnail_url = excluded.thumbnail_url,
      expires_at = excluded.expires_at,
      last_seen = CURRENT_TIMESTAMP
  `);
  return stmt.run(
    decoration.asset_hash,
    decoration.sku_id,
    decoration.name,
    decoration.description,
    decoration.is_animated ? 1 : 0,
    decoration.is_premium ? 1 : 0,
    decoration.category,
    decoration.tags,
    decoration.local_path,
    decoration.cdn_url,
    decoration.thumbnail_url,
    decoration.expires_at
  );
};

export const getAllAvatarDecorations = (activeOnly: boolean = true): AvatarDecoration[] => {
  const query = activeOnly
    ? 'SELECT * FROM avatar_decorations WHERE is_active = 1 ORDER BY first_seen DESC'
    : 'SELECT * FROM avatar_decorations ORDER BY first_seen DESC';
  const stmt = db.prepare(query);
  return stmt.all() as AvatarDecoration[];
};

export const getAvatarDecorationByHash = (assetHash: string): AvatarDecoration | undefined => {
  const stmt = db.prepare('SELECT * FROM avatar_decorations WHERE asset_hash = ?');
  return stmt.get(assetHash) as AvatarDecoration | undefined;
};

// Profile effect operations
export const upsertProfileEffect = (effect: Omit<ProfileEffect, 'id' | 'first_seen' | 'last_seen' | 'is_active'>) => {
  const stmt = db.prepare(`
    INSERT INTO profile_effects (
      effect_id, sku_id, name, description, effect_type, asset_hash,
      is_animated, is_premium, rarity, tags, animation_data,
      local_path, cdn_url, thumbnail_url, last_seen
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(effect_id) DO UPDATE SET
      sku_id = excluded.sku_id,
      name = excluded.name,
      description = excluded.description,
      effect_type = excluded.effect_type,
      asset_hash = excluded.asset_hash,
      is_animated = excluded.is_animated,
      is_premium = excluded.is_premium,
      rarity = excluded.rarity,
      tags = excluded.tags,
      animation_data = excluded.animation_data,
      local_path = excluded.local_path,
      cdn_url = excluded.cdn_url,
      thumbnail_url = excluded.thumbnail_url,
      last_seen = CURRENT_TIMESTAMP
  `);
  return stmt.run(
    effect.effect_id,
    effect.sku_id,
    effect.name,
    effect.description,
    effect.effect_type,
    effect.asset_hash,
    effect.is_animated ? 1 : 0,
    effect.is_premium ? 1 : 0,
    effect.rarity,
    effect.tags,
    effect.animation_data,
    effect.local_path,
    effect.cdn_url,
    effect.thumbnail_url
  );
};

export const getAllProfileEffects = (activeOnly: boolean = true): ProfileEffect[] => {
  const query = activeOnly
    ? 'SELECT * FROM profile_effects WHERE is_active = 1 ORDER BY first_seen DESC'
    : 'SELECT * FROM profile_effects ORDER BY first_seen DESC';
  const stmt = db.prepare(query);
  return stmt.all() as ProfileEffect[];
};

// Banner decoration operations
export const upsertBannerDecoration = (banner: Omit<BannerDecoration, 'id' | 'first_seen' | 'last_seen' | 'is_active'>) => {
  const stmt = db.prepare(`
    INSERT INTO banner_decorations (
      banner_hash, name, description, is_animated, is_premium,
      category, tags, local_path, cdn_url, thumbnail_url, last_seen
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(banner_hash) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      is_animated = excluded.is_animated,
      is_premium = excluded.is_premium,
      category = excluded.category,
      tags = excluded.tags,
      local_path = excluded.local_path,
      cdn_url = excluded.cdn_url,
      thumbnail_url = excluded.thumbnail_url,
      last_seen = CURRENT_TIMESTAMP
  `);
  return stmt.run(
    banner.banner_hash,
    banner.name,
    banner.description,
    banner.is_animated ? 1 : 0,
    banner.is_premium ? 1 : 0,
    banner.category,
    banner.tags,
    banner.local_path,
    banner.cdn_url,
    banner.thumbnail_url
  );
};

export const getAllBannerDecorations = (activeOnly: boolean = true): BannerDecoration[] => {
  const query = activeOnly
    ? 'SELECT * FROM banner_decorations WHERE is_active = 1 ORDER BY first_seen DESC'
    : 'SELECT * FROM banner_decorations ORDER BY first_seen DESC';
  const stmt = db.prepare(query);
  return stmt.all() as BannerDecoration[];
};

// Profile theme operations
export const upsertProfileTheme = (theme: Omit<ProfileTheme, 'id' | 'first_seen' | 'last_seen' | 'is_active'>) => {
  const stmt = db.prepare(`
    INSERT INTO profile_themes (
      theme_name, primary_color, accent_color, theme_colors,
      is_premium, gradient_data, last_seen
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(theme_name) DO UPDATE SET
      primary_color = excluded.primary_color,
      accent_color = excluded.accent_color,
      theme_colors = excluded.theme_colors,
      is_premium = excluded.is_premium,
      gradient_data = excluded.gradient_data,
      last_seen = CURRENT_TIMESTAMP
  `);
  return stmt.run(
    theme.theme_name,
    theme.primary_color,
    theme.accent_color,
    theme.theme_colors,
    theme.is_premium ? 1 : 0,
    theme.gradient_data
  );
};

export const getAllProfileThemes = (activeOnly: boolean = true): ProfileTheme[] => {
  const query = activeOnly
    ? 'SELECT * FROM profile_themes WHERE is_active = 1 ORDER BY first_seen DESC'
    : 'SELECT * FROM profile_themes ORDER BY first_seen DESC';
  const stmt = db.prepare(query);
  return stmt.all() as ProfileTheme[];
};

// Sync log operations
export const createSyncLog = (syncType: string) => {
  const stmt = db.prepare(`
    INSERT INTO decoration_sync_log (sync_type, status)
    VALUES (?, 'running')
  `);
  const result = stmt.run(syncType);
  return result.lastInsertRowid;
};

export const updateSyncLog = (
  id: number,
  found: number,
  added: number,
  updated: number,
  status: 'completed' | 'failed',
  errorMessage?: string
) => {
  const stmt = db.prepare(`
    UPDATE decoration_sync_log
    SET decorations_found = ?,
        decorations_added = ?,
        decorations_updated = ?,
        sync_completed = CURRENT_TIMESTAMP,
        status = ?,
        error_message = ?
    WHERE id = ?
  `);
  return stmt.run(found, added, updated, status, errorMessage || null, id);
};

export const getRecentSyncLogs = (limit: number = 10): DecorationSyncLog[] => {
  const stmt = db.prepare(`
    SELECT * FROM decoration_sync_log
    ORDER BY sync_started DESC
    LIMIT ?
  `);
  return stmt.all(limit) as DecorationSyncLog[];
};

// Staff Decorations Operations
export interface StaffDecoration {
  id: number;
  staff_id: number;
  discord_id: string;
  avatar_decoration_hash: string | null;
  profile_effect_id: string | null;
  banner_hash: string | null;
  banner_color: string | null;
  accent_color: string | null;
  theme_colors: string | null;
  badges: string | null;
  has_nitro: boolean;
  last_synced: string;
}

export const upsertStaffDecoration = (data: {
  staffId: number;
  discordId: string;
  avatarDecorationHash?: string | null;
  profileEffectId?: string | null;
  bannerHash?: string | null;
  bannerColor?: string | null;
  accentColor?: string | null;
  themeColors?: string | null;
  badges?: string | null;
  hasNitro?: boolean;
}) => {
  const stmt = db.prepare(`
    INSERT INTO staff_decorations (
      staff_id, discord_id, avatar_decoration_hash, profile_effect_id,
      banner_hash, banner_color, accent_color, theme_colors, badges, has_nitro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(staff_id) DO UPDATE SET
      avatar_decoration_hash = excluded.avatar_decoration_hash,
      profile_effect_id = excluded.profile_effect_id,
      banner_hash = excluded.banner_hash,
      banner_color = excluded.banner_color,
      accent_color = excluded.accent_color,
      theme_colors = excluded.theme_colors,
      badges = excluded.badges,
      has_nitro = excluded.has_nitro,
      last_synced = CURRENT_TIMESTAMP
  `);
  return stmt.run(
    data.staffId,
    data.discordId,
    data.avatarDecorationHash || null,
    data.profileEffectId || null,
    data.bannerHash || null,
    data.bannerColor || null,
    data.accentColor || null,
    data.themeColors || null,
    data.badges || null,
    data.hasNitro ? 1 : 0
  );
};

export const getStaffDecorationByStaffId = (staffId: number): StaffDecoration | null => {
  const stmt = db.prepare('SELECT * FROM staff_decorations WHERE staff_id = ?');
  return stmt.get(staffId) as StaffDecoration | null;
};

export const getStaffDecorationByDiscordId = (discordId: string): StaffDecoration | null => {
  const stmt = db.prepare('SELECT * FROM staff_decorations WHERE discord_id = ?');
  return stmt.get(discordId) as StaffDecoration | null;
};

export const getAllStaffDecorations = (): StaffDecoration[] => {
  const stmt = db.prepare('SELECT * FROM staff_decorations ORDER BY last_synced DESC');
  return stmt.all() as StaffDecoration[];
};

// Staff Decoration Assignments
export interface StaffDecorationAssignment {
  id: number;
  staff_id: number;
  decoration_type: 'avatar' | 'effect' | 'banner' | 'theme';
  decoration_id: number;
  assigned_by_discord_id: string;
  assigned_by_username: string;
  is_override: boolean;
  assigned_at: string;
}

export const assignDecorationToStaff = (data: {
  staffId: number;
  decorationType: 'avatar' | 'effect' | 'banner' | 'theme';
  decorationId: number;
  assignedByDiscordId: string;
  assignedByUsername: string;
  isOverride?: boolean;
}) => {
  const stmt = db.prepare(`
    INSERT INTO staff_decoration_assignments (
      staff_id, decoration_type, decoration_id,
      assigned_by_discord_id, assigned_by_username, is_override
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.staffId,
    data.decorationType,
    data.decorationId,
    data.assignedByDiscordId,
    data.assignedByUsername,
    data.isOverride ? 1 : 0
  );
};

export const removeDecorationAssignment = (assignmentId: number) => {
  const stmt = db.prepare('DELETE FROM staff_decoration_assignments WHERE id = ?');
  return stmt.run(assignmentId);
};

export const getStaffDecorationAssignments = (staffId: number): StaffDecorationAssignment[] => {
  const stmt = db.prepare(`
    SELECT * FROM staff_decoration_assignments 
    WHERE staff_id = ?
    ORDER BY assigned_at DESC
  `);
  return stmt.all(staffId) as StaffDecorationAssignment[];
};

export const getAllDecorationAssignments = (): StaffDecorationAssignment[] => {
  const stmt = db.prepare(`
    SELECT * FROM staff_decoration_assignments
    ORDER BY assigned_at DESC
  `);
  return stmt.all() as StaffDecorationAssignment[];
};

export default db;
