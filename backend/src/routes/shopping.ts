import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../database/connection';
import { shopping_lists, shopping_items } from '../database/schema';
import { eq, and } from 'drizzle-orm';

const shoppingRoute: FastifyPluginAsync = async (fastify) => {
  const CreateShoppingListSchema = z.object({
    name: z.string().min(1),
    user_id: z.number(),
  });

  const CreateShoppingItemSchema = z.object({
    list_id: z.number(),
    name: z.string().min(1),
    quantity: z.string().optional(),
    category: z.string().optional(),
    estimated_price: z.number().optional(),
  });

  // Get all shopping lists
  fastify.get('/', async (request, reply) => {
    try {
      const lists = await db
        .select()
        .from(shopping_lists)
        .leftJoin(shopping_items, eq(shopping_lists.id, shopping_items.list_id));

      // Group items by list
      const groupedLists = lists.reduce((acc, row) => {
        const list = row.shopping_lists;
        const item = row.shopping_items;

        if (!acc[list.id]) {
          acc[list.id] = {
            ...list,
            items: [],
          };
        }

        if (item) {
          acc[list.id].items.push(item);
        }

        return acc;
      }, {} as Record<number, any>);

      return { 
        success: true, 
        data: Object.values(groupedLists) 
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch shopping lists',
      });
    }
  });

  // Create new shopping list
  fastify.post<{ Body: z.infer<typeof CreateShoppingListSchema> }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'user_id'],
        properties: {
          name: { type: 'string', minLength: 1 },
          user_id: { type: 'number' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const newList = await db
        .insert(shopping_lists)
        .values(request.body)
        .returning();

      return reply.status(201).send({
        success: true,
        data: newList[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create shopping list',
      });
    }
  });

  // Add item to shopping list
  fastify.post<{ Body: z.infer<typeof CreateShoppingItemSchema> }>('/items', {
    schema: {
      body: {
        type: 'object',
        required: ['list_id', 'name'],
        properties: {
          list_id: { type: 'number' },
          name: { type: 'string', minLength: 1 },
          quantity: { type: 'string' },
          category: { type: 'string' },
          estimated_price: { type: 'number' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const newItem = await db
        .insert(shopping_items)
        .values(request.body)
        .returning();

      return reply.status(201).send({
        success: true,
        data: newItem[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to add item to shopping list',
      });
    }
  });

  // Toggle item purchased status
  fastify.patch<{ 
    Params: { itemId: string };
    Body: { purchased: boolean };
  }>('/items/:itemId', async (request, reply) => {
    try {
      const itemId = parseInt(request.params.itemId);
      if (isNaN(itemId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid item ID',
        });
      }

      const updatedItem = await db
        .update(shopping_items)
        .set({ purchased: request.body.purchased })
        .where(eq(shopping_items.id, itemId))
        .returning();

      if (updatedItem.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Item not found',
        });
      }

      return { success: true, data: updatedItem[0] };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update item',
      });
    }
  });

  // Delete shopping item
  fastify.delete<{ Params: { itemId: string } }>('/items/:itemId', async (request, reply) => {
    try {
      const itemId = parseInt(request.params.itemId);
      if (isNaN(itemId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid item ID',
        });
      }

      const deletedItem = await db
        .delete(shopping_items)
        .where(eq(shopping_items.id, itemId))
        .returning();

      if (deletedItem.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Item not found',
        });
      }

      return { success: true, message: 'Item deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete item',
      });
    }
  });

  // Clear checked items from shopping list
  fastify.delete<{ Params: { id: string } }>('/:id/checked', async (request, reply) => {
    try {
      const listId = parseInt(request.params.id);
      if (isNaN(listId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid list ID',
        });
      }

      const deletedItems = await db
        .delete(shopping_items)
        .where(and(
          eq(shopping_items.list_id, listId),
          eq(shopping_items.purchased, true)
        ))
        .returning();

      return { 
        success: true, 
        message: `${deletedItems.length} checked items deleted`,
        data: { deletedCount: deletedItems.length }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to clear checked items',
      });
    }
  });

  // Add items from recipe
  fastify.post<{ 
    Params: { id: string };
    Body: { recipeName: string; ingredients: string[] };
  }>('/:id/recipe', async (request, reply) => {
    try {
      const listId = parseInt(request.params.id);
      if (isNaN(listId)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid list ID',
        });
      }

      const { recipeName, ingredients } = request.body;
      
      if (!recipeName || !Array.isArray(ingredients) || ingredients.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Recipe name and ingredients are required',
        });
      }

      // Create shopping items from ingredients
      const itemsToAdd = ingredients.map(ingredient => ({
        list_id: listId,
        name: ingredient,
        quantity: '1x',
        category: categorizeIngredient(ingredient),
        from_recipe: recipeName,
      }));

      const newItems = await db
        .insert(shopping_items)
        .values(itemsToAdd)
        .returning();

      return reply.status(201).send({
        success: true,
        data: newItems,
        message: `${newItems.length} items added from recipe: ${recipeName}`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to add items from recipe',
      });
    }
  });

  // Delete shopping list
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid list ID',
        });
      }

      // Delete items first (cascade)
      await db.delete(shopping_items).where(eq(shopping_items.list_id, id));
      
      // Delete list
      const deletedList = await db
        .delete(shopping_lists)
        .where(eq(shopping_lists.id, id))
        .returning();

      if (deletedList.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Shopping list not found',
        });
      }

      return { success: true, message: 'Shopping list deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete shopping list',
      });
    }
  });
};

// Helper function to categorize ingredients
function categorizeIngredient(ingredient: string): string {
  const ingredient_lower = ingredient.toLowerCase();
  
  // Groente & Fruit
  if (ingredient_lower.includes('tomaat') || ingredient_lower.includes('ui') || 
      ingredient_lower.includes('paprika') || ingredient_lower.includes('wortel') ||
      ingredient_lower.includes('sla') || ingredient_lower.includes('komkommer') ||
      ingredient_lower.includes('appel') || ingredient_lower.includes('banaan') ||
      ingredient_lower.includes('sinaasappel') || ingredient_lower.includes('citroen')) {
    return 'Groente & Fruit';
  }
  
  // Vlees & Vis
  if (ingredient_lower.includes('kip') || ingredient_lower.includes('rund') ||
      ingredient_lower.includes('varken') || ingredient_lower.includes('vis') ||
      ingredient_lower.includes('zalm') || ingredient_lower.includes('gehakt')) {
    return 'Vlees & Vis';
  }
  
  // Zuivel & Eieren
  if (ingredient_lower.includes('melk') || ingredient_lower.includes('yoghurt') ||
      ingredient_lower.includes('kaas') || ingredient_lower.includes('ei') ||
      ingredient_lower.includes('room') || ingredient_lower.includes('boter')) {
    return 'Zuivel & Eieren';
  }
  
  // Brood & Banket
  if (ingredient_lower.includes('brood') || ingredient_lower.includes('croissant') ||
      ingredient_lower.includes('bagel') || ingredient_lower.includes('muffin')) {
    return 'Brood & Banket';
  }
  
  // Droogwaren
  if (ingredient_lower.includes('rijst') || ingredient_lower.includes('pasta') ||
      ingredient_lower.includes('meel') || ingredient_lower.includes('suiker') ||
      ingredient_lower.includes('zout') || ingredient_lower.includes('peper') ||
      ingredient_lower.includes('olie') || ingredient_lower.includes('azijn')) {
    return 'Droogwaren';
  }
  
  // Diepvries
  if (ingredient_lower.includes('diepvries') || ingredient_lower.includes('bevroren') ||
      ingredient_lower.includes('ijs')) {
    return 'Diepvries';
  }
  
  return 'Overig';
}

export default shoppingRoute;