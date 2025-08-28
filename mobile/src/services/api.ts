import { ApiResponse } from '../../../shared/src/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Recipe endpoints
  async getRecipes() {
    return this.get('/recipes');
  }

  async getRecipe(id: number) {
    return this.get(`/recipes/${id}`);
  }

  async createRecipe(recipe: any) {
    return this.post('/recipes', recipe);
  }

  // Shopping list endpoints
  async getShoppingLists() {
    return this.get('/shopping');
  }

  async createShoppingList(list: any) {
    return this.post('/shopping', list);
  }

  // Budget/Expense endpoints
  async getExpenses() {
    return this.get('/budget/expenses');
  }

  async createExpense(expense: any) {
    return this.post('/budget/expenses', expense);
  }

  // Cleaning task endpoints
  async getCleaningTasks() {
    return this.get('/cleaning');
  }

  async createCleaningTask(task: any) {
    return this.post('/cleaning', task);
  }

  // AI endpoints
  async getAiSuggestions(prompt: any) {
    return this.post('/ai/suggestions', prompt);
  }
}

export const apiService = new ApiService();