// Cat Personality Archetypes
export const CAT_ARCHETYPES = [
  {
    key: 'soft_cuddly',
    name: 'Sleep Cat',
    description: 'You are the embodiment of warmth and comfort. Like a purring ball of fluff, you bring peace and happiness to everyone around you. Your gentle nature and love for cozy spaces make you the perfect cuddle buddy.',
    traits: ['Affectionate', 'Gentle', 'Relaxed', 'Comfort-loving', 'Loyal'],
    emoji: '😴',
    icon: '/cat-icons/sleep-cat.png',
  },
  {
    key: 'chaos_goblin',
    name: 'Playful Cat',
    description: 'You are pure, unbridled energy wrapped in fur! Life is your playground, and you approach every moment with wild enthusiasm. You knock things over, you zoom at 3 AM, and you absolutely LOVE causing harmless mischief.',
    traits: ['Energetic', 'Playful', 'Mischievous', 'Spontaneous', 'Entertaining'],
    emoji: '🎮',
    icon: '/cat-icons/playful-cat.png',
  },
  {
    key: 'royal_fancy',
    name: 'Chill Cat',
    description: 'You carry yourself with the dignity and grace of feline royalty. You have refined tastes, impeccable grooming habits, and expect to be treated with the respect you deserve. Elegance is your middle name.',
    traits: ['Sophisticated', 'Selective', 'Graceful', 'Independent', 'Discerning'],
    emoji: '😌',
    icon: '/cat-icons/chill-cat.png',
  },
  {
    key: 'cool_alley',
    name: 'Cool Cat',
    description: 'You are street-smart, confident, and effortlessly cool. You have a rebellious streak and prefer to do things your own way. Independent and resourceful, you thrive on adventure and freedom.',
    traits: ['Independent', 'Confident', 'Adventurous', 'Resourceful', 'Free-spirited'],
    emoji: '😎',
    icon: '/cat-icons/cool-cat.png',
  },
  {
    key: 'wise_old',
    name: 'Nerd Cat',
    description: 'You possess an ancient wisdom beyond your years. Calm, observant, and thoughtful, you see the world through a lens of understanding and patience. You prefer quiet contemplation and meaningful connections.',
    traits: ['Wise', 'Patient', 'Observant', 'Calm', 'Thoughtful'],
    emoji: '🤓',
    icon: '/cat-icons/nerd-cat.png',
  },
  {
    key: 'adventurous_hunter',
    name: 'Aggressive Cat',
    description: 'You are driven by curiosity and the thrill of the hunt. Alert, quick, and always ready for action, you love exploring new territories and testing your skills. Nothing escapes your keen senses.',
    traits: ['Curious', 'Alert', 'Active', 'Brave', 'Skilled'],
    emoji: '😾',
    icon: '/cat-icons/aggressive-cat.png',
  },
];

// Quiz Questions with Weighted Scoring
// Weights are hidden from frontend - only sent to backend
export const QUIZ_QUESTIONS = [
  {
    id: 1,
    text: 'It\'s a lazy Sunday afternoon. What are you most likely doing?',
    options: [
      { 
        label: 'Napping in the sunniest spot I can find', 
        weights: { soft_cuddly: 3, wise_old: 2 } 
      },
      { 
        label: 'Running around and causing chaos', 
        weights: { chaos_goblin: 3, adventurous_hunter: 1 } 
      },
      { 
        label: 'Grooming myself to perfection', 
        weights: { royal_fancy: 3 } 
      },
      { 
        label: 'Exploring somewhere new', 
        weights: { cool_alley: 2, adventurous_hunter: 3 } 
      },
    ],
  },
  {
    id: 2,
    text: 'Someone tries to pet you. How do you react?',
    options: [
      { 
        label: 'Purr loudly and lean into their hand', 
        weights: { soft_cuddly: 3, royal_fancy: 1 } 
      },
      { 
        label: 'Allow it... if they\'ve earned it', 
        weights: { royal_fancy: 3, wise_old: 2 } 
      },
      { 
        label: 'Tolerate it briefly, then dart away to play', 
        weights: { chaos_goblin: 2, cool_alley: 2 } 
      },
      { 
        label: 'I pet THEM. I\'m in control here', 
        weights: { cool_alley: 3, royal_fancy: 1 } 
      },
    ],
  },
  {
    id: 3,
    text: 'There\'s a mysterious noise in another room. What do you do?',
    options: [
      { 
        label: 'Stay where I am. It\'s probably nothing', 
        weights: { soft_cuddly: 2, royal_fancy: 2 } 
      },
      { 
        label: 'Observe carefully from a safe distance', 
        weights: { wise_old: 3, royal_fancy: 1 } 
      },
      { 
        label: 'Investigate immediately! Adventure awaits!', 
        weights: { adventurous_hunter: 3, chaos_goblin: 2 } 
      },
      { 
        label: 'Check it out casually - I\'ve seen it all before', 
        weights: { cool_alley: 3, wise_old: 1 } 
      },
    ],
  },
  {
    id: 4,
    text: 'Your favorite toy is...?',
    options: [
      { 
        label: 'A soft, plush toy I can snuggle', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Anything I can chase and pounce on', 
        weights: { adventurous_hunter: 3, chaos_goblin: 2 } 
      },
      { 
        label: 'An elegant feather wand (played with grace)', 
        weights: { royal_fancy: 3 } 
      },
      { 
        label: 'Who needs toys? The world is my playground', 
        weights: { cool_alley: 3, chaos_goblin: 1 } 
      },
    ],
  },
  {
    id: 5,
    text: 'How do you feel about water?',
    options: [
      { 
        label: 'Absolutely not. Never. No thank you', 
        weights: { royal_fancy: 3, soft_cuddly: 2 } 
      },
      { 
        label: 'I\'ll drink it, but that\'s where I draw the line', 
        weights: { wise_old: 2, cool_alley: 2 } 
      },
      { 
        label: 'I like to play with running water', 
        weights: { chaos_goblin: 3, adventurous_hunter: 2 } 
      },
      { 
        label: 'It\'s fine. I\'m not afraid of anything', 
        weights: { cool_alley: 3, adventurous_hunter: 1 } 
      },
    ],
  },
  {
    id: 6,
    text: 'It\'s 3 AM. What are you up to?',
    options: [
      { 
        label: 'Sleeping peacefully', 
        weights: { soft_cuddly: 3, royal_fancy: 2 } 
      },
      { 
        label: 'ZOOMIES! Racing around like a maniac!', 
        weights: { chaos_goblin: 3 } 
      },
      { 
        label: 'Sitting quietly, contemplating existence', 
        weights: { wise_old: 3 } 
      },
      { 
        label: 'Prowling and hunting imaginary prey', 
        weights: { adventurous_hunter: 3, cool_alley: 2 } 
      },
    ],
  },
  {
    id: 7,
    text: 'Someone brings home a new piece of furniture. Your reaction?',
    options: [
      { 
        label: 'Test it for nap-worthiness immediately', 
        weights: { soft_cuddly: 3, wise_old: 1 } 
      },
      { 
        label: 'It\'s mine now. I will claim it', 
        weights: { royal_fancy: 3, cool_alley: 2 } 
      },
      { 
        label: 'Knock everything off it to test structural integrity', 
        weights: { chaos_goblin: 3 } 
      },
      { 
        label: 'Explore every inch and hidden corner', 
        weights: { adventurous_hunter: 3, cool_alley: 1 } 
      },
    ],
  },
  {
    id: 8,
    text: 'Your human is sad. What do you do?',
    options: [
      { 
        label: 'Cuddle them and purr until they feel better', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Sit nearby and offer silent support', 
        weights: { wise_old: 3, royal_fancy: 1 } 
      },
      { 
        label: 'Do something silly to make them laugh', 
        weights: { chaos_goblin: 3 } 
      },
      { 
        label: 'Give them space, but check in occasionally', 
        weights: { cool_alley: 3, wise_old: 1 } 
      },
    ],
  },
  {
    id: 9,
    text: 'Food time! How do you react?',
    options: [
      { 
        label: 'Meow sweetly and rub against legs', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Demand it loudly. I am STARVING', 
        weights: { royal_fancy: 2, chaos_goblin: 2 } 
      },
      { 
        label: 'Wait patiently. It will come when it comes', 
        weights: { wise_old: 3, cool_alley: 1 } 
      },
      { 
        label: 'Try to steal it before it even reaches my bowl', 
        weights: { chaos_goblin: 2, adventurous_hunter: 3 } 
      },
    ],
  },
  {
    id: 10,
    text: 'There\'s a bug on the wall. What happens next?',
    options: [
      { 
        label: 'I observe it with mild interest, then ignore it', 
        weights: { soft_cuddly: 2, royal_fancy: 2 } 
      },
      { 
        label: 'Watch it carefully, calculating my strategy', 
        weights: { wise_old: 2, adventurous_hunter: 2 } 
      },
      { 
        label: 'ATTACK! Must catch! Must hunt!', 
        weights: { adventurous_hunter: 3, chaos_goblin: 2 } 
      },
      { 
        label: 'Play with it for entertainment', 
        weights: { chaos_goblin: 3, cool_alley: 1 } 
      },
    ],
  },
  {
    id: 11,
    text: 'Someone wants to take a photo of you. How do you respond?',
    options: [
      { 
        label: 'Stay perfectly still and look adorable', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Strike a majestic pose', 
        weights: { royal_fancy: 3 } 
      },
      { 
        label: 'Move at the exact moment they click', 
        weights: { chaos_goblin: 3, cool_alley: 2 } 
      },
      { 
        label: 'Stare intensely into their soul', 
        weights: { wise_old: 3, adventurous_hunter: 1 } 
      },
    ],
  },
  {
    id: 12,
    text: 'Your ideal spot to hang out is...?',
    options: [
      { 
        label: 'A cozy bed or soft blanket', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'The highest point in the room', 
        weights: { royal_fancy: 2, adventurous_hunter: 2 } 
      },
      { 
        label: 'Anywhere I can cause trouble', 
        weights: { chaos_goblin: 3 } 
      },
      { 
        label: 'A hidden corner where I can watch everything', 
        weights: { cool_alley: 3, wise_old: 2 } 
      },
    ],
  },
  {
    id: 13,
    text: 'A stranger visits your home. Your move?',
    options: [
      { 
        label: 'Greet them warmly and make a new friend', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Hide until I know they\'re trustworthy', 
        weights: { wise_old: 2, royal_fancy: 2 } 
      },
      { 
        label: 'Show off and demand their attention', 
        weights: { royal_fancy: 2, chaos_goblin: 2 } 
      },
      { 
        label: 'Investigate them from a safe distance', 
        weights: { cool_alley: 3, adventurous_hunter: 2 } 
      },
    ],
  },
  {
    id: 14,
    text: 'You find a cardboard box. What happens?',
    options: [
      { 
        label: 'Get in immediately. If I fits, I sits', 
        weights: { soft_cuddly: 2, royal_fancy: 2, wise_old: 2 } 
      },
      { 
        label: 'Claim it as my throne', 
        weights: { royal_fancy: 3 } 
      },
      { 
        label: 'Destroy it with my claws and teeth', 
        weights: { chaos_goblin: 3, adventurous_hunter: 2 } 
      },
      { 
        label: 'Use it as a fort or hiding spot', 
        weights: { cool_alley: 3, adventurous_hunter: 1 } 
      },
    ],
  },
  {
    id: 15,
    text: 'How do you show affection?',
    options: [
      { 
        label: 'Constant cuddles and head bumps', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Bringing "gifts" (toys, socks, bugs)', 
        weights: { adventurous_hunter: 3, chaos_goblin: 1 } 
      },
      { 
        label: 'Allowing you to be in my presence', 
        weights: { royal_fancy: 3, cool_alley: 2 } 
      },
      { 
        label: 'Slow blinks and quiet companionship', 
        weights: { wise_old: 3, cool_alley: 1 } 
      },
    ],
  },
  {
    id: 16,
    text: 'A door is closed. What do you do?',
    options: [
      { 
        label: 'Meow sadly until someone opens it', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Demand it be opened immediately', 
        weights: { royal_fancy: 3, chaos_goblin: 1 } 
      },
      { 
        label: 'Try to open it myself', 
        weights: { adventurous_hunter: 3, cool_alley: 2 } 
      },
      { 
        label: 'Find another way or wait patiently', 
        weights: { wise_old: 3, cool_alley: 1 } 
      },
    ],
  },
  {
    id: 17,
    text: 'Your favorite time of day is...?',
    options: [
      { 
        label: 'Whenever there are warm cuddles available', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Dawn and dusk - prime hunting hours', 
        weights: { adventurous_hunter: 3, cool_alley: 1 } 
      },
      { 
        label: 'Late night - time for chaos', 
        weights: { chaos_goblin: 3 } 
      },
      { 
        label: 'Any time that suits my schedule', 
        weights: { royal_fancy: 3, wise_old: 1 } 
      },
    ],
  },
  {
    id: 18,
    text: 'Someone gives you a new toy. Your reaction?',
    options: [
      { 
        label: 'Snuggle it and carry it everywhere', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Test its entertainment value thoroughly', 
        weights: { chaos_goblin: 2, adventurous_hunter: 2 } 
      },
      { 
        label: 'Inspect it carefully before accepting', 
        weights: { royal_fancy: 3, wise_old: 2 } 
      },
      { 
        label: 'Play with the box it came in instead', 
        weights: { cool_alley: 3, chaos_goblin: 1 } 
      },
    ],
  },
  {
    id: 19,
    text: 'What\'s your grooming style?',
    options: [
      { 
        label: 'Regular and thorough - I like being clean and soft', 
        weights: { soft_cuddly: 3, royal_fancy: 2 } 
      },
      { 
        label: 'Meticulous and perfectionist', 
        weights: { royal_fancy: 3 } 
      },
      { 
        label: 'Quick and efficient - places to be!', 
        weights: { chaos_goblin: 2, cool_alley: 2 } 
      },
      { 
        label: 'As needed, but I prefer to look naturally rugged', 
        weights: { cool_alley: 3, adventurous_hunter: 2 } 
      },
    ],
  },
  {
    id: 20,
    text: 'If you could have one superpower, what would it be?',
    options: [
      { 
        label: 'The ability to make everyone feel comforted', 
        weights: { soft_cuddly: 3 } 
      },
      { 
        label: 'Super speed for maximum zoomies', 
        weights: { chaos_goblin: 3, adventurous_hunter: 2 } 
      },
      { 
        label: 'Mind control (I deserve to be obeyed)', 
        weights: { royal_fancy: 3 } 
      },
      { 
        label: 'Invisibility for the perfect stealth', 
        weights: { cool_alley: 2, adventurous_hunter: 2, wise_old: 1 } 
      },
    ],
  },
];

// Role mapping configuration - reads from environment variables
export const QUIZ_ROLE_MAPPING: Record<string, string> = {
  soft_cuddly: process.env.QUIZ_ROLE_SOFT_CUDDLY || '',
  chaos_goblin: process.env.QUIZ_ROLE_CHAOS_GOBLIN || '',
  royal_fancy: process.env.QUIZ_ROLE_ROYAL_FANCY || '',
  cool_alley: process.env.QUIZ_ROLE_COOL_ALLEY || '',
  wise_old: process.env.QUIZ_ROLE_WISE_OLD || '',
  adventurous_hunter: process.env.QUIZ_ROLE_ADVENTUROUS_HUNTER || '',
};
