import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../database/connection';
import { recipes } from '../database/schema';
import { eq } from 'drizzle-orm';

const recipesRoute: FastifyPluginAsync = async (fastify) => {
  const CreateRecipeSchema = z.object({
    name: z.string().min(1),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.string(),
      unit: z.string().optional(),
    })),
    instructions: z.string().min(1),
    tags: z.array(z.string()).default([]),
    prep_time_minutes: z.number().optional(),
    difficulty: z.number().min(1).max(5).default(1),
    meal_type: z.enum(['quick', 'recovery', 'family', 'prep']).optional(),
    sports_friendly: z.boolean().default(false),
    season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  });

  // Get all recipes
  fastify.get('/', async (request, reply) => {
    try {
      const allRecipes = await db.select().from(recipes);
      return { success: true, data: allRecipes };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch recipes',
      });
    }
  });

  // Get recipe by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid recipe ID',
        });
      }

      const recipe = await db.select().from(recipes).where(eq(recipes.id, id));
      
      if (recipe.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Recipe not found',
        });
      }

      return { success: true, data: recipe[0] };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch recipe',
      });
    }
  });

  // Create new recipe
  fastify.post<{ Body: z.infer<typeof CreateRecipeSchema> }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'ingredients', 'instructions'],
        properties: {
          name: { type: 'string', minLength: 1 },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'amount'],
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                unit: { type: 'string' }
              }
            }
          },
          instructions: { type: 'string', minLength: 1 },
          tags: { type: 'array', items: { type: 'string' } },
          prep_time_minutes: { type: 'number' },
          difficulty: { type: 'number', minimum: 1, maximum: 5 },
          meal_type: { type: 'string', enum: ['quick', 'recovery', 'family', 'prep'] },
          sports_friendly: { type: 'boolean' },
          season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter'] }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const newRecipe = await db.insert(recipes).values({
        ...request.body,
        ingredients: request.body.ingredients as any, // JSON field
      }).returning();

      return reply.status(201).send({
        success: true,
        data: newRecipe[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create recipe',
      });
    }
  });

  // Update recipe
  fastify.put<{ 
    Params: { id: string };
    Body: Partial<z.infer<typeof CreateRecipeSchema>>;
  }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid recipe ID',
        });
      }

      const updatedRecipe = await db
        .update(recipes)
        .set({
          ...request.body,
          ingredients: request.body.ingredients as any,
          updated_at: new Date(),
        })
        .where(eq(recipes.id, id))
        .returning();

      if (updatedRecipe.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Recipe not found',
        });
      }

      return { success: true, data: updatedRecipe[0] };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update recipe',
      });
    }
  });

  // Delete recipe
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid recipe ID',
        });
      }

      const deletedRecipe = await db
        .delete(recipes)
        .where(eq(recipes.id, id))
        .returning();

      if (deletedRecipe.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Recipe not found',
        });
      }

      return { success: true, message: 'Recipe deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete recipe',
      });
    }
  });
};

export default recipesRoute;