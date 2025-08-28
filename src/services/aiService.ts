import { AiPrompt, AiResponse } from '../../../shared/src/types';

// Use local network IP for Expo development, localhost for production
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.238:3000/api/v1'  // Your local network IP
  : 'http://localhost:3000/api/v1';

export interface MealRecommendation {
  id: string;
  name: string;
  description: string;
  reason: string;
  prepTime: number;
  difficulty: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  sportsFriendly: boolean;
}

export interface NutritionAdvice {
  advice: string;
  recommendations: MealRecommendation[];
  reasoning: string;
  goals: {
    calories?: number;
    protein?: number;
    fiber?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: MealRecommendation[];
}

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get AI-powered meal recommendations based on current nutrition status
   */
  async getMealRecommendations(params: {
    currentNutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
    targets: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
    preferences?: string[];
    calendarEvents?: any[];
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }): Promise<MealRecommendation[]> {
    try {
      const prompt: AiPrompt = {
        type: 'meal_planning',
        context: {
          calendar_events: params.calendarEvents || [],
          user_preferences: {
            dietary: params.preferences || [],
            nutrition_goals: params.targets,
            current_nutrition: params.currentNutrition
          },
          current_date: new Date(),
          location: 'Netherlands'
        },
        user_input: this.buildMealRecommendationPrompt(params)
      };

      console.log('Fetching AI recommendations from:', `${this.baseUrl}/ai/suggestions`);
      console.log('Request payload:', JSON.stringify(prompt, null, 2));
      
      const response = await fetch(`${this.baseUrl}/ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`AI Service error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('AI Response data:', data);
      return this.parseMealRecommendations(data.data.suggestions);
    } catch (error) {
      console.error('Failed to get meal recommendations:', error);
      console.error('Error details:', error.message);
      
      // Show user-friendly message about Ollama
      if (error.message.includes('AI services temporarily unavailable')) {
        console.log('AI services unavailable - using enhanced fallback recommendations');
      }
      
      return this.getEnhancedFallbackRecommendations(params);
    }
  }

  /**
   * Chat with AI for personalized nutrition advice
   */
  async chatNutritionAdvice(
    message: string,
    context: {
      currentNutrition: any;
      targets: any;
      recentMeals?: any[];
      preferences?: string[];
    }
  ): Promise<ChatMessage> {
    try {
      const prompt: AiPrompt = {
        type: 'meal_planning',
        context: {
          calendar_events: [],
          user_preferences: {
            dietary: context.preferences || [],
            nutrition_goals: context.targets,
            current_nutrition: context.currentNutrition,
            recent_meals: context.recentMeals || []
          },
          current_date: new Date(),
          location: 'Netherlands'
        },
        user_input: `Nutrition consultation: ${message}. Please provide personalized advice and specific meal suggestions.`
      };

      const response = await fetch(`${this.baseUrl}/ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        throw new Error(`AI Service error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.data;

      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: aiResponse.reasoning || 'Hier zijn mijn aanbevelingen voor je voeding:',
        timestamp: new Date(),
        recommendations: this.parseMealRecommendations(aiResponse.suggestions)
      };
    } catch (error) {
      console.error('Failed to get nutrition advice:', error);
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, ik kan momenteel geen voedingsadvies geven. Probeer het later opnieuw.',
        timestamp: new Date(),
        recommendations: []
      };
    }
  }

  /**
   * Get quick meal suggestions based on calendar events
   */
  async getQuickMealSuggestions(calendarEvents: any[]): Promise<MealRecommendation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/quick-meal-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendar_events: calendarEvents,
          dietary_preferences: []
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Service error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseMealRecommendations(data.data.suggestions);
    } catch (error) {
      console.error('Failed to get quick meal suggestions:', error);
      return [];
    }
  }

  /**
   * Check AI service status
   */
  async getServiceStatus(): Promise<{
    ollama: boolean;
    claude: boolean;
    strategy: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/status`);
      if (!response.ok) {
        throw new Error('Failed to check AI status');
      }

      const data = await response.json();
      return {
        ollama: data.data.ollama.available,
        claude: data.data.claude.available,
        strategy: data.data.strategy
      };
    } catch (error) {
      console.error('Failed to check AI service status:', error);
      return {
        ollama: false,
        claude: false,
        strategy: 'offline'
      };
    }
  }

  private buildMealRecommendationPrompt(params: any): string {
    const deficit = {
      calories: params.targets.calories - params.currentNutrition.calories,
      protein: params.targets.protein - params.currentNutrition.protein,
      carbs: params.targets.carbs - params.currentNutrition.carbs,
      fat: params.targets.fat - params.currentNutrition.fat,
      fiber: (params.targets.fiber || 30) - (params.currentNutrition.fiber || 0)
    };

    let prompt = `Ik heb vandaag al ${params.currentNutrition.calories} calorieën gehad van mijn ${params.targets.calories} calorie doel. `;
    prompt += `Ik heb nog ${deficit.calories} calorieën, ${deficit.protein}g eiwit, ${deficit.carbs}g koolhydraten, en ${deficit.fat}g vet nodig. `;
    
    if (deficit.fiber > 0) {
      prompt += `Ook zou ik nog ${deficit.fiber}g vezels moeten hebben. `;
    }

    if (params.mealType) {
      prompt += `Geef me aanbevelingen voor ${params.mealType === 'breakfast' ? 'ontbijt' : params.mealType === 'lunch' ? 'lunch' : params.mealType === 'dinner' ? 'diner' : 'tussendoortje'}. `;
    }

    prompt += `Geef specifieke recepten met ingrediënten en voedingswaarden die passen bij Nederlandse maaltijdpatronen.`;

    return prompt;
  }

  private parseMealRecommendations(suggestions: any[]): MealRecommendation[] {
    const recommendations: MealRecommendation[] = [];

    suggestions.forEach((suggestion, index) => {
      if (suggestion.meal || suggestion.recipe_name) {
        const recommendation: MealRecommendation = {
          id: `ai-${Date.now()}-${index}`,
          name: suggestion.recipe_name || suggestion.meal || 'Maaltijdvoorstel',
          description: suggestion.reasoning || suggestion.advice || 'AI-gegenereerd voorstel',
          reason: suggestion.reasoning || 'Aanbevolen door AI',
          prepTime: suggestion.prep_time || this.estimatePrepTime(suggestion.recipe_name),
          difficulty: this.estimateDifficulty(suggestion.recipe_name),
          calories: suggestion.calories || this.estimateCalories(suggestion.recipe_name),
          protein: suggestion.protein || this.estimateProtein(suggestion.recipe_name),
          carbs: suggestion.carbs || this.estimateCarbs(suggestion.recipe_name),
          fat: suggestion.fat || this.estimateFat(suggestion.recipe_name),
          ingredients: suggestion.ingredients || this.getDefaultIngredients(suggestion.recipe_name),
          instructions: suggestion.instructions || ['Bereid volgens traditionele Nederlandse wijze'],
          tags: ['AI-aanbeveling', 'personalized'],
          mealType: this.determineMealType(suggestion.meal || suggestion.recipe_name),
          sportsFriendly: this.isSportsFriendly(suggestion.recipe_name || suggestion.advice)
        };

        recommendations.push(recommendation);
      }
    });

    return recommendations;
  }

  private getEnhancedFallbackRecommendations(params: any): MealRecommendation[] {
    const deficit = {
      calories: params.targets.calories - params.currentNutrition.calories,
      protein: params.targets.protein - params.currentNutrition.protein,
      carbs: params.targets.carbs - params.currentNutrition.carbs,
      fat: params.targets.fat - params.currentNutrition.fat,
      fiber: (params.targets.fiber || 30) - (params.currentNutrition.fiber || 0)
    };

    // Smart recommendations based on nutritional needs
    const recommendations: MealRecommendation[] = [];

    if (deficit.protein > 20) {
      recommendations.push({
        id: 'fallback-protein-1',
        name: 'Kipfilet met Quinoa',
        description: 'Hoge eiwit maaltijd met magere kipfilet en quinoa',
        reason: `Je hebt nog ${Math.round(deficit.protein)}g eiwit nodig vandaag`,
        prepTime: 20,
        difficulty: 2,
        calories: Math.min(deficit.calories, 450),
        protein: 35,
        carbs: 40,
        fat: 8,
        ingredients: ['kipfilet', 'quinoa', 'broccoli', 'olijfolie'],
        instructions: ['Grill kipfilet', 'Kook quinoa', 'Stoom broccoli'],
        tags: ['hoog eiwit', 'magere keuze'],
        mealType: params.mealType || 'lunch',
        sportsFriendly: true
      });
    }

    if (deficit.fiber > 15) {
      recommendations.push({
        id: 'fallback-fiber-1',
        name: 'Volkoren Wrap met Bonen',
        description: 'Vezelrijke wrap met zwarte bonen en groenten',
        reason: `Goede bron van vezels (${Math.round(deficit.fiber)}g tekort)`,
        prepTime: 10,
        difficulty: 1,
        calories: Math.min(deficit.calories, 380),
        protein: 15,
        carbs: 55,
        fat: 12,
        ingredients: ['volkoren wrap', 'zwarte bonen', 'paprika', 'avocado'],
        instructions: ['Verwarm wrap', 'Voeg bonen toe', 'Rol met groenten'],
        tags: ['hoge vezels', 'vegetarisch'],
        mealType: params.mealType || 'lunch',
        sportsFriendly: false
      });
    }

    if (deficit.calories > 500) {
      recommendations.push({
        id: 'fallback-energy-1',
        name: 'Nederlandse Stamppot',
        description: 'Traditionele Nederlandse stamppot met worst',
        reason: `Energierijke maaltijd voor je resterende ${Math.round(deficit.calories)} calorieën`,
        prepTime: 30,
        difficulty: 2,
        calories: Math.min(deficit.calories, 550),
        protein: 22,
        carbs: 65,
        fat: 18,
        ingredients: ['aardappelen', 'boerenkool', 'rookworst', 'ui'],
        instructions: ['Kook aardappelen', 'Stamp met boerenkool', 'Voeg worst toe'],
        tags: ['traditioneel', 'winters', 'verzadigend'],
        mealType: 'dinner',
        sportsFriendly: false
      });
    }

    // Always include at least one recommendation
    if (recommendations.length === 0) {
      return this.getFallbackMealRecommendations(params.mealType);
    }

    return recommendations;
  }

  private getFallbackMealRecommendations(mealType?: string): MealRecommendation[] {
    const fallbacks: { [key: string]: MealRecommendation[] } = {
      breakfast: [{
        id: 'fallback-breakfast-1',
        name: 'Havermout met Fruit',
        description: 'Voedzame havermout met seizoensfruit en noten',
        reason: 'Hoge vezels en langzame koolhydraten voor stabiele energie',
        prepTime: 5,
        difficulty: 1,
        calories: 340,
        protein: 12,
        carbs: 52,
        fat: 8,
        ingredients: ['havermout', 'melk', 'banaan', 'walnoten', 'honing'],
        instructions: ['Kook havermout met melk', 'Voeg fruit toe', 'Garneer met noten'],
        tags: ['vezels', 'gezond', 'snel'],
        mealType: 'breakfast',
        sportsFriendly: true
      }],
      lunch: [{
        id: 'fallback-lunch-1',
        name: 'Volkoren Sandwich met Ei',
        description: 'Protein-rijke lunch met volkoren brood',
        reason: 'Goede balans van eiwitten en complexe koolhydraten',
        prepTime: 10,
        difficulty: 1,
        calories: 380,
        protein: 18,
        carbs: 35,
        fat: 16,
        ingredients: ['volkoren brood', 'ei', 'avocado', 'tomaat', 'rucola'],
        instructions: ['Toast brood', 'Bakje ei', 'Beleg met groenten'],
        tags: ['eiwit', 'verzadigend'],
        mealType: 'lunch',
        sportsFriendly: true
      }],
      dinner: [{
        id: 'fallback-dinner-1',
        name: 'Zalm met Zoete Aardappel',
        description: 'Omega-3 rijke zalm met gepofte zoete aardappel',
        reason: 'Hoog in omega-3 en complexe koolhydraten',
        prepTime: 25,
        difficulty: 2,
        calories: 450,
        protein: 35,
        carbs: 38,
        fat: 18,
        ingredients: ['zalm filet', 'zoete aardappel', 'broccoli', 'olijfolie', 'citroen'],
        instructions: ['Grill zalm', 'Bak zoete aardappel', 'Stoom broccoli'],
        tags: ['omega-3', 'gezond'],
        mealType: 'dinner',
        sportsFriendly: true
      }]
    };

    return fallbacks[mealType || 'lunch'] || fallbacks.lunch;
  }

  private estimatePrepTime(recipeName?: string): number {
    if (!recipeName) return 15;
    const name = recipeName.toLowerCase();
    if (name.includes('smoothie') || name.includes('yoghurt')) return 5;
    if (name.includes('salad') || name.includes('sandwich')) return 10;
    if (name.includes('soup') || name.includes('stew')) return 45;
    return 20;
  }

  private estimateDifficulty(recipeName?: string): number {
    if (!recipeName) return 2;
    const name = recipeName.toLowerCase();
    if (name.includes('smoothie') || name.includes('yoghurt')) return 1;
    if (name.includes('roast') || name.includes('stew')) return 3;
    return 2;
  }

  private estimateCalories(recipeName?: string): number {
    if (!recipeName) return 300;
    const name = recipeName.toLowerCase();
    if (name.includes('salad')) return 250;
    if (name.includes('smoothie')) return 200;
    if (name.includes('soup')) return 300;
    return 400;
  }

  private estimateProtein(recipeName?: string): number {
    if (!recipeName) return 15;
    const name = recipeName.toLowerCase();
    if (name.includes('chicken') || name.includes('fish') || name.includes('meat')) return 25;
    if (name.includes('egg')) return 20;
    if (name.includes('yoghurt')) return 12;
    return 15;
  }

  private estimateCarbs(recipeName?: string): number {
    if (!recipeName) return 30;
    const name = recipeName.toLowerCase();
    if (name.includes('salad')) return 15;
    if (name.includes('bread') || name.includes('pasta')) return 45;
    return 30;
  }

  private estimateFat(recipeName?: string): number {
    if (!recipeName) return 12;
    const name = recipeName.toLowerCase();
    if (name.includes('avocado') || name.includes('nuts')) return 18;
    if (name.includes('salmon') || name.includes('fish')) return 15;
    return 12;
  }

  private getDefaultIngredients(recipeName?: string): string[] {
    if (!recipeName) return ['diverse ingrediënten'];
    // Could be enhanced with more intelligent ingredient suggestions
    return ['hoofdingrediënt', 'groenten', 'kruiden', 'olie'];
  }

  private determineMealType(name?: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    if (!name) return 'lunch';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('breakfast') || lowerName.includes('ontbijt')) return 'breakfast';
    if (lowerName.includes('dinner') || lowerName.includes('diner')) return 'dinner';
    if (lowerName.includes('snack') || lowerName.includes('tussendoortje')) return 'snack';
    return 'lunch';
  }

  private isSportsFriendly(name?: string): boolean {
    if (!name) return false;
    const lowerName = name.toLowerCase();
    return lowerName.includes('protein') || lowerName.includes('recovery') || lowerName.includes('energy');
  }
}

export const aiService = new AIService();