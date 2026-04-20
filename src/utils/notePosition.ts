import { Position } from '../types';
import { DEFAULT_NOTE_SIZE } from './constants';

export const TOOLBAR_WIDTH = 250;

/**
 * Calculates position for a new note in the center of canvas with a slight offset
 * @param noteCount - number of existing notes (for offset)
 * @returns position for the new note
 */
export const calculateNewNotePosition = (noteCount: number): Position => {
  // Calculate canvas center (coordinates relative to canvas, not window)
  const canvasWidth = window.innerWidth - TOOLBAR_WIDTH;
  const canvasHeight = window.innerHeight;

  const centerX = canvasWidth / 2 - DEFAULT_NOTE_SIZE.width / 2;
  const centerY = canvasHeight / 2 - DEFAULT_NOTE_SIZE.height / 2;

  // Small offset for each new note
  const offset = noteCount * 20;

  return {
    x: centerX + offset,
    y: centerY + offset,
  };
};
