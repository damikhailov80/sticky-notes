import { useCallback, useEffect, useRef, useState } from 'react';
import { isNoteOverTrashZone } from '../utils/trashZone';
import { TOOLBAR_WIDTH } from '../utils/notePosition';

interface NoteData {
  id: string;
  position: { x: number; y: number };
}

export type MoveStartHandler = (
  e: React.PointerEvent,
  note: NoteData,
  element: HTMLDivElement | null
) => void;

interface UseStickyNotesDragParams {
  onMoveCommit: (noteId: string, pos: { x: number; y: number }) => void;
  onDelete: (noteId: string) => void;
  bringToFront: (noteId: string) => void;
}

interface MoveState {
  noteId: string;
  element: HTMLDivElement;
  target: HTMLElement;
  startX: number;
  startY: number;
  startPosition: { x: number; y: number };
  size: { width: number; height: number };
}

export const useStickyNotesDrag = ({
  onMoveCommit,
  onDelete,
  bringToFront,
}: UseStickyNotesDragParams) => {
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [currentDragNoteId, setCurrentDragNoteId] = useState<string | null>(
    null
  );

  const stateRef = useRef({
    move: null as MoveState | null,
    isOverTrash: false,
    frameId: null as number | null,
    liveOffset: { x: 0, y: 0 },
    pendingUpdate: null as Partial<{
      x: number;
      y: number;
    }> | null,
  });

  const cleanupState = () => {
    if (stateRef.current.frameId) {
      cancelAnimationFrame(stateRef.current.frameId);
    }
    stateRef.current.move = null;
    stateRef.current.pendingUpdate = null;
    stateRef.current.frameId = null;
    stateRef.current.liveOffset = { x: 0, y: 0 };

    if (stateRef.current.isOverTrash) {
      stateRef.current.isOverTrash = false;
      setIsOverTrash(false);
    }
    setCurrentDragNoteId(null);
  };

  // Update DOM element
  const updateElement = (
    element: HTMLDivElement,
    update: Partial<{ x: number; y: number }>,
    startPosition: { x: number; y: number }
  ) => {
    if (update.x !== undefined && update.y !== undefined) {
      const offX = update.x - startPosition.x;
      const offY = update.y - startPosition.y;
      stateRef.current.liveOffset = { x: offX, y: offY };
      element.style.transform = `translate(${offX}px, ${offY}px)`;
    }
  };

  // Cleanup element styles
  const cleanupElement = (element: HTMLDivElement) => {
    element.style.transform = '';
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const { move } = stateRef.current;
      if (!move) return;

      const deltaX = e.clientX - move.startX;
      const deltaY = e.clientY - move.startY;

      // Calculate with boundary constraints
      const x = Math.max(
        0,
        Math.min(
          window.innerWidth - move.size.width - TOOLBAR_WIDTH,
          move.startPosition.x + deltaX
        )
      );
      const y = Math.max(
        0,
        Math.min(
          window.innerHeight - move.size.height,
          move.startPosition.y + deltaY
        )
      );

      stateRef.current.pendingUpdate = { x, y };

      const visualX = move.startPosition.x + deltaX;
      const visualY = move.startPosition.y + deltaY;
      const over = isNoteOverTrashZone(
        visualX,
        visualY,
        move.size.width,
        move.size.height
      );
      if (over !== stateRef.current.isOverTrash) {
        stateRef.current.isOverTrash = over;
        setIsOverTrash(over);
      }

      // Batching via requestAnimationFrame
      if (!stateRef.current.frameId) {
        stateRef.current.frameId = requestAnimationFrame(() => {
          const { pendingUpdate, move: m } = stateRef.current;
          if (!pendingUpdate || !m) {
            stateRef.current.frameId = null;
            return;
          }

          updateElement(m.element, pendingUpdate, m.startPosition);

          stateRef.current.frameId = null;
          stateRef.current.pendingUpdate = null;
        });
      }
    },
    [setIsOverTrash]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const { move, liveOffset, isOverTrash: over } = stateRef.current;
      if (!move) return;

      if (stateRef.current.frameId) {
        cancelAnimationFrame(stateRef.current.frameId);
        stateRef.current.frameId = null;
      }

      const target = move.target;

      removeListeners(target);

      try {
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Ignore errors
      }

      const shouldDelete = e.type === 'pointerup' && over;

      if (shouldDelete) {
        onDelete(move.noteId);
      } else {
        onMoveCommit(move.noteId, {
          x: move.startPosition.x + liveOffset.x,
          y: move.startPosition.y + liveOffset.y,
        });
      }
      cleanupElement(move.element);

      cleanupState();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDelete, onMoveCommit]
  );

  const addListeners = useCallback(
    (target: HTMLElement) => {
      target.addEventListener('pointermove', handlePointerMove);
      target.addEventListener('pointerup', handlePointerUp);
      target.addEventListener('pointercancel', handlePointerUp);
      target.addEventListener('lostpointercapture', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  const removeListeners = useCallback(
    (target: HTMLElement) => {
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUp);
      target.removeEventListener('pointercancel', handlePointerUp);
      target.removeEventListener('lostpointercapture', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  const startMove: MoveStartHandler = useCallback(
    (e, note, element) => {
      if (!element) return;

      e.preventDefault();

      const target = e.currentTarget as HTMLElement;

      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {
        // Failed to set pointer capture - ignore and continue
        return;
      }

      stateRef.current.move = {
        noteId: note.id,
        element,
        target,
        startX: e.clientX,
        startY: e.clientY,
        startPosition: { ...note.position },
        size: { width: element.offsetWidth, height: element.offsetHeight },
      };
      setCurrentDragNoteId(note.id);

      bringToFront(note.id);

      addListeners(target);
    },
    [bringToFront, addListeners]
  );

  useEffect(() => {
    const state = stateRef.current;
    return () => {
      if (state.frameId) {
        cancelAnimationFrame(state.frameId);
      }
      if (state.move?.target) {
        removeListeners(state.move.target);
      }
    };
  }, [removeListeners]);

  return {
    isOverTrash,
    currentDragNoteId,
    startMove,
  };
};
