import Credentials from 'next-auth/providers/credentials';

const credentialsConfig = {
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
};

async function authorize(
  credentials: Partial<Record<'username' | 'password', unknown>>
) {
  // TODO: lookup users in local database.  This is just for testing
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
}

export default Credentials(credentialsConfig);
