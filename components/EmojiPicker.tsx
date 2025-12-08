import React, { useState, useEffect } from 'react';
import styles from './EmojiPicker.module.css';

export type EmojiData = {
  id: string | null;
  name: string;
  animated?: boolean;
  image_url: string;
  category?: string;
};

export type EmojiPickerProps = {
  onSelect: (emoji: EmojiData) => void;
  recentEmojis?: EmojiData[];
};

const CATEGORIES = [
  { key: 'smileys', label: 'Smileys' },
  { key: 'animals', label: 'Animals' },
  { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' },
  { key: 'objects', label: 'Objects' },
  { key: 'symbols', label: 'Symbols' },
  { key: 'flags', label: 'Flags' },
  { key: 'custom', label: 'Custom' },
];

// Placeholder: Replace with real emoji data fetch
const fetchEmojis = async (category: string, search: string): Promise<EmojiData[]> => {
  // TODO: Integrate Discord API and emoji.gg API
  // For now, return a static example
  return [
    {
      id: '1234567890',
      name: 'smile',
      animated: false,
      image_url: 'https://cdn.discordapp.com/emojis/1234567890.webp',
      category: 'smileys',
    },
    {
      id: '9876543210',
      name: 'party_parrot',
      animated: true,
      image_url: 'https://cdn.discordapp.com/emojis/9876543210.gif',
      category: 'custom',
    },
    {
      id: null,
      name: '🔥',
      animated: false,
      image_url: '',
      category: 'symbols',
    },
  ];
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, recentEmojis = [] }) => {
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [search, setSearch] = useState('');
  const [emojis, setEmojis] = useState<EmojiData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchEmojis(category, search).then((data) => {
      setEmojis(data);
      setLoading(false);
    });
  }, [category, search]);

  return (
    <div className={styles.pickerContainer}>
      <div className={styles.toolbar}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={category === cat.key ? styles.active : ''}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <input
        className={styles.search}
        type="text"
        placeholder="Search emojis..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {recentEmojis.length > 0 && (
        <div className={styles.recentSection}>
          <div className={styles.sectionTitle}>Recent</div>
          <div className={styles.emojiGrid}>
            {recentEmojis.map((emoji) => (
              <button
                key={emoji.id || emoji.name}
                className={styles.emojiButton}
                onClick={() => onSelect(emoji)}
              >
                {emoji.image_url ? (
                  <img
                    src={emoji.image_url}
                    alt={emoji.name}
                    className={styles.emojiImg}
                  />
                ) : (
                  emoji.name
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={styles.emojiGrid}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          emojis.map((emoji) => (
            <button
              key={emoji.id || emoji.name}
              className={styles.emojiButton}
              onClick={() => onSelect(emoji)}
            >
              {emoji.image_url ? (
                <img
                  src={emoji.image_url}
                  alt={emoji.name}
                  className={styles.emojiImg}
                />
              ) : (
                emoji.name
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
