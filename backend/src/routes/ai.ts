import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AiPromptSchema } from '../../../shared/src/types';
import { OllamaService } from '../ai/ollama-service';

const aiRoute: FastifyPluginAsync = async (fastify) => {
  const ollamaService = new OllamaService();

  // Generate AI suggestions using Ollama
  fastify.post<{ Body: z.infer<typeof AiPromptSchema> }>('/suggestions', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'context', 'user_input'],
        properties: {
          type: { 
            type: 'string', 
            enum: ['meal_planning', 'shopping_optimization', 'budget_analysis', 'cleaning_schedule'] 
          },
          context: {
            type: 'object',
            required: ['current_date'],
            properties: {
              calendar_events: { type: 'array' },
              user_preferences: { type: 'object' },
              current_date: { type: 'string', format: 'date-time' },
              location: { type: 'string' }
            }
          },
          user_input: { type: 'string' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const prompt = {
        ...request.body,
        context: {
          ...request.body.context,
          current_date: new Date(request.body.context.current_date),
        },
      };
      
      // Check if Ollama is available
      const isOllamaHealthy = await ollamaService.checkHealth();
      
      if (isOllamaHealthy) {
        fastify.log.info('Using Ollama for AI suggestions');
        const response = await ollamaService.generateSuggestions(prompt);
        return reply.send({
          success: true,
          data: { ...response, provider: 'ollama' },
        });
      } else {
        fastify.log.error('Ollama service unavailable');
        return reply.status(503).send({
          success: false,
          error: 'AI service temporarily unavailable',
          fallback_suggestions: getFallbackSuggestions(request.body.type),
        });
      }

    } catch (error) {
      fastify.log.error('Ollama service failed:', error);
      return reply.status(503).send({
        success: false,
        error: 'AI service temporarily unavailable',
        fallback_suggestions: getFallbackSuggestions(request.body.type),
      });
    }
  });

  // Get AI service status
  fastify.get('/status', async (request, reply) => {
    try {
      const ollamaHealthy = await ollamaService.checkHealth();

      return {
        success: true,
        data: {
          ollama: {
            available: ollamaHealthy,
            url: process.env.OLLAMA_URL || 'http://localhost:11434',
          },
          strategy: 'local-only (Ollama)',
        },
      };
    } catch (error) {
      fastify.log.error('Failed to check AI service status:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to check AI service status',
      });
    }
  });

  // Quick meal suggestions based on calendar
  fastify.post<{ 
    Body: { 
      calendar_events: any[];
      dietary_preferences?: string[];
    } 
  }>('/quick-meal-suggestions', async (request, reply) => {
    try {
      const { calendar_events, dietary_preferences = [] } = request.body;
      
      const prompt = {
        type: 'meal_planning' as const,
        context: {
          calendar_events,
          user_preferences: { dietary: dietary_preferences },
          current_date: new Date(),
          location: 'Netherlands',
        },
        user_input: 'Suggest meals that fit my schedule for today',
      };

      const isOllamaHealthy = await ollamaService.checkHealth();
      
      if (!isOllamaHealthy) {
        throw new Error('Ollama service unavailable');
      }
      
      const response = await ollamaService.generateSuggestions(prompt);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      fastify.log.error('Quick meal suggestions failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate meal suggestions',
      });
    }
  });
};


function getFallbackSuggestions(type: string): any[] {
  const fallbacks = {
    meal_planning: [
      {
        meal: 'lunch',
        recipe_name: 'Dutch Broodjes',
        reasoning: 'Quick and traditional Dutch lunch option',
        prep_time: 10,
      },
      {
        meal: 'dinner',
        recipe_name: 'Stamppot',
        reasoning: 'Classic Dutch comfort food for dinner',
        prep_time: 30,
      },
    ],
    shopping_optimization: [
      {
        item: 'Seasonal vegetables',
        advice: 'Check local seasonal produce for best prices',
        category: 'groceries',
      },
      {
        item: 'Store brands',
        advice: 'AH Basic products offer good value',
        category: 'groceries',
      },
    ],
    budget_analysis: [
      {
        category: 'groceries',
        advice: 'Track weekly spending and compare with Dutch averages',
      },
    ],
    cleaning_schedule: [
      {
        task: 'Weekly cleaning',
        advice: 'Plan cleaning around your schedule for consistency',
      },
    ],
  };

  return fallbacks[type as keyof typeof fallbacks] || [
    { advice: 'AI services temporarily unavailable. Please try again later.' }
  ];
}

export default aiRoute;