FROM node:14-alpine
ADD . /app/
WORKDIR /app
RUN npm install
EXPOSE 3000
CMD npm run start
