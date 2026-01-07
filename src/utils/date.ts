/**
 * Calculate the number of days between a date and now
 */
export function daysAgo(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format a date as a human-readable "X days ago" string
 */
export function formatDaysAgo(date: Date): string {
  const days = daysAgo(date);

  if (days === 0) {
    return 'today';
  } else if (days === 1) {
    return '1 day ago';
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(days / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

/**
 * Check if a date is older than X days
 */
export function isOlderThan(date: Date, days: number): boolean {
  return daysAgo(date) > days;
}
