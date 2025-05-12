FROM harbor.one.com/opsdev/playwright:node-22
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app
ENV PATH /app/node_modules/:$PATH
COPY . /app/
RUN npm install
RUN npm run build
ENV PORT 3000
EXPOSE 3000
CMD ["node", "dist/index.js"]

