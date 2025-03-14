FROM node:16

WORKDIR /app

RUN adduser --disabled-password --gecos "" appuser

COPY package*.json ./
RUN npm install

COPY . .

USER appuser

EXPOSE 5000

CMD ["npm", "start"] 