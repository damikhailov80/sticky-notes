import { TRASH_ZONE_SIZE } from './constants';

/**
 * Checks if a point with coordinates (x, y) is over the trash zone
 * Calculates bounds dynamically based on current window size
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns true if the point is over the trash zone
 */
export const isOverTrashZone = (x: number, y: number): boolean => {
  const bounds = {
    left: window.innerWidth - TRASH_ZONE_SIZE.width - TRASH_ZONE_SIZE.margin,
    top: window.innerHeight - TRASH_ZONE_SIZE.height - TRASH_ZONE_SIZE.margin,
    right: window.innerWidth - TRASH_ZONE_SIZE.margin,
    bottom: window.innerHeight - TRASH_ZONE_SIZE.margin,
  };

  return (
    x >= bounds.left &&
    x <= bounds.right &&
    y >= bounds.top &&
    y <= bounds.bottom
  );
};
