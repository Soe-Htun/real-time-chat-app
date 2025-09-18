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