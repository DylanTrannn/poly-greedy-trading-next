const ICT = 'Asia/Ho_Chi_Minh';

export function formatIctDate(date: Date, timeZone = ICT): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}

export function formatIctDateTime(date: Date, timeZone = ICT): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(date);
}

export function formatHoursUntilEnd(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatPriceCents(price: number): string {
  return `${(price * 100).toFixed(1)}¢`;
}
