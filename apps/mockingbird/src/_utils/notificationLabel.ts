export function getNotificationLabel(
  type: string,
  actorName: string | null,
  metadata?: Record<string, unknown> | null
): string {
  const actor = actorName ?? 'Someone';
  const groupName = (metadata?.groupName as string | undefined) ?? 'a Flock';

  switch (type) {
    case 'friend.request':
      return `${actor} sent you a friend request`;
    case 'friend.request.accepted':
      return `${actor} accepted your friend request`;
    case 'group.invite':
      return `${actor} invited you to join ${groupName}`;
    case 'group.invite.accepted':
      return `${actor} accepted your invite to ${groupName}`;
    case 'group.invite.declined':
      return `${actor} declined your invite to ${groupName}`;
    case 'group.join_request':
      return `${actor} wants to join ${groupName}`;
    case 'group.join_request.accepted':
      return `Your request to join ${groupName} was accepted`;
    case 'group.join_request.declined':
      return `Your request to join ${groupName} was declined`;
    case 'group.ownership.transferred':
      return `${actor} transferred ownership of ${groupName} to you`;
    default:
      return 'You have a new notification';
  }
}

export function getNotificationTypeCategory(type: string): 'friend' | 'group' | 'system' {
  if (type.startsWith('friend.')) return 'friend';
  if (type.startsWith('group.')) return 'group';
  return 'system';
}
