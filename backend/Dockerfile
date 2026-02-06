# 1) Build stage: compile TypeScript
FROM node:18-alpine AS builder

WORKDIR /app

# copy manifests
COPY package.json package-lock.json tsconfig.json ./

# install ALL deps (including devDeps)
RUN npm ci

# copy your source & compile
COPY src ./src
RUN npm run build

# 2) Production stage
FROM node:18-alpine

LABEL org.opencontainers.image.source="https://github.com/hoangsonww/rag-langchain-system-api"
LABEL org.opencontainers.image.description="A basic Express API for an AI LangChain & RAG system (built in TypeScript)"

WORKDIR /app

# install only production deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# bring in compiled code + docs
COPY --from=builder /app/dist ./dist
COPY documents ./documents

EXPOSE 3456
CMD ["node", "dist/app.js"]
