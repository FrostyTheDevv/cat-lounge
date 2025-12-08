// Custom Profile Section Types and Interfaces

export type SectionType = 
  | 'about_me' 
  | 'fun_facts' 
  | 'favorites' 
  | 'skills' 
  | 'quotes' 
  | 'hobbies';

// Base section interface
export interface ProfileSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  order: number;
  content: SectionContent;
}

// Union type for all section content types
export type SectionContent = 
  | AboutMeContent
  | FunFactsContent
  | FavoritesContent
  | SkillsContent
  | QuotesContent
  | HobbiesContent;

// About Me - Rich text with markdown
export interface AboutMeContent {
  markdown: string;
}

// Fun Facts - Bullet list with optional icons
export interface FunFactsContent {
  facts: Array<{
    id: string;
    text: string;
    icon?: string; // Emoji or icon name
  }>;
}

// Favorites - Category-based list
export interface FavoritesContent {
  categories: Array<{
    id: string;
    category: string; // e.g., "Music", "Games", "Food"
    items: string[];
  }>;
}

// Skills/Specialties - Progress bars
export interface SkillsContent {
  skills: Array<{
    id: string;
    name: string;
    level: number; // 0-100 percentage
    color?: string; // Custom color for progress bar
  }>;
}

// Quotes - Quote with attribution
export interface QuotesContent {
  quotes: Array<{
    id: string;
    text: string;
    author?: string;
    source?: string;
  }>;
}

// Hobbies - Grid with images and descriptions
export interface HobbiesContent {
  hobbies: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
  }>;
}

// Section template metadata for editor
export interface SectionTemplate {
  type: SectionType;
  label: string;
  icon: string;
  description: string;
  defaultContent: SectionContent;
}

// Available section templates
export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: 'about_me',
    label: 'About Me',
    icon: '📝',
    description: 'Rich text section with markdown formatting',
    defaultContent: { markdown: '' }
  },
  {
    type: 'fun_facts',
    label: 'Fun Facts',
    icon: '✨',
    description: 'Bullet list of interesting facts with optional icons',
    defaultContent: { facts: [] }
  },
  {
    type: 'favorites',
    label: 'Favorites',
    icon: '⭐',
    description: 'Categorized list of favorite things',
    defaultContent: { categories: [] }
  },
  {
    type: 'skills',
    label: 'Skills & Specialties',
    icon: '🎯',
    description: 'Skills with progress bars showing proficiency',
    defaultContent: { skills: [] }
  },
  {
    type: 'quotes',
    label: 'Quotes',
    icon: '💬',
    description: 'Favorite quotes with attribution',
    defaultContent: { quotes: [] }
  },
  {
    type: 'hobbies',
    label: 'Hobbies',
    icon: '🎮',
    description: 'Grid of hobbies with images and descriptions',
    defaultContent: { hobbies: [] }
  }
];

// Helper function to create a new section
export function createSection(type: SectionType, order: number = 0): ProfileSection {
  const template = SECTION_TEMPLATES.find(t => t.type === type);
  if (!template) {
    throw new Error(`Unknown section type: ${type}`);
  }

  return {
    id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: template.label,
    visible: true,
    order,
    content: template.defaultContent
  };
}

// Helper function to validate section content
export function validateSection(section: ProfileSection): boolean {
  if (!section.id || !section.type || !section.title) {
    return false;
  }

  // Type-specific validation
  switch (section.type) {
    case 'about_me':
      return typeof (section.content as AboutMeContent).markdown === 'string';
    case 'fun_facts':
      return Array.isArray((section.content as FunFactsContent).facts);
    case 'favorites':
      return Array.isArray((section.content as FavoritesContent).categories);
    case 'skills':
      return Array.isArray((section.content as SkillsContent).skills);
    case 'quotes':
      return Array.isArray((section.content as QuotesContent).quotes);
    case 'hobbies':
      return Array.isArray((section.content as HobbiesContent).hobbies);
    default:
      return false;
  }
}
