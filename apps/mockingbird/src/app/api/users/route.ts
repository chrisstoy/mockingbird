import { prisma } from '@/_server/db';
import baseLogger from '@/_server/logger';
import { CreateUserData, CreateUserDataSchema } from '@/_types/schemas';
import { UserInfo } from '@/_types/users';
import { auth } from '@/app/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logger = baseLogger.child({
  service: 'api:users',
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  const session = await auth();
  if (!session?.user?.id) {
    logger.error('User not logged in');
    return NextResponse.json(
      { statusText: 'User not logged in' },
      { status: 401 }
    );
  }

  logger.info(`Search for Users with query: ${query}`);

  if (!query?.length) {
    return NextResponse.json(
      { statusText: 'No query provided' },
      { status: 500 }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  const friends = await prisma.friends.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      friendId: true,
      accepted: true,
    },
  });

  const usersToReturn = users.map((user) => {
    const friend = friends.find((f) => f.friendId === user.id);

    const userInfo: UserInfo = {
      id: user.id,
      name: user.name ?? '',
      image: user.image,
      friendStatus: friend
        ? friend.accepted
          ? 'accepted'
          : 'pending'
        : undefined,
      mutualFriends: 0,
    };
    return userInfo;
  });

  return NextResponse.json(usersToReturn, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const createUserData: CreateUserData = await request.json();

    try {
      CreateUserDataSchema.parse(createUserData);
    } catch (error) {
      logger.error(error);
      return NextResponse.json(
        { statusText: `Bad Request: ${error}` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: createUserData.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          statusText: `User with email '${createUserData.email}' already exists`,
        },
        { status: 409 }
      );
    }

    logger.info(`Creating new user: ${JSON.stringify(createUserData)}`);

    const { name, email, password } = createUserData;

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    const today = new Date();
    const expiresAt = new Date(
      today.getFullYear() + 1,
      today.getMonth(),
      today.getDate()
    );

    // encrypt password
    try {
      const encryptedPassword = password; //await argon2.hash(password);
      const passwordResult = await prisma.passwords.create({
        data: {
          userId: newUser.id,
          password: encryptedPassword,
          expiresAt,
        },
      });
      logger.info(
        `Created new user: ${newUser} with password expiration: ${passwordResult.expiresAt.toISOString()}`
      );
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to encrypt password');
    }

    return NextResponse.json(
      { statusText: 'Created', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { statusText: `Bad Request: ${error}` },
        { status: 500 }
      );
    }
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { statusText: `Bad Request: ${error}` },
        { status: 500 }
      );
    }

    logger.error(error);
  }
}
