import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import MealsScreen from '../screens/MealsScreen';
import AddMealScreen from '../screens/AddMealScreen';
import NutritionChatScreen from '../screens/NutritionChatScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Meals Stack Navigator
function MealsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealsList" component={MealsScreen} />
      <Stack.Screen name="AddMeal" component={AddMealScreen} />
      <Stack.Screen name="NutritionChat" component={NutritionChatScreen} />
    </Stack.Navigator>
  );
}

// Placeholder screens

function BudgetScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f9fafb',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937' }}>Budget Tracker</Text>
      <Text style={{ color: '#6b7280', marginTop: 8 }}>Binnenkort beschikbaar...</Text>
    </View>
  );
}

function CleaningScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f9fafb',
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937' }}>Schoonmaakschema</Text>
      <Text style={{ color: '#6b7280', marginTop: 8 }}>Binnenkort beschikbaar...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            height: insets.bottom > 0 ? 60 + insets.bottom : 60,
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Meals" 
          component={MealsStack}
          options={{
            title: 'Maaltijden',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>🍽️</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Shopping" 
          component={ShoppingListScreen}
          options={{
            title: 'Boodschappen',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>🛒</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Budget" 
          component={BudgetScreen}
          options={{
            title: 'Budget',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>💰</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Cleaning" 
          component={CleaningScreen}
          options={{
            title: 'Schoonmaak',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>🧹</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}