export interface UserInfo {
  id: string;
  name: string;
  image: string | null;
}

export type FriendStatus = 'friend' | 'pending' | 'requested' | 'none';

export type FriendCollection = {
  friends: UserInfo[];
  pendingFriends: UserInfo[];
  friendRequests: UserInfo[];
};
