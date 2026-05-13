import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addNote } from '../store/notesSlice';
import { AVAILABLE_COLORS, DEFAULT_NOTE_SIZE } from '../utils/constants';
import { calculateNewNotePosition } from '../utils/notePosition';
import styles from './Toolbar.module.css';

const Toolbar = () => {
  const dispatch = useAppDispatch();
  const notesCount = useAppSelector(state => state.notes.notes.length);

  const handleAddNote = useCallback(
    (color: string) => {
      const position = calculateNewNotePosition(notesCount);

      dispatch(
        addNote({
          color,
          position,
          size: { ...DEFAULT_NOTE_SIZE },
        })
      );
    },
    [dispatch, notesCount]
  );

  return (
    <div className={styles.toolbar}>
      <h2 className={styles.toolbarTitle}>Sticky Notes</h2>
      <div className={styles.toolbarSection}>
        <span className={styles.toolbarLabel}>Add Note:</span>
        <div className={styles.colorButtons}>
          {AVAILABLE_COLORS.map(color => (
            <button
              key={color}
              className={styles.colorButton}
              style={{ backgroundColor: color }}
              onClick={() => handleAddNote(color)}
              title={`Add ${color} note`}
            />
          ))}
        </div>
      </div>
      <div className={styles.toolbarInstructions}>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul>
          <li>Click a color button to create a new note</li>
          <li>Drag the header to move notes</li>
          <li>Drag the bottom-right corner to resize</li>
          <li>Drag notes to the trash zone to delete</li>
          <li>Click on a note to bring it to front</li>
        </ul>
      </div>
    </div>
  );
};

export default Toolbar;
