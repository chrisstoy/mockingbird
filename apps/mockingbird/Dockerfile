# This template uses Automatically Copying Traced Files feature
# so you need to setup your Next Config file to use `output: 'standalone'`
# Please read this for more information https://nextjs.org/docs/pages/api-reference/next-config-js/output

# Production image, copy all the files and run next
FROM docker.io/node:lts-alpine AS runner
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /usr/src/app
COPY apps/mockingbird/.env.production ./
COPY apps/mockingbird/next.config.js ./
COPY apps/mockingbird/public ./public
COPY apps/mockingbird/.next/static ./.next/static
COPY apps/mockingbird/.next/standalone/apps/mockingbird ./
COPY apps/mockingbird/.next/standalone/package.json ./
COPY apps/mockingbird/.next/standalone/node_modules ./node_modules
RUN npm i sharp
RUN chown -R node:node .
USER node
EXPOSE 3000
RUN npx prisma generate
# COPY --chown=node:node ./tools/scripts/entrypoints/api.sh /usr/local/bin/docker-entrypoint.sh
# ENTRYPOINT [ "docker-entrypoint.sh" ]
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["dumb-init", "node", "server.js"]
