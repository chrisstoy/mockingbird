import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/_server/db';
import bcrypt from 'bcryptjs';
import { CredentialsError } from './credentialsError';

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
  credentials: Partial<Record<'email' | 'password', string>>
) {
  const { email, password } = credentials;
  if (!email || !password) {
    throw new CredentialsError(
      'emailAndPasswordRequired',
      'Email and password are required'
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    console.error(`User with email ${email} not found`);
    throw new CredentialsError('userNotFound', 'User not found');
  }

  const existingPassword = await prisma.passwords.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (!existingPassword) {
    throw new CredentialsError('passwordNotFound', 'Password not found');
  }

  try {
    if (!(await bcrypt.compare(password, existingPassword.password))) {
      console.log(`Invalid password for user ${user.id}:${user.email}`);
      throw new CredentialsError('invalidPassword', 'Invalid password');
    }
  } catch (error) {
    if (error instanceof CredentialsError) {
      throw error;
    }
    throw new CredentialsError(
      'errorComparingPasswords',
      'Error comparing passwords'
    );
  }

  if (existingPassword.expiresAt < new Date()) {
    console.warn(
      `Password for user ${user.id}:${
        user.email
      } expired on ${existingPassword.expiresAt.toISOString()}`
    );
    throw new CredentialsError('passwordExpired', 'Password has expired');
  }

  return user;
}

export default Credentials(credentialsConfig);
