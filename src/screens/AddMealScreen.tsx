import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';

export default function AddMealScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [meal, setMeal] = useState({
    name: '',
    meal_type: 'breakfast',
    notes: '',
  });
  
  const [nutrition, setNutrition] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  });

  const saveMeal = async () => {
    if (!meal.name.trim()) {
      Alert.alert('Fout', 'Voer een maaltijd naam in');
      return;
    }

    if (!nutrition.calories || !nutrition.protein || !nutrition.carbs || !nutrition.fat) {
      Alert.alert('Fout', 'Voer alle macronutriënten in (calorieën, eiwit, koolhydraten, vet)');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1, // TODO: Get from auth context
          meal_name: meal.name,
          meal_type: meal.meal_type,
          ingredients: [], // Empty array since we're not tracking ingredients
          nutrition: {
            calories: parseInt(nutrition.calories) || 0,
            protein: parseInt(nutrition.protein) || 0,
            carbs: parseInt(nutrition.carbs) || 0,
            fat: parseInt(nutrition.fat) || 0,
            fiber: parseInt(nutrition.fiber) || 0,
          },
          portion_size: '1 portie',
          notes: meal.notes || undefined,
        }),
      });

      if (response.ok) {
        Alert.alert('Succes', 'Maaltijd toegevoegd!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error('Failed to log meal');
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Fout', 'Kon maaltijd niet toevoegen');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Terug</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maaltijd Toevoegen</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveMeal}>
          <Text style={styles.saveButtonText}>Opslaan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Meal Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Wat heb je gegeten?</Text>
          <TextInput
            style={styles.input}
            value={meal.name}
            onChangeText={(text) => setMeal({...meal, name: text})}
            placeholder="Bijv. Havermout met banaan"
          />
        </View>

        {/* Meal Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Type maaltijd</Text>
          <View style={styles.mealTypeButtons}>
            {[
              { key: 'breakfast', label: 'Ontbijt' },
              { key: 'lunch', label: 'Lunch' },
              { key: 'dinner', label: 'Diner' },
              { key: 'snack', label: 'Snack' }
            ].map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  meal.meal_type === type.key && styles.typeButtonActive
                ]}
                onPress={() => setMeal({...meal, meal_type: type.key})}
              >
                <Text style={[
                  styles.typeButtonText,
                  meal.meal_type === type.key && styles.typeButtonTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrition Information */}
        <View style={styles.section}>
          <Text style={styles.label}>Voedingswaarden</Text>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Calorieën</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.calories}
                  onChangeText={(text) => setNutrition({...nutrition, calories: text})}
                  placeholder="320"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Eiwit (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.protein}
                  onChangeText={(text) => setNutrition({...nutrition, protein: text})}
                  placeholder="12"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Koolhydraten (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.carbs}
                  onChangeText={(text) => setNutrition({...nutrition, carbs: text})}
                  placeholder="55"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Vet (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.fat}
                  onChangeText={(text) => setNutrition({...nutrition, fat: text})}
                  placeholder="6"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Vezels (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.fiber}
                  onChangeText={(text) => setNutrition({...nutrition, fiber: text})}
                  placeholder="8"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.nutritionItem} />
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notities (optioneel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={meal.notes}
            onChangeText={(text) => setMeal({...meal, notes: text})}
            placeholder="Bijv. lekker na sport, te veel suiker, etc."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#16a34a',
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#065f46',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonActive: {
    backgroundColor: '#16a34a',
  },
  typeButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  nutritionGrid: {
    marginTop: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  nutritionItem: {
    flex: 1,
    marginRight: 12,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  nutritionInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
});