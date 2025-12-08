import { NextResponse } from 'next/server';
import db from '@/lib/database';

interface LeaderboardEntry {
  discord_username: string;
  discord_avatar: string;
  archetype_key: string;
  archetype_name: string;
  archetype_icon: string;
  uniqueness_score: number;
  rank: number;
  rarity_tier: string;
}

export async function GET() {
  try {
    // Get archetype counts for rarity calculation
    const archetypeCountsStmt = db.prepare(`
      SELECT archetype_key, COUNT(*) as count
      FROM (
        SELECT discord_user_id, archetype_key
        FROM quiz_results
        GROUP BY discord_user_id
        HAVING MAX(updated_at)
      )
      GROUP BY archetype_key
    `);
    
    const archetypeCounts = archetypeCountsStmt.all() as { archetype_key: string; count: number }[];
    const totalUsers = archetypeCounts.reduce((sum, row) => sum + row.count, 0);
    
    // Calculate rarity scores for each archetype
    const rarityScores: Record<string, number> = {};
    archetypeCounts.forEach(row => {
      const percentage = (row.count / totalUsers) * 100;
      rarityScores[row.archetype_key] = 100 - percentage; // Inverse for uniqueness
    });

    // Get latest results with user info
    const stmt = db.prepare(`
      SELECT 
        qr.discord_user_id,
        qr.discord_username,
        qr.discord_avatar,
        qr.archetype_key,
        qr.archetype_name,
        qr.archetype_icon,
        qr.completed_at
      FROM quiz_results qr
      INNER JOIN (
        SELECT discord_user_id, MAX(updated_at) as latest
        FROM quiz_results
        GROUP BY discord_user_id
      ) latest ON qr.discord_user_id = latest.discord_user_id 
        AND qr.updated_at = latest.latest
      ORDER BY qr.completed_at ASC
    `);

    const results = stmt.all() as any[];

    // Calculate uniqueness scores and assign tiers
    const leaderboard: LeaderboardEntry[] = results.map((result) => {
      const uniqueness_score = rarityScores[result.archetype_key] || 0;
      
      let rarity_tier = 'Common';
      if (uniqueness_score >= 90) rarity_tier = 'Legendary';
      else if (uniqueness_score >= 75) rarity_tier = 'Epic';
      else if (uniqueness_score >= 60) rarity_tier = 'Rare';
      else if (uniqueness_score >= 40) rarity_tier = 'Uncommon';
      
      return {
        discord_username: result.discord_username,
        discord_avatar: result.discord_avatar,
        archetype_key: result.archetype_key,
        archetype_name: result.archetype_name,
        archetype_icon: result.archetype_icon,
        uniqueness_score,
        rank: 0, // Will be assigned next
        rarity_tier,
      };
    });

    // Sort by uniqueness score (descending) and assign ranks
    leaderboard.sort((a, b) => b.uniqueness_score - a.uniqueness_score);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({ leaderboard: leaderboard.slice(0, 50) }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
      },
    }); // Top 50
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
