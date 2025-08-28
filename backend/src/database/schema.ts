import { pgTable, serial, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Recipes table
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ingredients: jsonb('ingredients').notNull(), // JSON array of ingredients
  instructions: text('instructions').notNull(),
  tags: text('tags').array(),
  prep_time_minutes: integer('prep_time_minutes'),
  difficulty: integer('difficulty').default(1).notNull(), // 1-5 scale
  meal_type: varchar('meal_type', { length: 50 }), // quick, recovery, family, prep
  sports_friendly: boolean('sports_friendly').default(false).notNull(),
  season: varchar('season', { length: 20 }), // spring, summer, autumn, winter
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Calendar events table
export const calendar_events = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  external_id: varchar('external_id', { length: 255 }), // Provider's event ID
  provider: varchar('provider', { length: 50 }).notNull(), // google, apple, outlook, manual
  title: varchar('title', { length: 255 }).notNull(),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  event_type: varchar('event_type', { length: 50 }).notNull(), // work, sport, personal, meal
  location: varchar('location', { length: 255 }),
  is_all_day: boolean('is_all_day').default(false).notNull(),
  synced_at: timestamp('synced_at').defaultNow().notNull(),
});

// Shopping lists table
export const shopping_lists = pgTable('shopping_lists', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Shopping items table
export const shopping_items = pgTable('shopping_items', {
  id: serial('id').primaryKey(),
  list_id: integer('list_id').references(() => shopping_lists.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: varchar('quantity', { length: 100 }),
  category: varchar('category', { length: 100 }),
  purchased: boolean('purchased').default(false).notNull(),
  estimated_price: integer('estimated_price'), // Price in cents
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(), // Amount in cents
  category: varchar('category', { length: 50 }).notNull(), // groceries, dining, household, etc.
  description: varchar('description', { length: 500 }),
  date: timestamp('date').notNull(),
  receipt_image_url: varchar('receipt_image_url', { length: 500 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User meals/diary table for logging daily meals
export const user_meals = pgTable('user_meals', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  recipe_id: integer('recipe_id').references(() => recipes.id), // Optional link to existing recipe
  meal_name: varchar('meal_name', { length: 255 }).notNull(),
  meal_type: varchar('meal_type', { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
  ingredients: jsonb('ingredients').notNull(), // JSON array of ingredients with amounts
  nutrition: jsonb('nutrition'), // calories, protein, carbs, fat, fiber
  portion_size: varchar('portion_size', { length: 100 }), // "1 serving", "250g", etc.
  notes: text('notes'), // User notes about the meal
  logged_at: timestamp('logged_at').notNull(), // When they ate it
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Cleaning tasks table
export const cleaning_tasks = pgTable('cleaning_tasks', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 20 }).notNull(), // daily, weekly, bi-weekly, monthly, seasonal
  estimated_duration_minutes: integer('estimated_duration_minutes').notNull(),
  room: varchar('room', { length: 100 }),
  priority: varchar('priority', { length: 10 }).default('medium').notNull(), // low, medium, high
  last_completed: timestamp('last_completed'),
  next_due: timestamp('next_due').notNull(),
  completed: boolean('completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  calendar_events: many(calendar_events),
  shopping_lists: many(shopping_lists),
  expenses: many(expenses),
  cleaning_tasks: many(cleaning_tasks),
  user_meals: many(user_meals),
}));

export const calendar_eventsRelations = relations(calendar_events, ({ one }) => ({
  user: one(users, {
    fields: [calendar_events.user_id],
    references: [users.id],
  }),
}));

export const shopping_listsRelations = relations(shopping_lists, ({ one, many }) => ({
  user: one(users, {
    fields: [shopping_lists.user_id],
    references: [users.id],
  }),
  items: many(shopping_items),
}));

export const shopping_itemsRelations = relations(shopping_items, ({ one }) => ({
  list: one(shopping_lists, {
    fields: [shopping_items.list_id],
    references: [shopping_lists.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.user_id],
    references: [users.id],
  }),
}));

export const cleaning_tasksRelations = relations(cleaning_tasks, ({ one }) => ({
  user: one(users, {
    fields: [cleaning_tasks.user_id],
    references: [users.id],
  }),
}));

export const user_mealsRelations = relations(user_meals, ({ one }) => ({
  user: one(users, {
    fields: [user_meals.user_id],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [user_meals.recipe_id],
    references: [recipes.id],
  }),
}));