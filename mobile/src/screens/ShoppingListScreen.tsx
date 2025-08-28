import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  FlatList,
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingStore, useCurrentShoppingList, useShoppingStats } from '../stores/useShoppingStore';
import { useRecipeStore } from '../stores/useRecipeStore';

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Overig');
  
  // Zustand store hooks
  const { 
    fetchLists, 
    createList, 
    addItem, 
    toggleItem, 
    deleteItem, 
    clearCheckedItems,
    addItemsFromRecipe,
    currentListId,
    lists 
  } = useShoppingStore();
  
  const currentList = useCurrentShoppingList();
  const { total, checked, remaining } = useShoppingStats();
  const { recipes } = useRecipeStore();
  
  // Initialize with default list if none exists
  useEffect(() => {
    if (lists.length === 0) {
      createList('Weekboodschappen');
    }
  }, [lists.length, createList]);

  const categories = [
    'Groente & Fruit', 
    'Vlees & Vis', 
    'Zuivel & Eieren', 
    'Brood & Banket', 
    'Droogwaren', 
    'Diepvries', 
    'Overig'
  ];

  const handleToggleItem = (id: string) => {
    if (currentListId) {
      toggleItem(currentListId, id);
    }
  };

  const handleAddItem = () => {
    if (newItem.trim() && currentListId) {
      addItem(currentListId, {
        name: newItem.trim(),
        category: selectedCategory,
        quantity: '1x',
        isChecked: false,
      });
      setNewItem('');
    }
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      'Item verwijderen',
      'Weet je zeker dat je dit item wilt verwijderen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        { 
          text: 'Verwijderen', 
          style: 'destructive',
          onPress: () => {
            if (currentListId) {
              deleteItem(currentListId, id);
            }
          }
        },
      ]
    );
  };

  const handleClearCheckedItems = () => {
    if (checked === 0) return;

    Alert.alert(
      'Afgevinkte items verwijderen',
      `${checked} afgevinkte items verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        { 
          text: 'Verwijderen', 
          style: 'destructive',
          onPress: () => {
            if (currentListId) {
              clearCheckedItems(currentListId);
            }
          }
        },
      ]
    );
  };

  const showRecipeSelector = () => {
    if (recipes.length === 0) {
      Alert.alert(
        'Geen recepten gevonden',
        'Je hebt nog geen recepten. Voeg eerst een recept toe in de Maaltijden sectie.'
      );
      return;
    }

    Alert.alert(
      'Recept toevoegen',
      'Kies een recept om ingrediënten toe te voegen:',
      [
        { text: 'Annuleren', style: 'cancel' },
        ...recipes.slice(0, 3).map(recipe => ({
          text: recipe.name,
          onPress: () => {
            if (currentListId && recipe.ingredients) {
              const ingredientNames = recipe.ingredients.map(ing => ing.name);
              addItemsFromRecipe(currentListId, recipe.name, ingredientNames);
              Alert.alert('Succes', `${ingredientNames.length} ingrediënten toegevoegd uit "${recipe.name}"`);
            }
          }
        })),
        ...(recipes.length > 3 ? [{ text: 'Meer opties...', onPress: () => {} }] : [])
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Groente & Fruit': '🥬',
      'Vlees & Vis': '🥩',
      'Zuivel & Eieren': '🥛',
      'Brood & Banket': '🍞',
      'Droogwaren': '🌾',
      'Diepvries': '❄️',
      'Overig': '📦',
    };
    return icons[category] || '📦';
  };

  const groupedItems = currentList ? currentList.items.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as { [key: string]: typeof currentList.items[0][] }) : {};

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>
          {currentList?.name || 'Boodschappenlijst'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {checked} van {total} items afgevinkt
        </Text>
      </View>

      {/* Add Item Section */}
      <View style={styles.addSection}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Nieuw item toevoegen..."
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={styles.categoryChipIcon}>{getCategoryIcon(category)}</Text>
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextSelected
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.recipeButton} onPress={showRecipeSelector}>
          <Text style={styles.recipeButtonIcon}>🍽️</Text>
          <Text style={styles.recipeButtonText}>Uit recept toevoegen</Text>
        </TouchableOpacity>
      </View>

      {/* Shopping List */}
      <ScrollView style={styles.listContainer}>
        {Object.entries(groupedItems).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderIcon}>{getCategoryIcon(category)}</Text>
              <Text style={styles.categoryHeaderText}>{category}</Text>
              <Text style={styles.categoryCount}>({items.length})</Text>
            </View>
            
            {items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, item.isChecked && styles.itemCardChecked]}
                onPress={() => handleToggleItem(item.id)}
                onLongPress={() => handleRemoveItem(item.id)}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
                    {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
                      {item.name}
                    </Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemQuantity}>{item.quantity}</Text>
                      {item.fromRecipe && (
                        <Text style={styles.itemRecipe}>uit: {item.fromRecipe}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Actions */}
      {checked > 0 && (
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearCheckedItems}>
            <Text style={styles.clearButtonText}>
              {checked} afgevinkte items verwijderen
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 16,
    marginTop: 4,
  },
  addSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#2563eb',
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoriesScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#2563eb',
  },
  categoryChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categorySection: {
    marginTop: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  categoryHeaderIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemCardChecked: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  itemRecipe: {
    fontSize: 12,
    color: '#7c3aed',
    fontStyle: 'italic',
  },
  bottomActions: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  recipeButton: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  recipeButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  recipeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});