import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/_server/db';
import * as argon2 from 'argon2';

type CredentialsConfigType = Parameters<typeof Credentials>[0];

const credentialsConfig: CredentialsConfigType = {
  name: 'Credentials',
  credentials: {
    email: {
      label: 'Email',
      type: 'text',
      placeholder: 'user@example.com',
    },
    password: {
      label: 'Password',
      type: 'password',
    },
  },
  authorize,
};

async function authorize(
  credentials: Partial<Record<'email' | 'password', unknown>>
) {
  const email = credentials?.email as string;
  const password = credentials?.password as string;
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  const existingPassword = await prisma.passwords.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (!existingPassword) {
    throw new Error('Password not found.');
  }

  try {
    if (password !== existingPassword.password) {
      // if (!(await argon2.verify(existingPassword.password, password))) {
      throw new Error('Incorrect password.');
    }
  } catch (error) {
    throw new Error('Error comparing passwords');
  }

  return user;
}

export default Credentials(credentialsConfig);
