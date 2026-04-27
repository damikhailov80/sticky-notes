import { useCallback, useEffect, useRef, useState } from 'react';
import { isNoteOverTrashZone } from '../utils/trashZone';
import { TOOLBAR_WIDTH } from '../utils/notePosition';
import { MIN_NOTE_SIZE } from '../utils/constants';
import { DragState } from '../types';

interface NoteData {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type DragStartHandler = (
  e: React.PointerEvent,
  note: NoteData,
  element: HTMLDivElement | null
) => void;

interface UseStickyNotesDragParams {
  onMoveCommit: (noteId: string, pos: { x: number; y: number }) => void;
  onResizeCommit: (
    noteId: string,
    size: { width: number; height: number }
  ) => void;
  onDelete: (noteId: string) => void;
  bringToFront: (noteId: string) => void;
}

export const useStickyNotesDrag = ({
  onMoveCommit,
  onResizeCommit,
  onDelete,
  bringToFront,
}: UseStickyNotesDragParams) => {
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [currentDragNoteId, setCurrentDragNoteId] = useState<string | null>(
    null
  );

  const stateRef = useRef({
    drag: null as DragState | null,
    isOverTrash: false,
    frameId: null as number | null,
    liveOffset: { x: 0, y: 0 },
    pendingUpdate: null as Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
    }> | null,
  });

  const cleanupState = () => {
    if (stateRef.current.frameId) {
      cancelAnimationFrame(stateRef.current.frameId);
    }
    stateRef.current.drag = null;
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
    mode: 'move' | 'resize',
    update: Partial<{ x: number; y: number; width: number; height: number }>,
    startPosition: { x: number; y: number }
  ) => {
    if (mode === 'move' && update.x !== undefined && update.y !== undefined) {
      const offX = update.x - startPosition.x;
      const offY = update.y - startPosition.y;
      stateRef.current.liveOffset = { x: offX, y: offY };
      element.style.transform = `translate(${offX}px, ${offY}px)`;
    } else if (update.width !== undefined && update.height !== undefined) {
      element.style.width = `${update.width}px`;
      element.style.height = `${update.height}px`;
    }
  };

  // Cleanup element styles
  const cleanupElement = (element: HTMLDivElement, mode: 'move' | 'resize') => {
    if (mode === 'move') {
      element.style.transform = '';
    }
  };

  const handlersRef = useRef({
    handlePointerMove: (e: PointerEvent) => {},
    handlePointerUp: (e: PointerEvent) => {},
  });

  handlersRef.current.handlePointerMove = (e: PointerEvent) => {
    const { drag } = stateRef.current;
    if (!drag || !drag.element) return;

    const deltaX = e.clientX - drag.startX;
    const deltaY = e.clientY - drag.startY;

    if (drag.mode === 'move') {
      // Calculate with boundary constraints
      const x = Math.max(
        0,
        Math.min(
          window.innerWidth - drag.startSize.width - TOOLBAR_WIDTH,
          drag.startPosition.x + deltaX
        )
      );
      const y = Math.max(
        0,
        Math.min(
          window.innerHeight - drag.startSize.height,
          drag.startPosition.y + deltaY
        )
      );

      stateRef.current.pendingUpdate = { x, y };

      const visualX = drag.startPosition.x + deltaX;
      const visualY = drag.startPosition.y + deltaY;
      const over = isNoteOverTrashZone(
        visualX,
        visualY,
        drag.startSize.width,
        drag.startSize.height
      );
      if (over !== stateRef.current.isOverTrash) {
        stateRef.current.isOverTrash = over;
        setIsOverTrash(over);
      }
    } else {
      const width = Math.max(
        MIN_NOTE_SIZE.width,
        drag.startSize.width + deltaX
      );
      const height = Math.max(
        MIN_NOTE_SIZE.height,
        drag.startSize.height + deltaY
      );
      stateRef.current.pendingUpdate = { width, height };
    }

    // Batching via requestAnimationFrame
    if (!stateRef.current.frameId) {
      stateRef.current.frameId = requestAnimationFrame(() => {
        const { pendingUpdate, drag: d } = stateRef.current;
        if (!pendingUpdate || !d || !d.element || !d.mode) {
          stateRef.current.frameId = null;
          return;
        }

        updateElement(d.element, d.mode, pendingUpdate, d.startPosition);

        stateRef.current.frameId = null;
        stateRef.current.pendingUpdate = null;
      });
    }
  };

  handlersRef.current.handlePointerUp = (e: PointerEvent) => {
    const { drag, liveOffset, isOverTrash: over } = stateRef.current;
    if (!drag) return;

    if (stateRef.current.frameId) {
      cancelAnimationFrame(stateRef.current.frameId);
      stateRef.current.frameId = null;
    }

    const target = drag.target;

    target.removeEventListener('pointermove', handlePointerMove);
    target.removeEventListener('pointerup', handlePointerUp);
    target.removeEventListener('pointercancel', handlePointerUp);
    target.removeEventListener('lostpointercapture', handlePointerUp);

    try {
      if (target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {
      // Ignore errors
    }

    if (drag.element && drag.noteId) {
      if (drag.mode === 'move') {
        const isPointerUp = e.type === 'pointerup';
        const shouldDelete = isPointerUp && over;

        if (shouldDelete) {
          onDelete(drag.noteId);
        } else {
          onMoveCommit(drag.noteId, {
            x: drag.startPosition.x + liveOffset.x,
            y: drag.startPosition.y + liveOffset.y,
          });
        }
        cleanupElement(drag.element, drag.mode);
      } else {
        const rect = drag.element.getBoundingClientRect();
        onResizeCommit(drag.noteId, {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }

    cleanupState();
  };

  // Stable event handler wrappers
  const handlePointerMove = useCallback((e: PointerEvent) => {
    handlersRef.current.handlePointerMove(e);
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    handlersRef.current.handlePointerUp(e);
  }, []);

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

  const startDrag = useCallback(
    (
      e: React.PointerEvent,
      note: NoteData,
      element: HTMLDivElement | null,
      mode: 'move' | 'resize'
    ) => {
      if (!element) return;

      e.preventDefault();

      const target = e.currentTarget as HTMLElement;

      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {
        // Failed to set pointer capture - ignore and continue
        return;
      }

      stateRef.current.drag = {
        mode,
        noteId: note.id,
        element,
        target,
        startX: e.clientX,
        startY: e.clientY,
        startPosition: { ...note.position },
        startSize: { ...note.size },
      };
      setCurrentDragNoteId(note.id);

      if (mode === 'move') {
        bringToFront(note.id);
      }

      addListeners(target);
    },
    [bringToFront, addListeners]
  );

  const startMove: DragStartHandler = (e, note, el) =>
    startDrag(e, note, el, 'move');
  const startResize: DragStartHandler = (e, note, el) =>
    startDrag(e, note, el, 'resize');

  useEffect(() => {
    const state = stateRef.current;
    const cleanup = removeListeners;
    return () => {
      if (state.frameId) {
        cancelAnimationFrame(state.frameId);
      }
      if (state.drag?.target) {
        cleanup(state.drag.target);
      }
    };
  }, [removeListeners]);

  return {
    isOverTrash,
    currentDragNoteId,
    startMove,
    startResize,
  };
};
