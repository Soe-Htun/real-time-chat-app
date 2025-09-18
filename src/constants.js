export const time = new Intl.DateTimeFormat('en-SG', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})

export const dayMonth = new Intl.DateTimeFormat('en-SG', {
  month: 'long',
  day: 'numeric'
})

export function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function formatLastMessageTime(date) {
  const now = new Date();
  const diffTime = now - date; // milliseconds
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (isToday(date)) {
    return time.format(date); // show only time
  } else if (diffDays < 7) {
    // show day of week
    return date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...
  } else {
    // show full date
    return dayMonth.format(date) + ' ' + time.format(date);
  }
}

export function formatMessageTime(createdAt) {
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffTime = now - date;
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Less than 1 minute - show "online"
  if (diffMinutes < 1) {
    return 'now';
  }

  // Less than 1 hour - show minutes ago
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  }

  // Less than 24 hours - show hours ago
  if (diffHours < 24) {
    return `${diffHours} hours`;
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // This week (within 7 days) - show day name
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // Older than a week - show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Different year - show month, day, year
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
