import { TRASH_ZONE_SIZE } from './constants';
import { TOOLBAR_WIDTH } from './notePosition';

/**
 * Checks if a note overlaps with the trash zone using AABB collision detection
 * @param noteX - Note's X position (relative to canvas)
 * @param noteY - Note's Y position (relative to canvas)
 * @param noteWidth - Note's width
 * @param noteHeight - Note's height
 * @returns true if the note overlaps with the trash zone
 */
export const isNoteOverTrashZone = (
  noteX: number,
  noteY: number,
  noteWidth: number,
  noteHeight: number
): boolean => {
  const trashBounds = {
    left: window.innerWidth - TRASH_ZONE_SIZE.width - TRASH_ZONE_SIZE.margin,
    top: window.innerHeight - TRASH_ZONE_SIZE.height - TRASH_ZONE_SIZE.margin,
    right: window.innerWidth - TRASH_ZONE_SIZE.margin,
    bottom: window.innerHeight - TRASH_ZONE_SIZE.margin,
  };

  // Note positions are relative to canvas (excluding toolbar)
  // Convert to window coordinates by adding TOOLBAR_WIDTH
  const noteBounds = {
    left: noteX + TOOLBAR_WIDTH,
    top: noteY,
    right: noteX + TOOLBAR_WIDTH + noteWidth,
    bottom: noteY + noteHeight,
  };

  // AABB (Axis-Aligned Bounding Box) collision detection
  // Two rectangles overlap if they overlap on both X and Y axes
  return (
    noteBounds.right >= trashBounds.left &&
    noteBounds.left <= trashBounds.right &&
    noteBounds.bottom >= trashBounds.top &&
    noteBounds.top <= trashBounds.bottom
  );
};
