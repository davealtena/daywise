# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Daywise - Personal Planning Mobile App

**Current Status**: Project specification and planning phase - implementation not yet started

## Project Description
A smart mobile AI assistant for household planning that adapts to your daily schedule:
- **Smart Meal Planning**: AI-powered recipes based on your calendar (quick meals before sports, nutritious options after workouts)
- **Calendar-Aware Shopping**: Automated shopping lists that consider your weekly schedule and commitments
- **Budget Intelligence**: Spending analysis with advice tailored to Dutch households
- **Dynamic Cleaning**: Flexible cleaning schedules that work around your appointments and activities
- **Seasonal Planning**: Dutch-specific seasonal tasks and maintenance reminders

## Tech Stack
- **Frontend**: React Native + Expo
- **Backend**: Node.js + Fastify 
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Local LLM via Ollama + Claude API (hybrid approach)
- **Deployment**: Kubernetes + CNPG
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **Styling**: NativeWind (Tailwind for React Native)

## Project Structure
```
home-assistant/
├── mobile/                 # React Native app (Expo)
│   ├── src/
│   │   ├── screens/        # App screens (Calendar, Meals, Shopping, Budget)
│   │   ├── components/     # Reusable components  
│   │   ├── services/       # API calls, calendar integration, AI services
│   │   ├── stores/         # Zustand state management
│   │   ├── types/          # TypeScript types
│   │   ├── integrations/   # Calendar providers (Google, Apple, Outlook)
│   │   └── utils/          # Helper functions, date utilities
│   ├── assets/             # Images, fonts
│   └── app.config.js       # Expo configuration
├── backend/                # Node.js API
│   ├── src/
│   │   ├── routes/         # API endpoints  
│   │   ├── services/       # Business logic
│   │   ├── database/       # Database schema & migrations
│   │   ├── ai/             # Claude integration
│   │   └── schedulers/     # Cron jobs
│   └── package.json
├── k8s/                    # Kubernetes base manifests
├── infrastructure/          # Local infrastructure configs
│   ├── ollama/             # Local LLM setup
│   ├── traefik/            # Reverse proxy configuration  
│   └── monitoring/         # Prometheus, Grafana
└── shared/                 # Shared types between mobile/backend
```

## Current Status
This repository contains only the project specification. No actual code has been implemented yet.

## Planned Commands (when implemented)
```bash
# Mobile App (React Native) - Not yet implemented
npm run start           # Start Expo development server
npm run android         # Run on Android emulator  
npm run ios             # Run on iOS simulator
npm run build:android   # Build Android APK
npm run build:ios       # Build iOS app
npm run test            # Run Jest tests

# Backend - Not yet implemented
npm run dev             # Start development server with hot reload
npm run build           # Build TypeScript to JavaScript
npm run start           # Start production server
npm run db:generate     # Generate database migrations
npm run db:migrate      # Run database migrations
npm run test            # Run Jest tests

# Kubernetes & Helm - Not yet implemented
helm lint ./chart          # Validate Helm chart
helm template ./chart      # Generate Kubernetes manifests
helm install home-assistant ./chart  # Install to cluster
helm upgrade home-assistant ./chart  # Update deployment
kubectl logs -f deployment/home-assistant  # View application logs
```

## Initial Setup Commands (when starting implementation)
```bash
# Initialize mobile app
npx create-expo-app mobile --template
cd mobile && npm install

# Initialize backend
mkdir backend && cd backend
npm init -y
npm install fastify @fastify/cors drizzle-orm pg
npm install -D @types/node @types/pg typescript tsx

# Initialize shared types
mkdir shared && cd shared
npm init -y
```

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, explicit types for all function parameters
- **React Native**: Functional components with hooks only, no class components  
- **Imports**: Use absolute imports with path mapping (@/components, @/services)
- **Naming**: camelCase for variables, PascalCase for components, kebab-case for files
- **Database**: Drizzle ORM queries only, no raw SQL
- **API**: RESTful endpoints with Zod validation schemas
- **Styling**: NativeWind classes, no inline styles
- **State**: Zustand stores per domain (recipes, budget, cleaning, user)

## AI Integration Guidelines
- **Local LLM**: Ollama with Llama 3.2/Mistral for daily tasks and privacy-sensitive operations
- **Claude API**: Reserved for complex analysis and high-quality responses
- **Calendar-Aware AI**: Prompts include schedule context for better meal/task suggestions
- **Hybrid Strategy**: Local-first with cloud fallback for advanced features
- **Privacy**: All personal/financial data processed locally only
- **Smart Context**: AI considers Dutch meal patterns, sports schedules, work patterns
- **Fallbacks**: Graceful degradation when both AI services unavailable
- **Cost Control**: Rate limiting and usage monitoring for Claude API

## Mobile App Patterns
- **Navigation**: Typed stack navigators with route parameter validation
- **Loading States**: React Suspense with loading skeletons
- **Error Handling**: Error boundaries + toast notifications using react-native-toast-message
- **Offline Support**: AsyncStorage for critical data caching
- **Push Notifications**: Expo notifications for daily tasks and reminders
- **Permissions**: Calendar access, camera for receipt scanning, notifications
- **Calendar Sync**: Background sync with rate limiting and conflict resolution

## Database Schema Patterns
```typescript
// Example: Calendar-aware recipe schema
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ingredients: jsonb('ingredients').$type<Ingredient[]>(),
  instructions: text('instructions'),
  tags: text('tags').array(),
  prep_time_minutes: integer('prep_time_minutes'),
  difficulty: integer('difficulty').default(1), // 1-5 scale
  meal_type: varchar('meal_type', { length: 50 }), // quick, recovery, family, prep
  sports_friendly: boolean('sports_friendly').default(false),
  season: varchar('season', { length: 20 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Calendar events for context
export const calendar_events = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id),
  external_id: varchar('external_id', { length: 255 }), // Provider's event ID
  provider: varchar('provider', { length: 50 }), // google, apple, outlook
  title: varchar('title', { length: 255 }),
  start_time: timestamp('start_time'),
  end_time: timestamp('end_time'),
  event_type: varchar('event_type', { length: 50 }), // work, sport, personal
  location: varchar('location', { length: 255 }),
  is_all_day: boolean('is_all_day').default(false),
  synced_at: timestamp('synced_at').defaultNow()
});
```

## API Design Patterns  
- **Base URL**: `/api/v1/`
- **Endpoints**: 
  - `/recipes` - meal planning and recipe management
  - `/shopping` - shopping lists and grocery tracking  
  - `/budget` - expense analysis and budget advice
  - `/cleaning` - cleaning schedules and task management
  - `/ai` - AI-powered suggestions and analysis
- **Validation**: Zod schemas for all request/response validation
- **Authentication**: JWT tokens with refresh token mechanism  
- **Rate Limiting**: Per-user rate limits especially on AI endpoints
- **CORS**: Configure for mobile app domains and Expo development

## Helm Chart Structure
```yaml
# chart/Chart.yaml
apiVersion: v2
name: home-assistant
description: Personal planning mobile app backend
version: 0.1.0
appVersion: "1.0"

# chart/values.yaml structure:
# - image: tag, repository, pullPolicy
# - service: type, port
# - ingress: enabled, host, tls
# - resources: limits, requests
# - postgresql: enabled, auth
# - redis: enabled, auth
# - env: all environment variables
```

## Environment Setup (when implementing)
```bash
# Prerequisites
node >= 18
npm >= 9
expo-cli >= 6
docker
kubectl
flux >= 2.0

# Local development setup (after initial setup)
cp .env.example .env.local
npm install
npm run db:generate
npm run db:migrate
npm run dev           # Backend (port 3000)
npm run start         # Mobile app (Expo)
```

## Testing Strategy
- **Unit Tests**: Jest for business logic, utilities, and pure functions
- **Integration Tests**: API endpoints with test database
- **Component Tests**: React Native Testing Library for UI components
- **E2E Tests**: Detox for critical user flows (onboarding, planning, shopping)
- **AI Testing**: Mock Claude API responses in tests
- **Coverage**: Minimum 80% for core business logic

## Localization (Dutch Market)
- **Language**: Dutch text content in `mobile/src/i18n/nl.json`
- **Currency**: Euro formatting with Dutch locale (€1.234,56)
- **Date Format**: DD-MM-YYYY format for Dutch users
- **Seasonal Data**: Dutch seasons, holidays, and typical meal patterns
- **Grocery Categories**: Dutch supermarket categories (AH, Jumbo, Plus)
- **Cleaning Terms**: Dutch household terminology and cleaning products

## Privacy & Compliance (Dutch/EU)
- **GDPR/AVG**: Full compliance with data protection regulations
- **Data Retention**: Clear retention policies for user data
- **Consent**: Explicit consent for AI processing of personal data
- **Local Storage**: Sensitive data encrypted in device storage
- **Analytics**: Privacy-first analytics (no personal data tracking)

## Implementation Guidelines for Claude
**When implementing this project:**
- Start with the initial setup commands to create the basic project structure
- Always use TypeScript with proper type definitions
- Follow React Native best practices for performance
- Implement proper error handling and loading states
- Use Drizzle ORM for all database operations
- Structure AI prompts for optimal Claude API responses
- Consider offline scenarios in mobile app design
- Generate realistic Dutch sample data when needed
- Follow Dutch UX patterns and expectations
- Implement proper state management with Zustand
- Generate complete Helm chart with all necessary templates
- Include PostgreSQL and Redis as chart dependencies  
- Use proper Helm templating with values.yaml configuration
- Follow Helm best practices for labels, annotations, and naming

**Current Repository State:**
- This is a specification-only repository
- No actual implementation exists yet
- Use the planned structure above as a guide when creating the project

## Do Not
- No class components in React Native code
- No raw SQL queries - use Drizzle ORM exclusively  
- No hardcoded strings - use i18n for all user-facing text
- No untyped API calls - always use Zod validation
- No direct database access from mobile app
- No American date formats - use Dutch DD-MM-YYYY
- No inline styles - use NativeWind classes
- No sensitive financial data in AI prompts without explicit user consent
- No manual Kubernetes deployments - use Helm chart only
