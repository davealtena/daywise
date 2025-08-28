# Daywise - Smart Household Planning Assistant

A mobile AI assistant for Dutch households that adapts to your daily schedule, providing smart meal planning, calendar-aware shopping, budget intelligence, and dynamic cleaning schedules.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- Docker & Docker Compose
- Expo CLI (`npm install -g @expo/cli`)

### Development Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd daywise
   
   # Install backend dependencies
   cd backend && npm install
   cd ..
   
   # Install mobile app dependencies
   cd mobile && npm install
   cd ..
   
   # Install shared types
   cd shared && npm install && npm run build
   cd ..
   ```

2. **Start Development Services**
   ```bash
   # Start database and AI services
   docker-compose up -d postgres redis ollama
   
   # Set up environment
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

3. **Initialize Database**
   ```bash
   cd backend
   npm run db:generate
   npm run db:migrate
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Mobile App
   cd mobile && npm start
   ```

5. **Open Mobile App**
   - Scan QR code with Expo Go app
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📱 Features

- **Smart Meal Planning**: AI-powered recipes based on your calendar
- **Calendar-Aware Shopping**: Automated shopping lists considering your schedule
- **Budget Intelligence**: Spending analysis with Dutch household advice
- **Dynamic Cleaning**: Flexible cleaning schedules around your appointments
- **Dutch-Focused**: Optimized for Dutch supermarkets, meal patterns, and culture

## 🏗️ Architecture

```
daywise/
├── mobile/           # React Native app (Expo)
├── backend/          # Node.js API (Fastify)
├── shared/           # Shared TypeScript types
├── chart/            # Helm chart for Kubernetes
└── infrastructure/   # Local development configs
```

## 🛠️ Development Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm test            # Run tests
```

### Mobile App
```bash
cd mobile
npm start           # Start Expo development server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm test           # Run tests
```

### Shared Types
```bash
cd shared
npm run build      # Build TypeScript types
```

## 🤖 AI Integration

Daywise uses a hybrid AI approach:

- **Ollama (Local LLM)**: Privacy-sensitive operations, financial data
- **Claude API**: Complex analysis and high-quality responses
- **Automatic Fallback**: Graceful degradation when services unavailable

### Setting up AI Services

1. **Ollama (Local)**
   ```bash
   # Pull models
   docker exec daywise-ollama ollama pull llama3.2
   docker exec daywise-ollama ollama pull mistral
   ```

2. **Claude API**
   ```bash
   # Add to .env.local
   ANTHROPIC_API_KEY=your-api-key-here
   ```

## 🗄️ Database

Using PostgreSQL with Drizzle ORM for type-safe database operations.

### Key Tables
- `users` - User accounts
- `recipes` - Recipe database with Dutch focus
- `calendar_events` - Synced calendar data
- `shopping_lists` & `shopping_items` - Shopping management
- `expenses` - Budget tracking
- `cleaning_tasks` - Cleaning schedules

## 🚢 Deployment

### Kubernetes with Helm

```bash
# Install with Helm
helm install daywise ./chart

# Update deployment
helm upgrade daywise ./chart

# Configure for production
helm install daywise ./chart -f values-production.yaml
```

### Docker Compose (Development)

```bash
# Full stack
docker-compose up

# Production build
docker-compose -f docker-compose.prod.yml up
```

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Mobile app tests
cd mobile && npm test

# Integration tests
npm run test:integration
```

## 📊 Monitoring

- Health checks at `/health`
- Prometheus metrics enabled
- Grafana dashboards included
- Structured logging with request IDs

## 🔒 Security

- JWT authentication
- Input validation with Zod
- SQL injection protection (Drizzle ORM)
- CORS configuration
- Security headers
- Non-root container user

## 🌍 Dutch Localization

- Dutch date format (DD-MM-YYYY)
- Euro currency formatting
- Supermarket categories (AH, Jumbo, Plus)
- Traditional Dutch recipes
- Seasonal Netherlands data
- GDPR/AVG compliance

## 📖 API Documentation

### Base URL
`http://localhost:3000/api/v1`

### Endpoints
- `GET /health` - Health check
- `GET /recipes` - Recipe management
- `GET /shopping` - Shopping lists
- `GET /budget/expenses` - Expense tracking
- `GET /cleaning` - Cleaning tasks
- `POST /ai/suggestions` - AI-powered suggestions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- GitHub Issues: [Report bugs](https://github.com/davealtena/daywise/issues)
- Discussions: [Feature requests & questions](https://github.com/davealtena/daywise/discussions)

---

Built with ❤️ for Dutch households by [Dave Altena](https://github.com/davealtena)