"use client";

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './RichTextEditor.module.css';
import { EmojiPicker, EmojiData } from './EmojiPicker';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string, emojis?: EmojiData[]) => void;
  placeholder?: string;
  emojis?: EmojiData[];
}

export function RichTextEditor({ value, onChange, placeholder, emojis = [] }: RichTextEditorProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [recentEmojis, setRecentEmojis] = useState<EmojiData[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);


    const insertFormatting = (before: string, after: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }, 0);
    };

    // Insert emoji at cursor position
    const insertEmoji = (emoji: EmojiData) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      let emojiText = '';
      if (emoji.id && emoji.name) {
        // Discord custom emoji markdown: <:{name}:{id}>
        emojiText = emoji.animated
          ? `<a:${emoji.name}:${emoji.id}>`
          : `<:${emoji.name}:${emoji.id}>`;
      } else {
        // Unicode emoji
        emojiText = emoji.name;
      }
      const newText = value.substring(0, start) + emojiText + value.substring(end);
      
      // Track emoji metadata
      const updatedEmojis = [...emojis];
      const emojiExists = updatedEmojis.find((e) => e.id === emoji.id && e.name === emoji.name);
      if (!emojiExists && emoji.id) {
        updatedEmojis.push(emoji);
      }
      
      onChange(newText, updatedEmojis);
      setShowEmojiPicker(false);
      setRecentEmojis((prev) => {
        const exists = prev.find((e) => e.id === emoji.id && e.name === emoji.name);
        if (exists) return prev;
        return [emoji, ...prev].slice(0, 10);
      });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emojiText.length, start + emojiText.length);
      }, 0);
    };

  const insertHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertFormatting(prefix);
  };

  const insertList = (ordered: boolean) => {
    insertFormatting(ordered ? '1. ' : '- ');
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertFormatting('[', `](${url})`);
    }
  };

  const insertCodeBlock = () => {
    insertFormatting('```\n', '\n```');
  };

  const insertQuote = () => {
    insertFormatting('> ');
  };

  const insertCallout = (type: 'info' | 'warning' | 'success') => {
    const icon = type === 'info' ? '💡' : type === 'warning' ? '⚠️' : '✅';
    insertFormatting(`> ${icon} **${type.toUpperCase()}**\n> `);
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
                <div className={styles.toolbarGroup}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    title="Insert Emoji"
                    className={styles.toolbarButton}
                  >
                    😺
                  </button>
                </div>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            title="Bold"
            className={styles.toolbarButton}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            title="Italic"
            className={styles.toolbarButton}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~')}
            title="Strikethrough"
            className={styles.toolbarButton}
          >
            <s>S</s>
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => insertHeading(1)}
            title="Heading 1"
            className={styles.toolbarButton}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertHeading(2)}
            title="Heading 2"
            className={styles.toolbarButton}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertHeading(3)}
            title="Heading 3"
            className={styles.toolbarButton}
          >
            H3
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => insertList(false)}
            title="Bullet List"
            className={styles.toolbarButton}
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => insertList(true)}
            title="Numbered List"
            className={styles.toolbarButton}
          >
            1. List
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={insertLink}
            title="Insert Link"
            className={styles.toolbarButton}
          >
            🔗 Link
          </button>
          <button
            type="button"
            onClick={insertCodeBlock}
            title="Code Block"
            className={styles.toolbarButton}
          >
            {'</>'}
          </button>
          <button
            type="button"
            onClick={insertQuote}
            title="Quote"
            className={styles.toolbarButton}
          >
            " Quote
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => insertCallout('info')}
            title="Info Callout"
            className={styles.toolbarButton}
          >
            💡
          </button>
          <button
            type="button"
            onClick={() => insertCallout('warning')}
            title="Warning Callout"
            className={styles.toolbarButton}
          >
            ⚠️
          </button>
          <button
            type="button"
            onClick={() => insertCallout('success')}
            title="Success Callout"
            className={styles.toolbarButton}
          >
            ✅
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`${styles.toolbarButton} ${showPreview ? styles.active : ''}`}
          >
            👁️ {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className={styles.editorContainer}>
        {!showPreview ? (
          <>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'Write your bio using markdown...'}
              className={styles.textarea}
            />
            {showEmojiPicker && (
              <div className={styles.emojiPickerDropdown}>
                <EmojiPicker onSelect={insertEmoji} recentEmojis={recentEmojis} />
              </div>
            )}
          </>
        ) : (
          <div className={styles.preview}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                text({ children }) {
                  // Regex for Discord emoji: <a:name:id> (animated) or <:name:id> (static)
                  const discordEmojiRegex = /<a:([a-zA-Z0-9_]+):(\d+)>|<:([a-zA-Z0-9_]+):(\d+)>/g;
                  const parts = String(children).split(discordEmojiRegex);
                  if (parts.length === 1) return children;
                  const result: React.ReactNode[] = [];
                  for (let i = 0; i < parts.length; i += 5) {
                    // Normal text
                    if (parts[i]) result.push(parts[i]);
                    // Animated emoji
                    if (parts[i + 1] && parts[i + 2]) {
                      result.push(
                        <img
                          key={`a:${parts[i + 1]}:${parts[i + 2]}`}
                          src={`https://cdn.discordapp.com/emojis/${parts[i + 2]}.gif`}
                          alt={parts[i + 1]}
                          className="discordEmojiImg"
                        />
                      );
                    }
                    // Static emoji
                    if (parts[i + 3] && parts[i + 4]) {
                      result.push(
                        <img
                          key={`:${parts[i + 3]}:${parts[i + 4]}`}
                          src={`https://cdn.discordapp.com/emojis/${parts[i + 4]}.png`}
                          alt={parts[i + 3]}
                          className="discordEmojiImg"
                        />
                      );
                    }
                  }
                  return <>{result}</>;
                },
              }}
            >
              {value || '*No content yet*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
