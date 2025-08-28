import { AiPrompt, AiResponse } from '../../../shared/src/types';

export class OllamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async generateSuggestions(prompt: AiPrompt): Promise<AiResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(prompt.type);
      const userPrompt = this.buildUserPrompt(prompt);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2:latest',
          prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
          stream: false,
          options: {
            temperature: 0.7,
            max_tokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseOllamaResponse(data.response, prompt.type);
    } catch (error) {
      console.error('Ollama API error:', error);
      throw new Error('Failed to generate AI suggestions with local LLM');
    }
  }

  private buildSystemPrompt(type: AiPrompt['type']): string {
    const basePrompt = `You are a helpful nutrition and meal planning assistant. Provide practical, actionable advice focused on filling nutrition gaps and improving meal variety.`;

    switch (type) {
      case 'meal_planning':
        return `${basePrompt} Help with meal planning by suggesting foods that complement what the user has already eaten. Focus on nutrition balance, food variety, and practical meal ideas. Suggest specific ingredients and portion sizes.`;

      case 'shopping_optimization':
        return `${basePrompt} Help optimize shopping lists based on meal plans and nutrition goals. Provide practical advice on what to buy and how to save money.`;

      case 'budget_analysis':
        return `${basePrompt} Analyze spending patterns and provide budget advice for healthy eating within budget constraints.`;

      case 'cleaning_schedule':
        return `${basePrompt} Create practical cleaning schedules that work with busy lifestyles.`;

      default:
        return basePrompt;
    }
  }

  private buildUserPrompt(prompt: AiPrompt): string {
    const { context, user_input } = prompt;
    
    let contextStr = `Current date: ${context.current_date.toLocaleDateString('nl-NL')}\n`;
    contextStr += `Location: ${context.location}\n`;

    // Add nutrition context if available
    if (context.user_preferences?.current_nutrition) {
      const current = context.user_preferences.current_nutrition;
      const goals = context.user_preferences.nutrition_goals;
      contextStr += `\nNutrition today: ${current.calories || 0} kcal, ${current.protein || 0}g protein, ${current.carbs || 0}g carbs, ${current.fat || 0}g fat\n`;
      if (goals) {
        contextStr += `Daily goals: ${goals.calories || 2200} kcal, ${goals.protein || 150}g protein, ${goals.carbs || 250}g carbs, ${goals.fat || 80}g fat\n`;
        
        // Calculate gaps
        const calorieGap = (goals.calories || 2200) - (current.calories || 0);
        const proteinGap = (goals.protein || 150) - (current.protein || 0);
        const carbGap = (goals.carbs || 250) - (current.carbs || 0);
        const fatGap = (goals.fat || 80) - (current.fat || 0);
        
        contextStr += `Remaining today: ${Math.max(0, calorieGap)} kcal, ${Math.max(0, proteinGap)}g protein, ${Math.max(0, carbGap)}g carbs, ${Math.max(0, fatGap)}g fat\n`;
      }
    }

    // Add today's meals for context
    if (context.user_preferences?.meals_today) {
      contextStr += `\nMeals already eaten today:\n`;
      context.user_preferences.meals_today.forEach((meal: string) => {
        contextStr += `- ${meal}\n`;
      });
    }

    if (context.calendar_events && context.calendar_events.length > 0) {
      contextStr += `\nUpcoming calendar events:\n`;
      context.calendar_events.forEach(event => {
        contextStr += `- ${event.title} at ${event.start_time.toLocaleString('nl-NL')} (${event.event_type})\n`;
      });
    }

    if (context.user_preferences?.dietary) {
      contextStr += `\nDietary preferences: ${context.user_preferences.dietary.join(', ')}\n`;
    }

    return `${contextStr}\nUser request: ${user_input}\n\nFocus on practical meal suggestions that fill nutrition gaps. Be specific about ingredients and portions. Keep suggestions simple and achievable.`;
  }

  private parseOllamaResponse(response: string, type: AiPrompt['type']): AiResponse {
    // Simple parsing for Ollama responses (less structured than Claude)
    const suggestions = this.extractSuggestions(response, type);
    
    return {
      type,
      suggestions,
      reasoning: this.extractReasoning(response),
      confidence: 0.7, // Lower confidence for local LLM
    };
  }

  private extractSuggestions(response: string, type: AiPrompt['type']): any[] {
    // Simple extraction based on bullet points or numbered lists
    const lines = response.split('\n').filter(line => line.trim());
    const suggestions: any[] = [];

    switch (type) {
      case 'meal_planning':
        lines.forEach(line => {
          if (line.match(/^\d+\.|^-|^\*/)) {
            const suggestion = {
              meal: this.extractMealType(line),
              recipe_name: this.extractRecipeName(line),
              reasoning: line.trim(),
            };
            if (suggestion.recipe_name) {
              suggestions.push(suggestion);
            }
          }
        });
        break;

      case 'shopping_optimization':
        lines.forEach(line => {
          if (line.match(/^\d+\.|^-|^\*/)) {
            suggestions.push({
              item: this.extractItemName(line),
              advice: line.trim(),
            });
          }
        });
        break;

      case 'budget_analysis':
        lines.forEach(line => {
          if (line.match(/^\d+\.|^-|^\*/)) {
            suggestions.push({
              category: this.extractCategory(line),
              advice: line.trim(),
            });
          }
        });
        break;

      case 'cleaning_schedule':
        lines.forEach(line => {
          if (line.match(/^\d+\.|^-|^\*/)) {
            suggestions.push({
              task: this.extractTaskName(line),
              advice: line.trim(),
            });
          }
        });
        break;

      default:
        suggestions.push({ advice: response });
    }

    return suggestions.length > 0 ? suggestions : [{ advice: response }];
  }

  private extractReasoning(response: string): string {
    // Extract the first paragraph as reasoning
    const paragraphs = response.split('\n\n');
    return paragraphs[0] || 'Local AI analysis completed';
  }

  private extractMealType(line: string): string {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    for (const meal of mealTypes) {
      if (line.toLowerCase().includes(meal)) {
        return meal;
      }
    }
    return 'meal';
  }

  private extractRecipeName(line: string): string | null {
    // Try to extract recipe name from common patterns
    const patterns = [
      /recipe:?\s*([^,.\n]+)/i,
      /make\s+([^,.\n]+)/i,
      /try\s+([^,.\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractItemName(line: string): string {
    // Extract the first meaningful word as item name
    const cleaned = line.replace(/^\d+\.|^-|^\*/, '').trim();
    const words = cleaned.split(' ');
    return words[0] || 'item';
  }

  private extractCategory(line: string): string {
    const categories = ['groceries', 'utilities', 'transport', 'entertainment'];
    for (const category of categories) {
      if (line.toLowerCase().includes(category)) {
        return category;
      }
    }
    return 'general';
  }

  private extractTaskName(line: string): string {
    const cleaned = line.replace(/^\d+\.|^-|^\*/, '').trim();
    const words = cleaned.split(' ');
    return words.slice(0, 3).join(' ') || 'cleaning task';
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}