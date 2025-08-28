import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Recipe types
export const IngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string().optional(),
});

export const RecipeSchema = z.object({
  id: z.number(),
  name: z.string(),
  ingredients: z.array(IngredientSchema),
  instructions: z.string(),
  tags: z.array(z.string()),
  prep_time_minutes: z.number().optional(),
  difficulty: z.number().min(1).max(5).default(1),
  meal_type: z.enum(['quick', 'recovery', 'family', 'prep']).optional(),
  sports_friendly: z.boolean().default(false),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;

// Calendar event types
export const CalendarEventSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  external_id: z.string().optional(),
  provider: z.enum(['google', 'apple', 'outlook', 'manual']),
  title: z.string(),
  start_time: z.date(),
  end_time: z.date(),
  event_type: z.enum(['work', 'sport', 'personal', 'meal']),
  location: z.string().optional(),
  is_all_day: z.boolean().default(false),
  synced_at: z.date(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// Shopping list types
export const ShoppingItemSchema = z.object({
  id: z.number(),
  list_id: z.number(),
  name: z.string(),
  quantity: z.string().optional(),
  category: z.string().optional(),
  purchased: z.boolean().default(false),
  estimated_price: z.number().optional(),
});

export const ShoppingListSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  items: z.array(ShoppingItemSchema).optional(),
});

export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
export type ShoppingList = z.infer<typeof ShoppingListSchema>;

// Budget/Expense types
export const ExpenseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  amount: z.number(),
  category: z.enum(['groceries', 'dining', 'household', 'utilities', 'transport', 'entertainment', 'other']),
  description: z.string().optional(),
  date: z.date(),
  receipt_image_url: z.string().optional(),
  created_at: z.date(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

// Cleaning task types
export const CleaningTaskSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'seasonal']),
  estimated_duration_minutes: z.number(),
  room: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  last_completed: z.date().optional(),
  next_due: z.date(),
  completed: z.boolean().default(false),
  created_at: z.date(),
});

export type CleaningTask = z.infer<typeof CleaningTaskSchema>;

// API Request/Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// AI service types
export const AiPromptSchema = z.object({
  type: z.enum(['meal_planning', 'shopping_optimization', 'budget_analysis', 'cleaning_schedule']),
  context: z.object({
    calendar_events: z.array(CalendarEventSchema).optional(),
    user_preferences: z.record(z.any()).optional(),
    current_date: z.date(),
    location: z.string().default('Netherlands'),
  }),
  user_input: z.string(),
});

export type AiPrompt = z.infer<typeof AiPromptSchema>;

export const AiResponseSchema = z.object({
  type: z.string(),
  suggestions: z.array(z.any()),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type AiResponse = z.infer<typeof AiResponseSchema>;