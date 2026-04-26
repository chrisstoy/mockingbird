export const NotificationType = {
  FRIEND_REQUEST:               'friend.request',
  FRIEND_REQUEST_ACCEPTED:      'friend.request.accepted',
  GROUP_INVITE:                 'group.invite',
  GROUP_INVITE_ACCEPTED:        'group.invite.accepted',
  GROUP_INVITE_DECLINED:        'group.invite.declined',
  GROUP_JOIN_REQUEST:           'group.join_request',
  GROUP_JOIN_REQUEST_ACCEPTED:  'group.join_request.accepted',
  GROUP_JOIN_REQUEST_DECLINED:  'group.join_request.declined',
  GROUP_OWNERSHIP_TRANSFERRED:  'group.ownership.transferred',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

const ALL_TYPES = new Set<string>(Object.values(NotificationType));

export function isNotificationType(value: string): value is NotificationType {
  return ALL_TYPES.has(value);
}
