import { useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateNoteText, bringNoteToFront } from '../store/notesSlice';
import { Note } from '../types';
import { DragStartHandler } from '../hooks/useStickyNotesDrag';
import styles from './StickyNote.module.css';

interface StickyNoteProps {
  note: Note;
  isOverTrash: boolean;
  isDragging: boolean;
  onStartMove: DragStartHandler;
  onStartResize: DragStartHandler;
}

const StickyNote = ({
  note,
  isOverTrash,
  isDragging,
  onStartMove,
  onStartResize,
}: StickyNoteProps) => {
  const dispatch = useAppDispatch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target === textareaRef.current) {
      return;
    }
    onStartMove(e, note, noteRef.current);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onStartResize(e, note, noteRef.current);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(updateNoteText({ noteId: note.id, text: e.target.value }));
  };

  const handleTextClick = () => {
    dispatch(bringNoteToFront(note.id));
  };

  return (
    <div
      ref={noteRef}
      className={`${styles.stickyNote} ${isOverTrash ? styles.overTrash : ''} ${isDragging ? styles.dragging : ''}`}
      data-note-id={note.id}
      style={{
        left: `${note.position.x}px`,
        top: `${note.position.y}px`,
        width: `${note.size.width}px`,
        height: `${note.size.height}px`,
        backgroundColor: note.color,
        zIndex: isDragging ? 1000 : note.zIndex,
      }}
      onPointerDown={handlePointerDown}
    >
      <div className={styles.noteHeader} />
      <textarea
        ref={textareaRef}
        className={styles.noteTextarea}
        value={note.text}
        onChange={handleTextChange}
        onClick={handleTextClick}
        placeholder="Type your note here..."
      />
      <div
        className={styles.resizeHandle}
        onPointerDown={handleResizePointerDown}
      />
    </div>
  );
};

export default StickyNote;
