import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/_server/db';
import logger from '@/_server/logger';
import { CreateUserData, CreateUserDataSchema } from '@/_types/schemas';
import { z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon2 from 'argon2';

type Params = {
  q?: string;
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const query = context.params?.q;

  logger.info(`Search for Users: ${JSON.stringify(context.params)}`);

  const users = await prisma.user.findMany({
    where: {
      name: { contains: query },
    },
  });

  const usersToReturn = users.map((user) => ({
    id: user.id,
    name: user.name,
    image: user.image,
  }));

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
