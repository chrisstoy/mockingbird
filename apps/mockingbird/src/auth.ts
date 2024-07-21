import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

const authorize = async (
  credentials: Partial<Record<'username' | 'password', unknown>>
) => {
  const users = [
    {
      id: 'test-user-1',
      userName: 'test1',
      name: 'Test User 1',
      password: 'pass',
      email: 'test1@donotreply.com',
    },
    {
      id: 'test-user-2',
      userName: 'test2',
      name: 'Test User 2',
      password: 'pass',
      email: 'test2@donotreply.com',
    },
  ];

  const user = users.find(
    (user) =>
      user.userName === credentials.username &&
      user.password === credentials.password
  );
  return user ? { id: user.id, name: user.name, email: user.email } : null;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Credentials({
      name: 'Credentials',
      credentials: {
        username: {
          label: 'Username',
          type: 'text',
          placeholder: 'jsmith',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      authorize,
    }),
  ],
});
