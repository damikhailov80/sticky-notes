export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Note {
  id: string;
  position: Position;
  size: Size;
  text: string;
  color: string;
  zIndex: number;
}

export type DragMode = 'move' | 'resize' | null;

export interface DragState {
  mode: DragMode;
  noteId: string | null;
  element: HTMLDivElement | null;
  target: HTMLElement;
  startX: number;
  startY: number;
  startPosition: Position;
  startSize: Size;
}
