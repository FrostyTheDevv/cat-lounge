"use client";

import { useState } from 'react';
import styles from './SectionContentEditors.module.css';
import { RichTextEditor } from './RichTextEditor';
import { EmojiPicker, EmojiData } from './EmojiPicker';
import {
  AboutMeContent,
  FunFactsContent,
  FavoritesContent,
  SkillsContent,
  QuotesContent,
  HobbiesContent,
} from '@/lib/sectionTypes';

// About Me Editor - Rich text with markdown
interface AboutMeEditorProps {
  content: AboutMeContent;
  onChange: (content: AboutMeContent) => void;
}

export function AboutMeEditor({ content, onChange }: AboutMeEditorProps) {
  return (
    <div className={styles.editorContainer}>
      <RichTextEditor
        value={content.markdown}
        onChange={(value: string) => onChange({ markdown: value })}
        placeholder="Write about yourself using markdown..."
      />
    </div>
  );
}

// Fun Facts Editor - Bullet list with icons
interface FunFactsEditorProps {
  content: FunFactsContent;
  onChange: (content: FunFactsContent) => void;
}

export function FunFactsEditor({ content, onChange }: FunFactsEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);

  const addFact = () => {
    const newFact = {
      id: `fact_${Date.now()}`,
      text: '',
      icon: '✨',
    };
    onChange({ facts: [...content.facts, newFact] });
  };

  const updateFact = (index: number, updates: Partial<typeof content.facts[0]>) => {
    const newFacts = [...content.facts];
    newFacts[index] = { ...newFacts[index], ...updates };
    onChange({ facts: newFacts });
  };

  const deleteFact = (index: number) => {
    onChange({ facts: content.facts.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.listEditor}>
        {content.facts.map((fact, index) => (
          <div key={fact.id} className={styles.listItem}>
            <div className={styles.iconPicker}>
              <button
                className={styles.iconButton}
                onClick={() => setShowEmojiPicker(showEmojiPicker === index ? null : index)}
              >
                {fact.icon || '✨'}
              </button>
              {showEmojiPicker === index && (
                <div className={styles.emojiPickerDropdown}>
                  <EmojiPicker
                    onSelect={(emoji: EmojiData) => {
                      updateFact(index, { icon: emoji.name });
                      setShowEmojiPicker(null);
                    }}
                  />
                </div>
              )}
            </div>
            <input
              type="text"
              value={fact.text}
              onChange={(e) => updateFact(index, { text: e.target.value })}
              placeholder="Enter a fun fact..."
              className={styles.input}
            />
            <button
              className={styles.deleteButton}
              onClick={() => deleteFact(index)}
              aria-label="Delete fact"
            >
              ×
            </button>
          </div>
        ))}
        <button className={styles.addButton} onClick={addFact}>
          + Add Fun Fact
        </button>
      </div>
    </div>
  );
}

// Favorites Editor - Category-based list
interface FavoritesEditorProps {
  content: FavoritesContent;
  onChange: (content: FavoritesContent) => void;
}

export function FavoritesEditor({ content, onChange }: FavoritesEditorProps) {
  const addCategory = () => {
    const newCategory = {
      id: `category_${Date.now()}`,
      category: '',
      items: [],
    };
    onChange({ categories: [...content.categories, newCategory] });
  };

  const updateCategory = (index: number, updates: Partial<typeof content.categories[0]>) => {
    const newCategories = [...content.categories];
    newCategories[index] = { ...newCategories[index], ...updates };
    onChange({ categories: newCategories });
  };

  const deleteCategory = (index: number) => {
    onChange({ categories: content.categories.filter((_, i) => i !== index) });
  };

  const addItem = (categoryIndex: number) => {
    const newCategories = [...content.categories];
    newCategories[categoryIndex].items.push('');
    onChange({ categories: newCategories });
  };

  const updateItem = (categoryIndex: number, itemIndex: number, value: string) => {
    const newCategories = [...content.categories];
    newCategories[categoryIndex].items[itemIndex] = value;
    onChange({ categories: newCategories });
  };

  const deleteItem = (categoryIndex: number, itemIndex: number) => {
    const newCategories = [...content.categories];
    newCategories[categoryIndex].items = newCategories[categoryIndex].items.filter((_, i) => i !== itemIndex);
    onChange({ categories: newCategories });
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.categoryEditor}>
        {content.categories.map((category, catIndex) => (
          <div key={category.id} className={styles.categoryBlock}>
            <div className={styles.categoryHeader}>
              <input
                type="text"
                value={category.category}
                onChange={(e) => updateCategory(catIndex, { category: e.target.value })}
                placeholder="Category (e.g., Music, Games, Food)"
                className={styles.categoryInput}
              />
              <button
                className={styles.deleteButton}
                onClick={() => deleteCategory(catIndex)}
                aria-label="Delete category"
              >
                ×
              </button>
            </div>
            <div className={styles.itemsList}>
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className={styles.listItem}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(catIndex, itemIndex, e.target.value)}
                    placeholder="Enter item..."
                    className={styles.input}
                  />
                  <button
                    className={styles.deleteButton}
                    onClick={() => deleteItem(catIndex, itemIndex)}
                    aria-label="Delete item"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className={styles.addItemButton}
                onClick={() => addItem(catIndex)}
              >
                + Add Item
              </button>
            </div>
          </div>
        ))}
        <button className={styles.addButton} onClick={addCategory}>
          + Add Category
        </button>
      </div>
    </div>
  );
}

// Skills Editor - Progress bars
interface SkillsEditorProps {
  content: SkillsContent;
  onChange: (content: SkillsContent) => void;
}

export function SkillsEditor({ content, onChange }: SkillsEditorProps) {
  const addSkill = () => {
    const newSkill = {
      id: `skill_${Date.now()}`,
      name: '',
      level: 50,
      color: '#5865f2',
    };
    onChange({ skills: [...content.skills, newSkill] });
  };

  const updateSkill = (index: number, updates: Partial<typeof content.skills[0]>) => {
    const newSkills = [...content.skills];
    newSkills[index] = { ...newSkills[index], ...updates };
    onChange({ skills: newSkills });
  };

  const deleteSkill = (index: number) => {
    onChange({ skills: content.skills.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.skillsEditor}>
        {content.skills.map((skill, index) => {
          // Create inline style element for this specific skill
          const styleId = `skill-${skill.id}`;
          return (
            <div key={skill.id} className={styles.skillBlock}>
              <style>{`
                #${styleId} .${styles.progressBar} {
                  width: ${skill.level}%;
                  background: ${skill.color || '#5865f2'};
                }
              `}</style>
              <div className={styles.skillHeader}>
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(index, { name: e.target.value })}
                  placeholder="Skill name..."
                  className={styles.input}
                />
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteSkill(index)}
                  aria-label="Delete skill"
                >
                  ×
                </button>
              </div>
              <div className={styles.skillControls}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.level}
                  onChange={(e) => updateSkill(index, { level: parseInt(e.target.value) })}
                  className={styles.slider}
                  aria-label="Skill level"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={skill.level}
                  onChange={(e) => updateSkill(index, { level: parseInt(e.target.value) || 0 })}
                  className={styles.levelInput}
                  aria-label="Skill level percentage"
                />
                <input
                  type="color"
                  value={skill.color}
                  onChange={(e) => updateSkill(index, { color: e.target.value })}
                  className={styles.colorPicker}
                  title="Progress bar color"
                />
              </div>
              <div id={styleId} className={styles.skillPreview}>
                <div className={styles.progressBar} />
              </div>
            </div>
          );
        })}
        <button className={styles.addButton} onClick={addSkill}>
          + Add Skill
        </button>
      </div>
    </div>
  );
}

// Quotes Editor - Quote with attribution
interface QuotesEditorProps {
  content: QuotesContent;
  onChange: (content: QuotesContent) => void;
}

export function QuotesEditor({ content, onChange }: QuotesEditorProps) {
  const addQuote = () => {
    const newQuote = {
      id: `quote_${Date.now()}`,
      text: '',
      author: '',
      source: '',
    };
    onChange({ quotes: [...content.quotes, newQuote] });
  };

  const updateQuote = (index: number, updates: Partial<typeof content.quotes[0]>) => {
    const newQuotes = [...content.quotes];
    newQuotes[index] = { ...newQuotes[index], ...updates };
    onChange({ quotes: newQuotes });
  };

  const deleteQuote = (index: number) => {
    onChange({ quotes: content.quotes.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.quotesEditor}>
        {content.quotes.map((quote, index) => (
          <div key={quote.id} className={styles.quoteBlock}>
            <div className={styles.quoteHeader}>
              <span className={styles.quoteIcon}>💬</span>
              <button
                className={styles.deleteButton}
                onClick={() => deleteQuote(index)}
                aria-label="Delete quote"
              >
                ×
              </button>
            </div>
            <textarea
              value={quote.text}
              onChange={(e) => updateQuote(index, { text: e.target.value })}
              placeholder="Enter quote text..."
              className={styles.textarea}
              rows={3}
            />
            <div className={styles.quoteAttribution}>
              <input
                type="text"
                value={quote.author || ''}
                onChange={(e) => updateQuote(index, { author: e.target.value })}
                placeholder="Author (optional)"
                className={styles.input}
              />
              <input
                type="text"
                value={quote.source || ''}
                onChange={(e) => updateQuote(index, { source: e.target.value })}
                placeholder="Source (optional)"
                className={styles.input}
              />
            </div>
          </div>
        ))}
        <button className={styles.addButton} onClick={addQuote}>
          + Add Quote
        </button>
      </div>
    </div>
  );
}

// Hobbies Editor - Grid with images
interface HobbiesEditorProps {
  content: HobbiesContent;
  onChange: (content: HobbiesContent) => void;
}

export function HobbiesEditor({ content, onChange }: HobbiesEditorProps) {
  const addHobby = () => {
    const newHobby = {
      id: `hobby_${Date.now()}`,
      title: '',
      description: '',
      imageUrl: '',
    };
    onChange({ hobbies: [...content.hobbies, newHobby] });
  };

  const updateHobby = (index: number, updates: Partial<typeof content.hobbies[0]>) => {
    const newHobbies = [...content.hobbies];
    newHobbies[index] = { ...newHobbies[index], ...updates };
    onChange({ hobbies: newHobbies });
  };

  const deleteHobby = (index: number) => {
    onChange({ hobbies: content.hobbies.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.hobbiesEditor}>
        {content.hobbies.map((hobby, index) => (
          <div key={hobby.id} className={styles.hobbyBlock}>
            <div className={styles.hobbyHeader}>
              <input
                type="text"
                value={hobby.title}
                onChange={(e) => updateHobby(index, { title: e.target.value })}
                placeholder="Hobby title..."
                className={styles.input}
              />
              <button
                className={styles.deleteButton}
                onClick={() => deleteHobby(index)}
                aria-label="Delete hobby"
              >
                ×
              </button>
            </div>
            <textarea
              value={hobby.description}
              onChange={(e) => updateHobby(index, { description: e.target.value })}
              placeholder="Describe this hobby..."
              className={styles.textarea}
              rows={2}
            />
            <input
              type="text"
              value={hobby.imageUrl || ''}
              onChange={(e) => updateHobby(index, { imageUrl: e.target.value })}
              placeholder="Image URL (optional)"
              className={styles.input}
            />
            {hobby.imageUrl && (
              <div className={styles.imagePreview}>
                <img src={hobby.imageUrl} alt={hobby.title} />
              </div>
            )}
          </div>
        ))}
        <button className={styles.addButton} onClick={addHobby}>
          + Add Hobby
        </button>
      </div>
    </div>
  );
}
