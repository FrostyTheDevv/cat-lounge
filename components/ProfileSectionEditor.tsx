"use client";

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import styles from './ProfileSectionEditor.module.css';
import { ProfileSection, SECTION_TEMPLATES, createSection, SectionType, SectionContent } from '@/lib/sectionTypes';
import {
  AboutMeEditor,
  FunFactsEditor,
  FavoritesEditor,
  SkillsEditor,
  QuotesEditor,
  HobbiesEditor,
} from './SectionContentEditors';

interface ProfileSectionEditorProps {
  sections: ProfileSection[];
  onChange: (sections: ProfileSection[]) => void;
}

interface SortableSectionProps {
  section: ProfileSection;
  onEdit: (section: ProfileSection) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

function SortableSection({ section, onEdit, onDelete, onToggleVisibility }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: section.id });

  const template = SECTION_TEMPLATES.find(t => t.type === section.type);

  return (
    <div 
      ref={setNodeRef} 
      className={`${styles.sectionCard} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.sectionHeader}>
        <button
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8h18M3 16h18" />
          </svg>
        </button>
        
        <div className={styles.sectionInfo}>
          <span className={styles.sectionIcon}>{template?.icon}</span>
          <div>
            <h4 className={styles.sectionTitle}>{section.title}</h4>
            <p className={styles.sectionType}>{template?.label}</p>
          </div>
        </div>

        <div className={styles.sectionActions}>
          <button
            className={styles.visibilityButton}
            onClick={() => onToggleVisibility(section.id)}
            title={section.visible ? 'Hide section' : 'Show section'}
          >
            {section.visible ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
          
          <button
            className={styles.editButton}
            onClick={() => onEdit(section)}
            aria-label="Edit section"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          
          <button
            className={styles.deleteButton}
            onClick={() => onDelete(section.id)}
            aria-label="Delete section"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileSectionEditor({ sections, onChange }: ProfileSectionEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        order: idx,
      }));
      
      onChange(newSections);
    }
  };

  const handleAddSection = (type: SectionType) => {
    const newSection = createSection(type, sections.length);
    onChange([...sections, newSection]);
    setShowAddMenu(false);
    setEditingSection(newSection);
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      const newSections = sections.filter(s => s.id !== id).map((s, idx) => ({
        ...s,
        order: idx,
      }));
      onChange(newSections);
    }
  };

  const handleToggleVisibility = (id: string) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    onChange(newSections);
  };

  const handleUpdateSection = (updatedSection: ProfileSection) => {
    const newSections = sections.map(s =>
      s.id === updatedSection.id ? updatedSection : s
    );
    onChange(newSections);
    setEditingSection(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Profile Sections</h3>
        <button
          className={styles.addButton}
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Section
        </button>
      </div>

      {showAddMenu && (
        <div className={styles.addMenu}>
          <div className={styles.addMenuHeader}>
            <h4>Choose Section Type</h4>
            <button
              className={styles.closeButton}
              onClick={() => setShowAddMenu(false)}
            >
              ×
            </button>
          </div>
          <div className={styles.templateGrid}>
            {SECTION_TEMPLATES.map(template => (
              <button
                key={template.type}
                className={styles.templateCard}
                onClick={() => handleAddSection(template.type)}
              >
                <span className={styles.templateIcon}>{template.icon}</span>
                <h5 className={styles.templateLabel}>{template.label}</h5>
                <p className={styles.templateDescription}>{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {sections.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📋</span>
          <p>No sections yet. Add your first section above!</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.sectionList}>
              {sections.map(section => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEdit={setEditingSection}
                  onDelete={handleDeleteSection}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editingSection && (
        <SectionEditModal
          section={editingSection}
          onSave={handleUpdateSection}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}

interface SectionEditModalProps {
  section: ProfileSection;
  onSave: (section: ProfileSection) => void;
  onClose: () => void;
}

function SectionEditModal({ section, onSave, onClose }: SectionEditModalProps) {
  const [editedSection, setEditedSection] = useState<ProfileSection>(section);

  const handleTitleChange = (title: string) => {
    setEditedSection({ ...editedSection, title });
  };

  const handleContentChange = (content: SectionContent) => {
    setEditedSection({ ...editedSection, content });
  };

  const handleSave = () => {
    onSave(editedSection);
  };

  const renderContentEditor = () => {
    switch (editedSection.type) {
      case 'about_me':
        return (
          <AboutMeEditor
            content={editedSection.content as any}
            onChange={handleContentChange}
          />
        );
      case 'fun_facts':
        return (
          <FunFactsEditor
            content={editedSection.content as any}
            onChange={handleContentChange}
          />
        );
      case 'favorites':
        return (
          <FavoritesEditor
            content={editedSection.content as any}
            onChange={handleContentChange}
          />
        );
      case 'skills':
        return (
          <SkillsEditor
            content={editedSection.content as any}
            onChange={handleContentChange}
          />
        );
      case 'quotes':
        return (
          <QuotesEditor
            content={editedSection.content as any}
            onChange={handleContentChange}
          />
        );
      case 'hobbies':
        return (
          <HobbiesEditor
            content={editedSection.content as any}
            onChange={handleContentChange}
          />
        );
      default:
        return <p>Unknown section type</p>;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Edit Section</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label>Section Title</label>
            <input
              type="text"
              value={editedSection.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter section title"
              className={styles.input}
            />
          </div>

          <div className={styles.contentEditor}>
            {renderContentEditor()}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
