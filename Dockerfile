FROM node:14-alpine AS build
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:14-alpine AS deps
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm ci --production
RUN version=$(node -e "console.log(require('./package').dependencies['@mediaurl/sdk'])")
RUN npm i @mediaurl/cassandra-cache@$version

FROM node:14-alpine
WORKDIR /code
ENV LOAD_MEDIAURL_CACHE_MODULE "@mediaurl/cassandra-cache"
COPY --from=build /code/dist ./dist/
COPY --from=deps /code/node_modules ./node_modules/
CMD node dist
