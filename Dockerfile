# Common build stage
FROM node:16-alpine as common-build-stage

COPY . ./app

WORKDIR /app

RUN apk --no-cache add --virtual .builds-deps build-base python3

EXPOSE 3000

# Development build stage
FROM common-build-stage as development-build-stage

ENV NODE_ENV development

RUN yarn install

CMD ["yarn", "deploy:dev"]

# Production build stage
FROM common-build-stage as production-build-stage

ENV NODE_ENV production

RUN yarn install

CMD ["yarn", "deploy:prod"]
