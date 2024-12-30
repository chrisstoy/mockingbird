const formatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function toLocalTime(date: Date) {
  return formatter.format(new Date(date));
}
