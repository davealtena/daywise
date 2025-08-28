import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { aiService, MealRecommendation } from '../services/aiService';
import { API_BASE_URL } from '../config/api';

interface LoggedMeal {
  id: number;
  meal_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: any[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  portion_size?: string;
  notes?: string;
  logged_at: string;
}

interface DailyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export default function MealsScreen() {
  const [todaysMeals, setTodaysMeals] = useState<LoggedMeal[]>([]);
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<MealRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const userId = 1; // TODO: Get from auth context
  const today = new Date().toISOString().split('T')[0];

  const fetchTodaysMeals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/meals/user/${userId}?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setTodaysMeals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyNutrition = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/meals/user/${userId}/nutrition?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setDailyNutrition(data.data.total_nutrition);
      }
    } catch (error) {
      console.error('Error fetching nutrition:', error);
    }
  };

  const getAIRecommendations = async () => {
    if (dailyNutrition.calories === 0) return; // No meals logged yet
    
    setLoadingRecommendations(true);
    try {
      const recommendations = await aiService.getMealRecommendations({
        current_nutrition: dailyNutrition,
        nutrition_goals: { calories: 2200, protein: 150, carbs: 250, fat: 80, fiber: 25 },
        meals_today: todaysMeals.map(m => m.meal_name),
      });
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTodaysMeals(), fetchDailyNutrition()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTodaysMeals();
    fetchDailyNutrition();
  }, []);

  useEffect(() => {
    getAIRecommendations();
  }, [dailyNutrition]);

  const nutritionGoals = { calories: 2200, protein: 150, carbs: 250, fat: 80, fiber: 25 };

  const getMealTypeEmoji = (type: string) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case 'breakfast': return 'Ontbijt';
      case 'lunch': return 'Lunch';
      case 'dinner': return 'Diner';
      case 'snack': return 'Snack';
      default: return 'Maaltijd';
    }
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Maaltijden</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AddMeal' as never)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Maaltijd</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>Vandaag - {new Date().toLocaleDateString('nl-NL')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Daily Nutrition Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dagelijkse Voeding</Text>
          
          <View style={styles.nutritionContainer}>
            {/* Calories */}
            <View style={styles.nutritionItem}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Calorieën</Text>
                <Text style={styles.nutritionValue}>
                  {dailyNutrition.calories} / {nutritionGoals.calories}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View 
                  style={[styles.progressBarFill, styles.caloriesBar, { width: `${getProgressPercentage(dailyNutrition.calories, nutritionGoals.calories)}%` }]}
                />
              </View>
            </View>

            {/* Protein */}
            <View style={styles.nutritionItem}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Eiwit</Text>
                <Text style={styles.nutritionValue}>
                  {dailyNutrition.protein}g / {nutritionGoals.protein}g
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View 
                  style={[styles.progressBarFill, styles.proteinBar, { width: `${getProgressPercentage(dailyNutrition.protein, nutritionGoals.protein)}%` }]}
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.nutritionItem}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Koolhydraten</Text>
                <Text style={styles.nutritionValue}>
                  {dailyNutrition.carbs}g / {nutritionGoals.carbs}g
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View 
                  style={[styles.progressBarFill, styles.carbsBar, { width: `${getProgressPercentage(dailyNutrition.carbs, nutritionGoals.carbs)}%` }]}
                />
              </View>
            </View>

            {/* Fat */}
            <View style={styles.nutritionItem}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Vet</Text>
                <Text style={styles.nutritionValue}>
                  {dailyNutrition.fat}g / {nutritionGoals.fat}g
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View 
                  style={[styles.progressBarFill, styles.fatBar, { width: `${getProgressPercentage(dailyNutrition.fat, nutritionGoals.fat)}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* AI Recommendations */}
        {aiRecommendations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI Suggesties</Text>
            {loadingRecommendations ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              <View style={styles.recommendationsContainer}>
                {aiRecommendations.slice(0, 2).map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Text style={styles.recommendationMeal}>{rec.meal}</Text>
                    <Text style={styles.recommendationReason}>{rec.reason}</Text>
                  </View>
                ))}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('NutritionChat' as never)}
                  style={styles.moreAdviceButton}
                >
                  <Text style={styles.moreAdviceButtonText}>Meer AI Advies</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Today's Meals */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vandaag Gegeten</Text>
          
          {isLoading ? (
            <ActivityIndicator style={styles.bigLoader} />
          ) : todaysMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Nog geen maaltijden toegevoegd</Text>
              <Text style={styles.emptyStateSubtitle}>
                Tik op "+ Maaltijd" om je eerste maaltijd van vandaag toe te voegen
              </Text>
            </View>
          ) : (
            <View style={styles.mealsContainer}>
              {todaysMeals.map((meal) => (
                <View key={meal.id} style={styles.mealItem}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealEmoji}>{getMealTypeEmoji(meal.meal_type)}</Text>
                      <View>
                        <Text style={styles.mealName}>{meal.meal_name}</Text>
                        <Text style={styles.mealType}>{getMealTypeLabel(meal.meal_type)}</Text>
                      </View>
                    </View>
                    {meal.nutrition && (
                      <View style={styles.mealNutrition}>
                        <Text style={styles.mealCalories}>
                          {meal.nutrition.calories} kcal
                        </Text>
                        <Text style={styles.mealProtein}>
                          {meal.nutrition.protein}g eiwit
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {meal.notes && (
                    <Text style={styles.mealNotes}>"{meal.notes}"</Text>
                  )}
                  
                  <View style={styles.mealFooter}>
                    <Text style={styles.mealTime}>
                      {new Date(meal.logged_at).toLocaleTimeString('nl-NL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    <Text style={styles.mealPortion}>{meal.portion_size}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
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
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  nutritionContainer: {
    // gap: 12, // Not supported in older RN versions
  },
  nutritionItem: {
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#374151',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  progressBarBg: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    height: 8,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  caloriesBar: {
    backgroundColor: '#2563eb',
  },
  proteinBar: {
    backgroundColor: '#059669',
  },
  carbsBar: {
    backgroundColor: '#d97706',
  },
  fatBar: {
    backgroundColor: '#7c3aed',
  },
  loader: {
    paddingVertical: 16,
  },
  bigLoader: {
    paddingVertical: 32,
  },
  recommendationsContainer: {
    // gap: 12, // Not supported in older RN versions
  },
  recommendationItem: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
  },
  recommendationMeal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e3a8a',
  },
  recommendationReason: {
    fontSize: 13,
    color: '#1d4ed8',
    marginTop: 4,
  },
  moreAdviceButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  moreAdviceButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  mealsContainer: {
    // gap: 12, // Not supported in older RN versions
  },
  mealItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  mealType: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealNutrition: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  mealProtein: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealNotes: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  mealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  mealTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  mealPortion: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 80,
  },
});
