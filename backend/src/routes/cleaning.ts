import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../database/connection';
import { cleaning_tasks } from '../database/schema';
import { eq, lte, gte } from 'drizzle-orm';

const cleaningRoute: FastifyPluginAsync = async (fastify) => {
  const CreateCleaningTaskSchema = z.object({
    user_id: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'seasonal']),
    estimated_duration_minutes: z.number().positive(),
    room: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    next_due: z.string().transform((str) => new Date(str)),
  });

  // Get all cleaning tasks for a user
  fastify.get<{ 
    Querystring: { 
      user_id: string;
      status?: 'pending' | 'overdue' | 'completed' | 'all';
      room?: string;
    } 
  }>('/', async (request, reply) => {
    try {
      const { user_id, status = 'all', room } = request.query;
      
      if (!user_id) {
        return reply.status(400).send({
          success: false,
          error: 'user_id is required',
        });
      }

      let query = db.select().from(cleaning_tasks).where(eq(cleaning_tasks.user_id, parseInt(user_id)));

      const now = new Date();

      switch (status) {
        case 'pending':
          query = query.where(eq(cleaning_tasks.completed, false));
          query = query.where(gte(cleaning_tasks.next_due, now));
          break;
        case 'overdue':
          query = query.where(eq(cleaning_tasks.completed, false));
          query = query.where(lte(cleaning_tasks.next_due, now));
          break;
        case 'completed':
          query = query.where(eq(cleaning_tasks.completed, true));
          break;
      }

      if (room) {
        query = query.where(eq(cleaning_tasks.room, room));
      }

      const tasks = await query;

      return { success: true, data: tasks };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch cleaning tasks',
      });
    }
  });

  // Create new cleaning task
  fastify.post<{ Body: z.infer<typeof CreateCleaningTaskSchema> }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['user_id', 'title', 'frequency', 'estimated_duration_minutes', 'next_due'],
        properties: {
          user_id: { type: 'number' },
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          frequency: { 
            type: 'string', 
            enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'seasonal'] 
          },
          estimated_duration_minutes: { type: 'number', minimum: 1 },
          room: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          next_due: { type: 'string', format: 'date-time' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const newTask = await db
        .insert(cleaning_tasks)
        .values({
          ...request.body,
          next_due: new Date(request.body.next_due),
        })
        .returning();

      return reply.status(201).send({
        success: true,
        data: newTask[0],
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create cleaning task',
      });
    }
  });

  // Mark task as completed
  fastify.patch<{ 
    Params: { id: string };
    Body: { completed: boolean };
  }>('/:id/complete', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid task ID',
        });
      }

      const now = new Date();
      let nextDue: Date | null = null;

      if (request.body.completed) {
        // Calculate next due date based on frequency
        const task = await db.select().from(cleaning_tasks).where(eq(cleaning_tasks.id, id));
        
        if (task.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Task not found',
          });
        }

        const frequency = task[0].frequency;
        switch (frequency) {
          case 'daily':
            nextDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'bi-weekly':
            nextDue = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            nextDue = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            break;
          case 'seasonal':
            nextDue = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      const updatedTask = await db
        .update(cleaning_tasks)
        .set({
          completed: request.body.completed,
          last_completed: request.body.completed ? now : null,
          next_due: nextDue || (task.length > 0 ? task[0].next_due : now),
        })
        .where(eq(cleaning_tasks.id, id))
        .returning();

      if (updatedTask.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Task not found',
        });
      }

      return { success: true, data: updatedTask[0] };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update task',
      });
    }
  });

  // Get cleaning schedule/calendar view
  fastify.get<{ 
    Querystring: { 
      user_id: string;
      start_date: string;
      end_date: string;
    } 
  }>('/schedule', async (request, reply) => {
    try {
      const { user_id, start_date, end_date } = request.query;
      
      if (!user_id || !start_date || !end_date) {
        return reply.status(400).send({
          success: false,
          error: 'user_id, start_date, and end_date are required',
        });
      }

      const tasks = await db
        .select()
        .from(cleaning_tasks)
        .where(eq(cleaning_tasks.user_id, parseInt(user_id)))
        .where(gte(cleaning_tasks.next_due, new Date(start_date)))
        .where(lte(cleaning_tasks.next_due, new Date(end_date)));

      // Group tasks by date
      const schedule = tasks.reduce((acc, task) => {
        const date = task.next_due.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(task);
        return acc;
      }, {} as Record<string, typeof tasks>);

      return { success: true, data: schedule };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch cleaning schedule',
      });
    }
  });

  // Update cleaning task
  fastify.put<{ 
    Params: { id: string };
    Body: Partial<z.infer<typeof CreateCleaningTaskSchema>>;
  }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid task ID',
        });
      }

      const updatedTask = await db
        .update(cleaning_tasks)
        .set(request.body)
        .where(eq(cleaning_tasks.id, id))
        .returning();

      if (updatedTask.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Task not found',
        });
      }

      return { success: true, data: updatedTask[0] };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update task',
      });
    }
  });

  // Delete cleaning task
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid task ID',
        });
      }

      const deletedTask = await db
        .delete(cleaning_tasks)
        .where(eq(cleaning_tasks.id, id))
        .returning();

      if (deletedTask.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Task not found',
        });
      }

      return { success: true, message: 'Task deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete task',
      });
    }
  });
};

export default cleaningRoute;