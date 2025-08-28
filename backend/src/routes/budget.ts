import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../database/connection';
import { expenses } from '../database/schema';
import { eq, gte, lte, desc, sum, sql } from 'drizzle-orm';

const budgetRoute: FastifyPluginAsync = async (fastify) => {
  const CreateExpenseSchema = z.object({
    user_id: z.number(),
    amount: z.number().positive(), // Amount in cents
    category: z.enum(['groceries', 'dining', 'household', 'utilities', 'transport', 'entertainment', 'other']),
    description: z.string().optional(),
    date: z.string().transform((str) => new Date(str)),
    receipt_image_url: z.string().optional(),
  });

  // Get all expenses for a user
  fastify.get<{ 
    Querystring: { 
      user_id: string;
      start_date?: string;
      end_date?: string;
      category?: string;
    } 
  }>('/expenses', async (request, reply) => {
    try {
      const { user_id, start_date, end_date, category } = request.query;
      
      if (!user_id) {
        return reply.status(400).send({
          success: false,
          error: 'user_id is required',
        });
      }

      let query = db.select().from(expenses).where(eq(expenses.user_id, parseInt(user_id)));

      if (start_date) {
        query = query.where(gte(expenses.date, new Date(start_date)));
      }

      if (end_date) {
        query = query.where(lte(expenses.date, new Date(end_date)));
      }

      if (category) {
        query = query.where(eq(expenses.category, category as any));
      }

      const userExpenses = await query.orderBy(desc(expenses.date));

      return { success: true, data: userExpenses };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch expenses',
      });
    }
  });

  // Create new expense
  fastify.post<{ Body: z.infer<typeof CreateExpenseSchema> }>('/expenses', {
    schema: {
      body: {
        type: 'object',
        required: ['user_id', 'amount', 'category', 'date'],
        properties: {
          user_id: { type: 'number' },
          amount: { type: 'number', minimum: 0 },
          category: { 
            type: 'string', 
            enum: ['groceries', 'dining', 'household', 'utilities', 'transport', 'entertainment', 'other'] 
          },
          description: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          receipt_image_url: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const newExpense = await db
        .insert(expenses)
        .values({
          ...request.body,
          date: new Date(request.body.date),
        })
        .returning();

      return reply.status(201).send({
        success: true,
        data: newExpense[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create expense',
      });
    }
  });

  // Get expense analytics/summary
  fastify.get<{ 
    Querystring: { 
      user_id: string;
      period?: 'week' | 'month' | 'year';
    } 
  }>('/analytics', async (request, reply) => {
    try {
      const { user_id, period = 'month' } = request.query;
      
      if (!user_id) {
        return reply.status(400).send({
          success: false,
          error: 'user_id is required',
        });
      }

      const userId = parseInt(user_id);
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      // Total spending by category
      const categoryTotals = await db
        .select({
          category: expenses.category,
          total: sum(expenses.amount).as('total'),
        })
        .from(expenses)
        .where(eq(expenses.user_id, userId))
        .where(gte(expenses.date, startDate))
        .groupBy(expenses.category);

      // Total spending for period
      const totalSpending = await db
        .select({
          total: sum(expenses.amount).as('total'),
        })
        .from(expenses)
        .where(eq(expenses.user_id, userId))
        .where(gte(expenses.date, startDate));

      // Daily spending trend (last 30 days)
      const dailySpending = await db
        .select({
          date: sql<string>`DATE(${expenses.date})`,
          total: sum(expenses.amount).as('total'),
        })
        .from(expenses)
        .where(eq(expenses.user_id, userId))
        .where(gte(expenses.date, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)))
        .groupBy(sql`DATE(${expenses.date})`)
        .orderBy(sql`DATE(${expenses.date})`);

      return {
        success: true,
        data: {
          period,
          totalSpending: totalSpending[0]?.total || 0,
          categoryBreakdown: categoryTotals,
          dailyTrend: dailySpending,
          currency: 'EUR',
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate analytics',
      });
    }
  });

  // Update expense
  fastify.put<{ 
    Params: { id: string };
    Body: Partial<z.infer<typeof CreateExpenseSchema>>;
  }>('/expenses/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid expense ID',
        });
      }

      const updatedExpense = await db
        .update(expenses)
        .set(request.body)
        .where(eq(expenses.id, id))
        .returning();

      if (updatedExpense.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Expense not found',
        });
      }

      return { success: true, data: updatedExpense[0] };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update expense',
      });
    }
  });

  // Delete expense
  fastify.delete<{ Params: { id: string } }>('/expenses/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid expense ID',
        });
      }

      const deletedExpense = await db
        .delete(expenses)
        .where(eq(expenses.id, id))
        .returning();

      if (deletedExpense.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Expense not found',
        });
      }

      return { success: true, message: 'Expense deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete expense',
      });
    }
  });
};

export default budgetRoute;