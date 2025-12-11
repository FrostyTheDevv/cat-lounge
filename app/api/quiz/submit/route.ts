import { NextRequest, NextResponse } from 'next/server';
import { QUIZ_QUESTIONS, CAT_ARCHETYPES } from '@/lib/quizConfig';
import { saveQuizResult, getQuizResult, saveAnswerPattern } from '@/lib/database-async';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;

// Role mapping from environment variables
const ROLE_MAPPING: Record<string, string> = {
  soft_cuddly: process.env.QUIZ_ROLE_SOFT_CUDDLY || '',
  chaos_goblin: process.env.QUIZ_ROLE_CHAOS_GOBLIN || '',
  royal_fancy: process.env.QUIZ_ROLE_ROYAL_FANCY || '',
  cool_alley: process.env.QUIZ_ROLE_COOL_ALLEY || '',
  wise_old: process.env.QUIZ_ROLE_WISE_OLD || '',
  adventurous_hunter: process.env.QUIZ_ROLE_ADVENTUROUS_HUNTER || '',
};

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('quiz_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    if (!session.inGuild) {
      return NextResponse.json(
        { error: 'Not in guild' },
        { status: 403 }
      );
    }

    const { answers } = await request.json();

    // Validate answers
    if (!Array.isArray(answers) || answers.length !== QUIZ_QUESTIONS.length) {
      return NextResponse.json(
        { error: 'Invalid answers' },
        { status: 400 }
      );
    }

    // Calculate scores
    const scores: Record<string, number> = {
      soft_cuddly: 0,
      chaos_goblin: 0,
      royal_fancy: 0,
      cool_alley: 0,
      wise_old: 0,
      adventurous_hunter: 0,
    };

    answers.forEach((answer, index) => {
      const question = QUIZ_QUESTIONS[index];
      const option = question.options[answer.optionIndex];
      
      if (option && option.weights) {
        Object.entries(option.weights).forEach(([archetype, weight]) => {
          scores[archetype] += weight;
        });
        
        // Save individual answer pattern for analytics
        const weights: Record<string, number> = {};
        Object.entries(option.weights).forEach(([key, value]) => {
          if (value !== undefined) {
            weights[key] = value;
          }
        });
        await saveAnswerPattern(
          session.discordUserId,
          answer.questionId,
          answer.optionIndex,
          weights
        );
      }
    });

    // Find winning archetype (with deterministic tie-breaking)
    let maxScore = 0;
    let winners: string[] = [];

    Object.entries(scores).forEach(([archetype, score]) => {
      if (score > maxScore) {
        maxScore = score;
        winners = [archetype];
      } else if (score === maxScore) {
        winners.push(archetype);
      }
    });

    // Deterministic tie-breaking: use first in predefined order
    const winningArchetypeKey = winners.length > 1 
      ? CAT_ARCHETYPES.find(a => winners.includes(a.key))!.key
      : winners[0];

    const winningArchetype = CAT_ARCHETYPES.find(a => a.key === winningArchetypeKey)!;

    // Save or update quiz result (saveQuizResult handles both insert and update)
    await saveQuizResult(
      session.discordUserId,
      session.username,
      session.avatar || null,
      DISCORD_GUILD_ID,
      winningArchetype.key,
      winningArchetype.name,
      JSON.stringify(scores),
      JSON.stringify(answers)
    );

    // Assign Discord role (removes old quiz roles and adds new one)
    let roleAssigned = false;
    let roleError = null;

    try {
      console.log(`Attempting to assign role for archetype: ${winningArchetype.key} to user: ${session.discordUserId}`);
      roleAssigned = await assignDiscordRole(
        session.discordUserId,
        winningArchetype.key
      );
      console.log(`Role assignment ${roleAssigned ? 'successful' : 'failed'}`);
    } catch (error) {
      console.error('Role assignment error:', error);
      roleError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      result: {
        archetype: winningArchetype,
        scores,
        roleAssigned,
        roleError,
      },
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}

async function assignDiscordRole(
  userId: string,
  archetypeKey: string
): Promise<boolean> {
  try {
    // Get current member roles
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!memberResponse.ok) {
      throw new Error(`Failed to fetch member: ${memberResponse.status}`);
    }

    const member = await memberResponse.json();
    let currentRoles = member.roles || [];

    // Remove all quiz-related roles
    const allQuizRoleIds = Object.values(ROLE_MAPPING).filter(id => id);
    const oldQuizRoles = currentRoles.filter((roleId: string) => allQuizRoleIds.includes(roleId));
    currentRoles = currentRoles.filter((roleId: string) => !allQuizRoleIds.includes(roleId));

    console.log(`Removing old quiz roles: ${oldQuizRoles.join(', ') || 'none'}`);

    // Add new archetype role
    const newRoleId = ROLE_MAPPING[archetypeKey];
    if (newRoleId) {
      if (!currentRoles.includes(newRoleId)) {
        currentRoles.push(newRoleId);
        console.log(`Adding new quiz role: ${newRoleId} (${archetypeKey})`);
      } else {
        console.log(`User already has role: ${newRoleId} (${archetypeKey})`);
      }
    } else {
      console.warn(`No role mapping found for archetype: ${archetypeKey}`);
    }

    // Update member roles via Discord REST API
    const updateResponse = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: currentRoles,
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update roles: ${updateResponse.status}`);
    }

    return true;
  } catch (error) {
    console.error('Role assignment error:', error);
    throw error;
  }
}
