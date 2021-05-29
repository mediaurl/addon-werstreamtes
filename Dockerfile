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
RUN npm i @mediaurl/sql-cache @mediaurl/cassandra-cache
RUN test $(find node_modules/@mediaurl -name sdk -type d | tee /dev/stderr | wc -l) -eq 1 ||     (echo "More than one @mediaurl/sdk module is installed"; exit 1)

FROM node:14-alpine
WORKDIR /code
ENV LOAD_MEDIAURL_CACHE_MODULE "@mediaurl/sql-cache @mediaurl/cassandra-cache"
COPY --from=build /code/dist ./dist/
COPY --from=deps /code/node_modules ./node_modules/
CMD node dist
