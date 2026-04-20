import { useRef, memo } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateNoteText, bringNoteToFront } from '../store/notesSlice';
import { Note } from '../types';
import { DragStartHandler } from '../hooks/useStickyNotesDrag';
import './StickyNote.css';

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
      className={`sticky-note ${isOverTrash ? 'over-trash' : ''} ${isDragging ? 'dragging' : ''}`}
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
      <div className="note-header" />
      <textarea
        ref={textareaRef}
        className="note-textarea"
        value={note.text}
        onChange={handleTextChange}
        onClick={handleTextClick}
        placeholder="Type your note here..."
      />
      <div className="resize-handle" onPointerDown={handleResizePointerDown} />
    </div>
  );
};

StickyNote.displayName = 'StickyNote';

export default memo(StickyNote);
