# env.fish - Environment Configuration for Daywise

# Application
set -x NODE_ENV "development"
set -x PORT "3000"
set -x HOST "0.0.0.0"

# Database
set -x DATABASE_URL "postgresql://localhost:5432/daywise"

# JWT Secret
set -x JWT_SECRET "IlHcwBDPVqz2EnORwukswQut2wWhPV9kB1lkT/p+vB9d8SiO9pRWGlFTEPsOeEGl j0CQ0qHUUczd8fP7V3P8bw=="

# AI Services
set -x ANTHROPIC_API_KEY "sk-ant-api03-VtC9y3_vcTkO3qs6oIDsm_pbVE5CiPMN1qEoesC09CiS_PZmTIWy3G8IfO4rYSmzSyEspjRJXRm8"
set -x OLLAMA_URL "http://localhost:11434"

# Redis (optional, for caching)
set -x REDIS_URL "redis://localhost:6379"

# Expo/Mobile App
set -x EXPO_PUBLIC_API_URL "http://localhost:3000/api/v1"
