import {
  acceptFriendRequest,
  cancelFriendRequest,
  removeFriend,
  requestFriend,
} from '@/_services/friends';
import { FriendStatus } from '@/_types/users';

export async function updateFriendStatusWithUser(
  userId: string,
  friendId: string,
  status: FriendStatus
) {
  console.log(`Update friend status: ${friendId}, ${status}`);

  switch (status) {
    case 'friend':
      await acceptFriendRequest(userId, friendId);
      break;
    case 'pending':
      await cancelFriendRequest(userId, friendId);
      break;
    case 'none':
      await removeFriend(userId, friendId);
      break;
    case 'requested':
      await requestFriend(userId, friendId);
      break;
  }
}
