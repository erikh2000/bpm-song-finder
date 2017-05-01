export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

// Get a Unix-style timestamp, seconds since 1/1/1970.
export function getTimestamp() {
  return Math.floor(new Date().getTime()/1000);
}
