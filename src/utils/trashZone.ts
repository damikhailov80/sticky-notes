import { TRASH_ZONE_BOUNDS } from './constants';

/**
 * Checks if a point with coordinates (x, y) is over the trash zone
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns true if the point is over the trash zone
 */
export const isOverTrashZone = (x: number, y: number): boolean => {
  return (
    x >= TRASH_ZONE_BOUNDS.left &&
    x <= TRASH_ZONE_BOUNDS.right &&
    y >= TRASH_ZONE_BOUNDS.top &&
    y <= TRASH_ZONE_BOUNDS.bottom
  );
};
