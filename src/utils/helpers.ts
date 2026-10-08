import moment from 'moment';

export function getGreeting(): string {
  const hour = moment().hour(); // 0-23

  if (hour >= 0 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 16) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}