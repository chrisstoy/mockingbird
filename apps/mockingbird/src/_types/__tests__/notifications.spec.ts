import { NotificationType, isNotificationType } from '../notifications';

describe('NotificationType', () => {
  it('exports all expected type strings', () => {
    expect(NotificationType.FRIEND_REQUEST).toBe('friend.request');
    expect(NotificationType.FRIEND_REQUEST_ACCEPTED).toBe('friend.request.accepted');
    expect(NotificationType.GROUP_INVITE).toBe('group.invite');
    expect(NotificationType.GROUP_INVITE_ACCEPTED).toBe('group.invite.accepted');
    expect(NotificationType.GROUP_INVITE_DECLINED).toBe('group.invite.declined');
    expect(NotificationType.GROUP_JOIN_REQUEST).toBe('group.join_request');
    expect(NotificationType.GROUP_JOIN_REQUEST_ACCEPTED).toBe('group.join_request.accepted');
    expect(NotificationType.GROUP_JOIN_REQUEST_DECLINED).toBe('group.join_request.declined');
    expect(NotificationType.GROUP_OWNERSHIP_TRANSFERRED).toBe('group.ownership.transferred');
  });

  it('isNotificationType returns true for valid types', () => {
    expect(isNotificationType('friend.request')).toBe(true);
    expect(isNotificationType('group.invite')).toBe(true);
  });

  it('isNotificationType returns false for unknown strings', () => {
    expect(isNotificationType('unknown.type')).toBe(false);
    expect(isNotificationType('')).toBe(false);
  });
});
