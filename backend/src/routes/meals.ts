import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../database/connection';
import { user_meals, recipes } from '../database/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const mealsRoute: FastifyPluginAsync = async (fastify) => {
  const LogMealSchema = z.object({
    user_id: z.number().int().positive(),
    recipe_id: z.number().int().positive().optional(),
    meal_name: z.string().min(1),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.string(),
      unit: z.string().optional(),
    })),
    nutrition: z.object({
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      fiber: z.number().min(0).optional(),
    }).optional(),
    portion_size: z.string().optional(),
    notes: z.string().optional(),
    logged_at: z.string().datetime().optional(),
  });

  // Log a new meal
  fastify.post<{ Body: z.infer<typeof LogMealSchema> }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['user_id', 'meal_name', 'meal_type', 'ingredients'],
        properties: {
          user_id: { type: 'number' },
          recipe_id: { type: 'number' },
          meal_name: { type: 'string', minLength: 1 },
          meal_type: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
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
          nutrition: {
            type: 'object',
            properties: {
              calories: { type: 'number', minimum: 0 },
              protein: { type: 'number', minimum: 0 },
              carbs: { type: 'number', minimum: 0 },
              fat: { type: 'number', minimum: 0 },
              fiber: { type: 'number', minimum: 0 }
            }
          },
          portion_size: { type: 'string' },
          notes: { type: 'string' },
          logged_at: { type: 'string', format: 'date-time' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const loggedMeal = await db.insert(user_meals).values({
        ...request.body,
        ingredients: request.body.ingredients as any,
        nutrition: request.body.nutrition as any,
        logged_at: request.body.logged_at ? new Date(request.body.logged_at) : new Date(),
      }).returning();

      return reply.status(201).send({
        success: true,
        data: loggedMeal[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to log meal',
      });
    }
  });

  // Get user's meals for a specific date
  fastify.get<{ 
    Params: { user_id: string };
    Querystring: { date?: string }
  }>('/user/:user_id', async (request, reply) => {
    try {
      const userId = parseInt(request.params.user_id);
      if (isNaN(userId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid user ID',
        });
      }

      let query = db.select().from(user_meals).where(eq(user_meals.user_id, userId));

      // Filter by date if provided
      if (request.query.date) {
        const targetDate = new Date(request.query.date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        
        query = query.where(
          and(
            eq(user_meals.user_id, userId),
            gte(user_meals.logged_at, startOfDay),
            lte(user_meals.logged_at, endOfDay)
          )
        );
      }

      const meals = await query.orderBy(desc(user_meals.logged_at));

      return { success: true, data: meals };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch meals',
      });
    }
  });

  // Get daily nutrition summary
  fastify.get<{ 
    Params: { user_id: string };
    Querystring: { date?: string }
  }>('/user/:user_id/nutrition', async (request, reply) => {
    try {
      const userId = parseInt(request.params.user_id);
      if (isNaN(userId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid user ID',
        });
      }

      const targetDate = request.query.date ? new Date(request.query.date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const meals = await db.select().from(user_meals).where(
        and(
          eq(user_meals.user_id, userId),
          gte(user_meals.logged_at, startOfDay),
          lte(user_meals.logged_at, endOfDay)
        )
      );

      // Calculate total nutrition
      const totalNutrition = meals.reduce((total, meal) => {
        if (meal.nutrition) {
          const nutrition = meal.nutrition as any;
          return {
            calories: total.calories + (nutrition.calories || 0),
            protein: total.protein + (nutrition.protein || 0),
            carbs: total.carbs + (nutrition.carbs || 0),
            fat: total.fat + (nutrition.fat || 0),
            fiber: total.fiber + (nutrition.fiber || 0),
          };
        }
        return total;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      return {
        success: true,
        data: {
          date: targetDate.toISOString().split('T')[0],
          total_nutrition: totalNutrition,
          meal_count: meals.length,
          meals: meals.map(meal => ({
            id: meal.id,
            meal_name: meal.meal_name,
            meal_type: meal.meal_type,
            nutrition: meal.nutrition,
            logged_at: meal.logged_at,
          })),
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch nutrition summary',
      });
    }
  });

  // Update a logged meal
  fastify.put<{ 
    Params: { id: string };
    Body: Partial<z.infer<typeof LogMealSchema>>;
  }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid meal ID',
        });
      }

      const updatedMeal = await db
        .update(user_meals)
        .set({
          ...request.body,
          ingredients: request.body.ingredients as any,
          nutrition: request.body.nutrition as any,
        })
        .where(eq(user_meals.id, id))
        .returning();

      if (updatedMeal.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Meal not found',
        });
      }

      return { success: true, data: updatedMeal[0] };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update meal',
      });
    }
  });

  // Delete a logged meal
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid meal ID',
        });
      }

      const deletedMeal = await db
        .delete(user_meals)
        .where(eq(user_meals.id, id))
        .returning();

      if (deletedMeal.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Meal not found',
        });
      }

      return { success: true, message: 'Meal deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete meal',
      });
    }
  });

  // Create meal from existing recipe
  fastify.post<{ 
    Body: {
      user_id: number;
      recipe_id: number;
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      portion_size?: string;
      notes?: string;
      logged_at?: string;
    }
  }>('/from-recipe', {
    schema: {
      body: {
        type: 'object',
        required: ['user_id', 'recipe_id', 'meal_type'],
        properties: {
          user_id: { type: 'number' },
          recipe_id: { type: 'number' },
          meal_type: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
          portion_size: { type: 'string' },
          notes: { type: 'string' },
          logged_at: { type: 'string', format: 'date-time' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      // Get the recipe first
      const recipe = await db.select().from(recipes).where(eq(recipes.id, request.body.recipe_id));
      
      if (recipe.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Recipe not found',
        });
      }

      // Create meal from recipe
      const loggedMeal = await db.insert(user_meals).values({
        user_id: request.body.user_id,
        recipe_id: request.body.recipe_id,
        meal_name: recipe[0].name,
        meal_type: request.body.meal_type,
        ingredients: recipe[0].ingredients,
        portion_size: request.body.portion_size || '1 serving',
        notes: request.body.notes,
        logged_at: request.body.logged_at ? new Date(request.body.logged_at) : new Date(),
      }).returning();

      return reply.status(201).send({
        success: true,
        data: loggedMeal[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to log meal from recipe',
      });
    }
  });
};

export default mealsRoute;