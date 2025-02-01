FROM node:22-alpine

ARG APP
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app 
COPY package.json yarn.lock ./ 
RUN yarn install
COPY . . 
RUN yarn build ${APP} 

ENV APP_MAIN_FILE=dist/apps/${APP}/main 
CMD node ${APP_MAIN_FILE}
