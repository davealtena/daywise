import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

// Route imports
import recipeRoutes from './routes/recipes';
import mealsRoutes from './routes/meals';
import shoppingRoutes from './routes/shopping';
import budgetRoutes from './routes/budget';
import cleaningRoutes from './routes/cleaning';
import aiRoutes from './routes/ai';

const fastify = Fastify({
  logger: true,
});

async function buildServer() {
  // Register plugins
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  await fastify.register(recipeRoutes, { prefix: '/api/v1/recipes' });
  await fastify.register(mealsRoutes, { prefix: '/api/v1/meals' });
  await fastify.register(shoppingRoutes, { prefix: '/api/v1/shopping' });
  await fastify.register(budgetRoutes, { prefix: '/api/v1/budget' });
  await fastify.register(cleaningRoutes, { prefix: '/api/v1/cleaning' });
  await fastify.register(aiRoutes, { prefix: '/api/v1/ai' });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Server ready at http://${host}:${port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { buildServer };