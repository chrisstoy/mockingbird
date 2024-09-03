import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/_services/db';
import logger from '@/_server/logger';

type Params = {
  criteria: {
    q: string;
  };
};

export async function GET(request: NextRequest, context: { params: Params }) {
  const criteria = context.params.criteria;

  logger.info(`Search for Users: ${JSON.stringify(criteria)}`);

  const users = await prisma.user.findMany({
    where: {
      name: { contains: criteria.q },
    },
  });

  const usersToReturn = users.map((user) => ({
    id: user.id,
    name: user.name,
    image: user.image,
  }));

  return NextResponse.json(usersToReturn, { status: 200 });
}
