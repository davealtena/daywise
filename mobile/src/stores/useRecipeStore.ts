import { create } from 'zustand';
import { Recipe } from '../../../shared/src/types';

interface RecipeState {
  recipes: Recipe[];
  favorites: number[];
  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  toggleFavorite: (recipeId: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: {
    mealType: string | null;
    difficulty: number | null;
    maxPrepTime: number | null;
    sportsFriendly: boolean | null;
  };
  setFilters: (filters: Partial<RecipeState['filters']>) => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [],
  favorites: [],
  searchQuery: '',
  filters: {
    mealType: null,
    difficulty: null,
    maxPrepTime: null,
    sportsFriendly: null,
  },
  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
  toggleFavorite: (recipeId) => set((state) => ({
    favorites: state.favorites.includes(recipeId)
      ? state.favorites.filter(id => id !== recipeId)
      : [...state.favorites, recipeId]
  })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
}));