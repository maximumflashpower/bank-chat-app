export { BreachSeverity } from './privacy-breach-notification.entity';

export const BREACH_NOTIFICATION_RULES: Record<string, any> = {
  low: { notificationRequired: false, notifyAuthority: false, timeline: '7 days', slaHours: 168 },
  medium: { notificationRequired: true, notifyAuthority: true, timeline: '72 hours', slaHours: 72 },
  high: { notificationRequired: true, notifyAuthority: true, timeline: '24 hours', slaHours: 24 },
};
