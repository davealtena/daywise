import { create } from 'zustand';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  isChecked: boolean;
  fromRecipe?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface ShoppingStore {
  lists: ShoppingList[];
  currentListId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createList: (name: string) => void;
  deleteList: (listId: string) => void;
  setCurrentList: (listId: string) => void;
  
  addItem: (listId: string, item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  deleteItem: (listId: string, itemId: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  clearCheckedItems: (listId: string) => void;
  
  addItemsFromRecipe: (listId: string, recipeName: string, ingredients: string[]) => void;
  
  // API actions
  fetchLists: () => Promise<void>;
  syncList: (listId: string) => Promise<void>;
}

export const useShoppingStore = create<ShoppingStore>((set, get) => ({
  lists: [],
  currentListId: null,
  isLoading: false,
  error: null,

  createList: (name: string) => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      lists: [...state.lists, newList],
      currentListId: newList.id,
    }));
  },

  deleteList: (listId: string) => {
    set((state) => {
      const filteredLists = state.lists.filter(list => list.id !== listId);
      return {
        lists: filteredLists,
        currentListId: state.currentListId === listId 
          ? (filteredLists.length > 0 ? filteredLists[0].id : null)
          : state.currentListId
      };
    });
  },

  setCurrentList: (listId: string) => {
    set({ currentListId: listId });
  },

  addItem: (listId: string, itemData: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ShoppingItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      lists: state.lists.map(list => 
        list.id === listId 
          ? { ...list, items: [...list.items, newItem], updatedAt: new Date() }
          : list
      )
    }));
  },

  updateItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => {
    set((state) => ({
      lists: state.lists.map(list => 
        list.id === listId 
          ? {
              ...list,
              items: list.items.map(item => 
                item.id === itemId 
                  ? { ...item, ...updates, updatedAt: new Date() }
                  : item
              ),
              updatedAt: new Date()
            }
          : list
      )
    }));
  },

  deleteItem: (listId: string, itemId: string) => {
    set((state) => ({
      lists: state.lists.map(list => 
        list.id === listId 
          ? {
              ...list,
              items: list.items.filter(item => item.id !== itemId),
              updatedAt: new Date()
            }
          : list
      )
    }));
  },

  toggleItem: (listId: string, itemId: string) => {
    set((state) => ({
      lists: state.lists.map(list => 
        list.id === listId 
          ? {
              ...list,
              items: list.items.map(item => 
                item.id === itemId 
                  ? { ...item, isChecked: !item.isChecked, updatedAt: new Date() }
                  : item
              ),
              updatedAt: new Date()
            }
          : list
      )
    }));
  },

  clearCheckedItems: (listId: string) => {
    set((state) => ({
      lists: state.lists.map(list => 
        list.id === listId 
          ? {
              ...list,
              items: list.items.filter(item => !item.isChecked),
              updatedAt: new Date()
            }
          : list
      )
    }));
  },

  addItemsFromRecipe: (listId: string, recipeName: string, ingredients: string[]) => {
    const newItems: ShoppingItem[] = ingredients.map(ingredient => ({
      id: `${Date.now()}-${Math.random()}`,
      name: ingredient,
      category: 'Overig',
      quantity: '1x',
      isChecked: false,
      fromRecipe: recipeName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    set((state) => ({
      lists: state.lists.map(list => 
        list.id === listId 
          ? { ...list, items: [...list.items, ...newItems], updatedAt: new Date() }
          : list
      )
    }));
  },

  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      // For now, just clear loading state
      set({ isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch lists' 
      });
    }
  },

  syncList: async (listId: string) => {
    try {
      // TODO: Implement API sync
      console.log(`Syncing list ${listId}`);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sync list' 
      });
    }
  },
}));

// Derived state hooks
export const useCurrentShoppingList = () => {
  const { lists, currentListId } = useShoppingStore();
  return lists.find(list => list.id === currentListId) || null;
};

export const useShoppingStats = () => {
  const currentList = useCurrentShoppingList();
  if (!currentList) {
    return { total: 0, checked: 0, remaining: 0 };
  }
  
  const total = currentList.items.length;
  const checked = currentList.items.filter(item => item.isChecked).length;
  const remaining = total - checked;
  
  return { total, checked, remaining };
};