import { BreachStatus } from './privacy-breach-notification.entity';
export { BreachStatus } from './privacy-breach-notification.entity';

export const BREACH_TRANSITIONS: Record<string, BreachStatus[]> = {
  [BreachStatus.DETECTED]: [BreachStatus.ASSESSING],
  [BreachStatus.ASSESSING]: [BreachStatus.NOTIFIED_AUTHORITY, BreachStatus.RESOLVED],
  [BreachStatus.NOTIFIED_AUTHORITY]: [BreachStatus.NOTIFIED_USERS, BreachStatus.CLOSED],
  [BreachStatus.NOTIFIED_USERS]: [BreachStatus.CLOSED],
  [BreachStatus.RESOLVED]: [BreachStatus.CLOSED],
};
