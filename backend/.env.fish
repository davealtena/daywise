#!/usr/bin/env fish

# Environment variables for Daywise backend
set -x NODE_ENV development
set -x PORT 3000
set -x HOST 0.0.0.0
set -x DATABASE_URL postgresql://daywise:daywise123@localhost:5432/daywise
set -x JWT_SECRET development-jwt-secret
set -x OLLAMA_URL http://localhost:11434