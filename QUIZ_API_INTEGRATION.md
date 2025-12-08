# Instructions for Integrating Quiz Completions API with Discord Bot

## Task Overview
You need to wire up the Cat Lounge quiz completions API to the Discord bot's APIHandlerCog. The API is already built and ready - you just need to update the bot code to use the correct configuration.

## API Endpoint Details

**URL:** `http://localhost:3000/api/quiz-completions` (local) or `https://your-production-domain.com/api/quiz-completions` (production)

**Authentication:** Bearer token
```
Authorization: Bearer ae789b7e2a8d7baf08b6465486e6398fbd5a47e10d0128c7e6d61b65b61d75c5
```

**Method:** GET

**Query Parameters:**
- `since` (required): Unix timestamp in seconds. Returns all quiz completions after this time.

**Response Format:**
```json
{
  "success": true,
  "count": 2,
  "completions": [
    {
      "discord_user_id": "1234567890123456789",
      "username": "CoolUser#1234",
      "archetype_key": "soft_cuddly",
      "archetype_name": "🧸 Soft & Cuddly Cat",
      "completed_at": "2024-11-28T12:34:56.000Z",
      "completed_at_unix": 1701234567,
      "total_score": 85,
      "message": {
        "title": "🎉 Quiz Completed!",
        "description": "Thank you for completing the Cat Lounge Personality Quiz!\n\nYou are: **🧸 Soft & Cuddly Cat**\nScore: 85/100\n\n⚡ You've been granted a **1.5x XP boost** for this weekend!",
        "footer": "Quiz completed on",
        "timestamp": 1701234567
      }
    }
  ]
}
```

## Required Changes to Bot Code

### 1. Update Configuration in `cogs/api_handler.py` (or wherever the cog is located)

Replace these lines:
```python
API_URL = "https://your-catlounge-api.com/api/quiz-completions"
API_KEY = "YOUR_API_KEY_HERE"
```

With:
```python
API_URL = "http://localhost:3000/api/quiz-completions"  # Change to production URL when deployed
API_KEY = "ae789b7e2a8d7baf08b6465486e6398fbd5a47e10d0128c7e6d61b65b61d75c5"
```

Keep these as they are:
```python
CHECK_INTERVAL = 300  # 5 minutes
GUILD_ID = 1424837495597564057
```

### 2. Update the `grant_quiz_boost` method to use the response data

The API now provides a pre-formatted `message` object. Update the embed creation:

```python
async def grant_quiz_boost(self, completion: dict):
    """Grant 1.5x XP boost for one weekend to user who completed quiz"""
    user_id = int(completion.get("discord_user_id"))
    guild = self.bot.get_guild(GUILD_ID)
    if not guild:
        return
    
    member = guild.get_member(user_id)
    if not member:
        return
    
    # Calculate next weekend end (Sunday 23:59:59)
    from datetime import datetime, timedelta
    now = datetime.now()
    days_until_sunday = (6 - now.weekday()) % 7
    if days_until_sunday == 0 and now.weekday() == 6:  # If today is Sunday
        days_until_sunday = 7
    
    next_sunday = now + timedelta(days=days_until_sunday)
    weekend_end = next_sunday.replace(hour=23, minute=59, second=59)
    end_timestamp = int(weekend_end.timestamp())
    
    # Get levels cog and add boost
    levels_cog = self.bot.get_cog('LevelCog')
    if levels_cog:
        levels_cog.quiz_completers[user_id] = end_timestamp
        
        # Use the pre-formatted message from the API
        msg = completion.get("message", {})
        
        # Notify user with the formatted message
        try:
            embed = discord.Embed(
                title=msg.get("title", "🎉 Quiz Completed!"),
                description=f"{msg.get('description', '')}\n\nBoost ends: <t:{end_timestamp}:F>",
                color=discord.Color.gold(),
                timestamp=datetime.fromtimestamp(completion.get("completed_at_unix", int(time.time())))
            )
            embed.set_footer(text=msg.get("footer", "Quiz completed on"))
            await member.send(embed=embed)
        except:
            # If DM fails, try to send in a channel
            pass
```

### 3. Update the `check_quiz_completions` loop

Make sure it's calling `grant_quiz_boost` with the full completion object:

```python
for completion in completions:
    await self.grant_quiz_boost(completion)
```

## Environment Variable Setup

If you want to make it more secure, add to the bot's `.env` file:
```env
QUIZ_API_URL=http://localhost:3000/api/quiz-completions
QUIZ_API_KEY=ae789b7e2a8d7baf08b6465486e6398fbd5a47e10d0128c7e6d61b65b61d75c5
```

Then load them in the bot:
```python
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("QUIZ_API_URL")
API_KEY = os.getenv("QUIZ_API_KEY")
```

## Testing

1. Start the Next.js dev server: `npm run dev`
2. Test the API manually:
   ```bash
   curl -X GET "http://localhost:3000/api/quiz-completions?since=0" \
     -H "Authorization: Bearer ae789b7e2a8d7baf08b6465486e6398fbd5a47e10d0128c7e6d61b65b61d75c5"
   ```
3. Start the Discord bot
4. Have someone complete the quiz on the website
5. Wait up to 5 minutes for the bot to check and grant the XP boost
6. Verify the user receives the DM with the boost notification

## Production Deployment

When deploying to production:
1. Update `API_URL` to your production domain (e.g., `https://catlounge.com/api/quiz-completions`)
2. Keep the same `API_KEY` (it's already generated)
3. Ensure the `QUIZ_API_KEY` environment variable is set in your Next.js production environment
4. Test the endpoint with the production URL before going live

## Important Notes

- The API returns completions in chronological order
- Each completion includes a `discord_user_id` (as a string, convert to int for Discord.py)
- The `message` object is pre-formatted and ready to use in Discord embeds
- The bot should store `last_check` to avoid re-processing the same completions
- Error handling is already implemented in the API (401, 400, 500 responses)

That's it! The API is fully functional and ready to use. Just update the bot configuration and test it out.
