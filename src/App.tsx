import { useCallback } from 'react';
import StickyNote from './components/StickyNote';
import Toolbar from './components/Toolbar';
import TrashZone from './components/TrashZone';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  addNote,
  deleteNote,
  updateNotePosition,
  updateNoteSize,
  bringNoteToFront,
} from './store/notesSlice';
import { AVAILABLE_COLORS, DEFAULT_NOTE_SIZE } from './utils/constants';
import { calculateNewNotePosition } from './utils/notePosition';
import { useStickyNotesDrag } from './hooks/useStickyNotesDrag';
import styles from './App.module.css';

const App = () => {
  const dispatch = useAppDispatch();
  const notes = useAppSelector(state => state.notes.notes);

  // Use hook for drag system
  const { isOverTrash, currentDragNoteId, startMove, startResize } =
    useStickyNotesDrag({
      onMoveCommit: (noteId, position) =>
        dispatch(updateNotePosition({ noteId, position })),
      onResizeCommit: (noteId, size) =>
        dispatch(updateNoteSize({ noteId, size })),
      onDelete: noteId => dispatch(deleteNote(noteId)),
      bringToFront: noteId => dispatch(bringNoteToFront(noteId)),
    });

  const handleAddNote = useCallback(
    (color: string) => {
      const position = calculateNewNotePosition(notes.length);

      dispatch(
        addNote({
          color,
          position,
          size: { ...DEFAULT_NOTE_SIZE },
        })
      );
    },
    [dispatch, notes.length]
  );

  return (
    <div className={styles.app}>
      <Toolbar onAddNote={handleAddNote} availableColors={AVAILABLE_COLORS} />
      <div className={styles.canvas}>
        {notes.map(note => (
          <StickyNote
            key={note.id}
            note={note}
            isOverTrash={currentDragNoteId === note.id && isOverTrash}
            isDragging={currentDragNoteId === note.id}
            onStartMove={startMove}
            onStartResize={startResize}
          />
        ))}
      </div>
      <TrashZone isActive={isOverTrash} />
    </div>
  );
};

export default App;
