import { NextRequest, NextResponse } from 'next/server';
import { getQuizResultByDiscordId } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const compareUserId = searchParams.get('compareUserId');

    if (!userId || !compareUserId) {
      return NextResponse.json(
        { error: 'Both userId and compareUserId are required' },
        { status: 400 }
      );
    }

    // Fetch both users' results
    const [userResult, compareResult] = await Promise.all([
      getQuizResultByDiscordId(userId),
      getQuizResultByDiscordId(compareUserId)
    ]);

    if (!userResult || !compareResult) {
      return NextResponse.json(
        { error: 'One or both users have not completed the quiz' },
        { status: 404 }
      );
    }

    // Parse score breakdowns
    const userBreakdown = JSON.parse(userResult.score_breakdown);
    const compareBreakdown = JSON.parse(compareResult.score_breakdown);

    // Calculate compatibility based on shared traits and archetype similarity
    const compatibility = calculateCompatibility(userBreakdown, compareBreakdown);

    // Find common traits (top 3 from each)
    const userTopTraits = userBreakdown.traits
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((t: any) => t.name);
    
    const compareTopTraits = compareBreakdown.traits
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((t: any) => t.name);

    const commonTraits = userTopTraits.filter((trait: string) => 
      compareTopTraits.includes(trait)
    );

    // Find complementary traits (different but compatible)
    const complementaryTraits = findComplementaryTraits(userBreakdown, compareBreakdown);

    return NextResponse.json({
      user: {
        discord_user_id: userResult.discord_user_id,
        discord_username: userResult.discord_username,
        discord_avatar: userResult.discord_avatar,
        archetype: {
          key: userResult.archetype_key,
          name: userResult.archetype_name,
          emoji: userBreakdown.archetype?.emoji || '🐱',
          icon: userBreakdown.archetype?.icon || '/cat-icons/default.png'
        },
        score_percentage: userBreakdown.percentage || 0,
        score_breakdown: userBreakdown,
        topTraits: userTopTraits
      },
      compareUser: {
        discord_user_id: compareResult.discord_user_id,
        discord_username: compareResult.discord_username,
        discord_avatar: compareResult.discord_avatar,
        archetype: {
          key: compareResult.archetype_key,
          name: compareResult.archetype_name,
          emoji: compareBreakdown.archetype?.emoji || '🐱',
          icon: compareBreakdown.archetype?.icon || '/cat-icons/default.png'
        },
        score_percentage: compareBreakdown.percentage || 0,
        score_breakdown: compareBreakdown,
        topTraits: compareTopTraits
      },
      compatibility: {
        score: compatibility,
        commonTraits,
        complementaryTraits,
        message: getCompatibilityMessage(compatibility)
      }
    });

  } catch (error) {
    console.error('Error comparing results:', error);
    return NextResponse.json(
      { error: 'Failed to compare results' },
      { status: 500 }
    );
  }
}

function calculateCompatibility(breakdown1: any, breakdown2: any): number {
  // Calculate based on trait similarity
  const traits1 = breakdown1.traits;
  const traits2 = breakdown2.traits;

  let totalSimilarity = 0;
  let traitCount = 0;

  for (const trait1 of traits1) {
    const trait2 = traits2.find((t: any) => t.name === trait1.name);
    if (trait2) {
      // Calculate similarity (0-100) based on score difference
      const scoreDiff = Math.abs(trait1.score - trait2.score);
      const similarity = 100 - scoreDiff;
      totalSimilarity += similarity;
      traitCount++;
    }
  }

  // Average similarity across all matching traits
  const avgSimilarity = traitCount > 0 ? totalSimilarity / traitCount : 50;

  // Normalize to 0-100 range and ensure it's reasonable
  return Math.round(Math.max(0, Math.min(100, avgSimilarity)));
}

function findComplementaryTraits(breakdown1: any, breakdown2: any): string[] {
  const complementary: string[] = [];
  const traits1 = breakdown1.traits;
  const traits2 = breakdown2.traits;

  // Define complementary pairs (opposite but compatible traits)
  const complementaryPairs: { [key: string]: string[] } = {
    'Playful': ['Calm', 'Relaxed'],
    'Independent': ['Social', 'Affectionate'],
    'Energetic': ['Calm', 'Relaxed'],
    'Curious': ['Content', 'Observant'],
    'Affectionate': ['Independent', 'Mysterious'],
    'Vocal': ['Quiet', 'Reserved'],
    'Adventurous': ['Cautious', 'Homebody'],
    'Social': ['Independent', 'Reserved']
  };

  // Find traits where one person is high and the other has its complement
  for (const trait1 of traits1) {
    if (trait1.score >= 60) { // High score threshold
      const complements = complementaryPairs[trait1.name] || [];
      for (const complement of complements) {
        const trait2 = traits2.find((t: any) => t.name === complement);
        if (trait2 && trait2.score >= 60) {
          complementary.push(`${trait1.name} ↔ ${complement}`);
        }
      }
    }
  }

  return complementary.slice(0, 3); // Return top 3 complementary pairs
}

function getCompatibilityMessage(score: number): string {
  if (score >= 90) {
    return "Purr-fect match! You're practically the same cat! 🐱💕";
  } else if (score >= 75) {
    return "Great match! You'd definitely share the same sunbeam. ☀️";
  } else if (score >= 60) {
    return "Good compatibility! You'd get along well at the cat cafe. 😸";
  } else if (score >= 45) {
    return "Opposites attract! Your differences make you interesting. 🌟";
  } else if (score >= 30) {
    return "Very different cats! But variety is the spice of life. 🎭";
  } else {
    return "Complete opposites! Like a house cat and a lion. 🦁🐱";
  }
}
