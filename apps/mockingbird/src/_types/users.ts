export interface UserInfo {
  id: string;
  name: string;
  image: string | null;
  friendStatus?: 'accepted' | 'pending' | 'requested';
  mutualFriends?: number;
}
