# Common build stage
FROM node:16-alpine as common-build-stage

COPY . ./app

WORKDIR /app

RUN npm install --legacy-peer-deps
RUN npm run build
RUN npm prune --production --legacy-peer-deps

EXPOSE 3000

# Development build stage
FROM common-build-stage as development-build-stage

ENV NODE_ENV development

CMD ["yarn", "docker:run"]

# Production build stage
FROM common-build-stage as production-build-stage

ENV NODE_ENV production

CMD ["yarn", "docker:run"]
