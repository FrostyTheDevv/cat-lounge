"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './SectionRenderers.module.css';
import {
  ProfileSection,
  AboutMeContent,
  FunFactsContent,
  FavoritesContent,
  SkillsContent,
  QuotesContent,
  HobbiesContent,
} from '@/lib/sectionTypes';

interface SectionRendererProps {
  sections: ProfileSection[];
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  // Filter visible sections and sort by order
  const visibleSections = sections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <div className={styles.sectionsContainer}>
      {visibleSections.map(section => (
        <div key={section.id} className={styles.section}>
          <h3 className={styles.sectionTitle}>{section.title}</h3>
          <div className={styles.sectionContent}>
            {renderSectionContent(section)}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderSectionContent(section: ProfileSection) {
  switch (section.type) {
    case 'about_me':
      return <AboutMeRenderer content={section.content as AboutMeContent} />;
    case 'fun_facts':
      return <FunFactsRenderer content={section.content as FunFactsContent} />;
    case 'favorites':
      return <FavoritesRenderer content={section.content as FavoritesContent} />;
    case 'skills':
      return <SkillsRenderer content={section.content as SkillsContent} />;
    case 'quotes':
      return <QuotesRenderer content={section.content as QuotesContent} />;
    case 'hobbies':
      return <HobbiesRenderer content={section.content as HobbiesContent} />;
    default:
      return null;
  }
}

// About Me Renderer
function AboutMeRenderer({ content }: { content: AboutMeContent }) {
  return (
    <div className={styles.aboutMe}>
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
        }}
      >
        {content.markdown}
      </ReactMarkdown>
    </div>
  );
}

// Fun Facts Renderer
function FunFactsRenderer({ content }: { content: FunFactsContent }) {
  if (content.facts.length === 0) {
    return <p className={styles.emptyMessage}>No fun facts yet!</p>;
  }

  return (
    <ul className={styles.funFactsList}>
      {content.facts.map(fact => (
        <li key={fact.id} className={styles.funFact}>
          <span className={styles.factIcon}>{fact.icon || '✨'}</span>
          <span className={styles.factText}>{fact.text}</span>
        </li>
      ))}
    </ul>
  );
}

// Favorites Renderer
function FavoritesRenderer({ content }: { content: FavoritesContent }) {
  if (content.categories.length === 0) {
    return <p className={styles.emptyMessage}>No favorites yet!</p>;
  }

  return (
    <div className={styles.favoritesGrid}>
      {content.categories.map(category => (
        <div key={category.id} className={styles.favoriteCategory}>
          <h4 className={styles.categoryTitle}>{category.category}</h4>
          <ul className={styles.categoryItems}>
            {category.items.map((item, idx) => (
              <li key={idx} className={styles.categoryItem}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Skills Renderer
function SkillsRenderer({ content }: { content: SkillsContent }) {
  if (content.skills.length === 0) {
    return <p className={styles.emptyMessage}>No skills yet!</p>;
  }

  return (
    <div className={styles.skillsList}>
      {content.skills.map(skill => {
        const styleId = `skill-render-${skill.id}`;
        return (
          <div key={skill.id} className={styles.skillItem}>
            <style>{`
              #${styleId} .${styles.skillBar} {
                width: ${skill.level}%;
                background: ${skill.color || '#5865f2'};
              }
            `}</style>
            <div className={styles.skillHeader}>
              <span className={styles.skillName}>{skill.name}</span>
              <span className={styles.skillLevel}>{skill.level}%</span>
            </div>
            <div id={styleId} className={styles.skillProgress}>
              <div className={styles.skillBar} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Quotes Renderer
function QuotesRenderer({ content }: { content: QuotesContent }) {
  if (content.quotes.length === 0) {
    return <p className={styles.emptyMessage}>No quotes yet!</p>;
  }

  return (
    <div className={styles.quotesList}>
      {content.quotes.map(quote => (
        <blockquote key={quote.id} className={styles.quote}>
          <p className={styles.quoteText}>"{quote.text}"</p>
          {(quote.author || quote.source) && (
            <footer className={styles.quoteAttribution}>
              {quote.author && <span className={styles.quoteAuthor}>— {quote.author}</span>}
              {quote.source && <span className={styles.quoteSource}> ({quote.source})</span>}
            </footer>
          )}
        </blockquote>
      ))}
    </div>
  );
}

// Hobbies Renderer
function HobbiesRenderer({ content }: { content: HobbiesContent }) {
  if (content.hobbies.length === 0) {
    return <p className={styles.emptyMessage}>No hobbies yet!</p>;
  }

  return (
    <div className={styles.hobbiesGrid}>
      {content.hobbies.map(hobby => (
        <div key={hobby.id} className={styles.hobbyCard}>
          {hobby.imageUrl && (
            <div className={styles.hobbyImage}>
              <img src={hobby.imageUrl} alt={hobby.title} />
            </div>
          )}
          <div className={styles.hobbyContent}>
            <h4 className={styles.hobbyTitle}>{hobby.title}</h4>
            {hobby.description && (
              <p className={styles.hobbyDescription}>{hobby.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
