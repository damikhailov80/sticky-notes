import { useCallback, useEffect, useRef } from 'react';
import { MIN_NOTE_SIZE } from '../utils/constants';

interface NoteData {
  id: string;
  size: { width: number; height: number };
}

export type ResizeStartHandler = (
  e: React.PointerEvent,
  note: NoteData,
  element: HTMLDivElement | null
) => void;

interface UseStickyNotesResizeParams {
  onResizeCommit: (
    noteId: string,
    size: { width: number; height: number }
  ) => void;
}

interface ResizeState {
  noteId: string;
  element: HTMLDivElement;
  target: HTMLElement;
  startX: number;
  startY: number;
  startSize: { width: number; height: number };
}

export const useStickyNotesResize = ({
  onResizeCommit,
}: UseStickyNotesResizeParams) => {
  const stateRef = useRef({
    resize: null as ResizeState | null,
    frameId: null as number | null,
    pendingUpdate: null as Partial<{
      width: number;
      height: number;
    }> | null,
  });

  // Update DOM element
  const updateElement = (
    element: HTMLDivElement,
    update: Partial<{ width: number; height: number }>
  ) => {
    if (update.width !== undefined && update.height !== undefined) {
      element.style.width = `${update.width}px`;
      element.style.height = `${update.height}px`;
    }
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const { resize } = stateRef.current;
    if (!resize) return;

    const deltaX = e.clientX - resize.startX;
    const deltaY = e.clientY - resize.startY;

    const width = Math.max(
      MIN_NOTE_SIZE.width,
      resize.startSize.width + deltaX
    );
    const height = Math.max(
      MIN_NOTE_SIZE.height,
      resize.startSize.height + deltaY
    );
    stateRef.current.pendingUpdate = { width, height };

    // Batching via requestAnimationFrame
    if (!stateRef.current.frameId) {
      stateRef.current.frameId = requestAnimationFrame(() => {
        const { pendingUpdate, resize: r } = stateRef.current;
        if (!pendingUpdate || !r) {
          stateRef.current.frameId = null;
          return;
        }

        updateElement(r.element, pendingUpdate);

        stateRef.current.frameId = null;
        stateRef.current.pendingUpdate = null;
      });
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const { resize } = stateRef.current;
      if (!resize) return;

      if (stateRef.current.frameId) {
        cancelAnimationFrame(stateRef.current.frameId);
        stateRef.current.frameId = null;
      }

      const target = resize.target;

      removeListeners(target);

      try {
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Ignore errors
      }

      const rect = resize.element.getBoundingClientRect();
      onResizeCommit(resize.noteId, {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });

      stateRef.current.resize = null;
      stateRef.current.pendingUpdate = null;
      stateRef.current.frameId = null;
    },
    [onResizeCommit, removeListeners]
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

  const startResize: ResizeStartHandler = useCallback(
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

      stateRef.current.resize = {
        noteId: note.id,
        element,
        target,
        startX: e.clientX,
        startY: e.clientY,
        startSize: { ...note.size },
      };

      addListeners(target);
    },
    [addListeners]
  );

  useEffect(() => {
    const state = stateRef.current;
    const cleanup = removeListeners;
    return () => {
      if (state.frameId) {
        cancelAnimationFrame(state.frameId);
      }
      if (state.resize?.target) {
        cleanup(state.resize.target);
      }
    };
  }, [removeListeners]);

  return {
    startResize,
  };
};
