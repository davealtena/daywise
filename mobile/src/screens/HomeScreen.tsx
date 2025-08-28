import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const quickActions = [
    { 
      title: 'Maaltijden', 
      subtitle: 'AI-gestuurde receptsuggesties',
      icon: '🍽️',
      screen: 'Meals'
    },
    { 
      title: 'Boodschappen', 
      subtitle: 'Slimme boodschappenlijst',
      icon: '🛒',
      screen: 'Shopping'
    },
    { 
      title: 'Budget', 
      subtitle: 'Uitgaven bijhouden',
      icon: '💰',
      screen: 'Budget'
    },
    { 
      title: 'Schoonmaak', 
      subtitle: 'Blijf georganiseerd',
      icon: '🧹',
      screen: 'Cleaning'
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Goedemorgen! 👋</Text>
        <Text style={styles.headerSubtitle}>
          Laten we je dag slim plannen
        </Text>
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>
          Overzicht van vandaag
        </Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Aankomende maaltijden</Text>
          <Text style={styles.summaryValue}>Lunch om 13:00</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Boodschappen</Text>
          <Text style={styles.summaryValue}>5 items te doen</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Budget deze week</Text>
          <Text style={[styles.summaryValue, styles.greenText]}>€87,50 / €150</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Snelle acties
        </Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen as never)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>
                {action.title}
              </Text>
              <Text style={styles.actionSubtitle}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Suggestions */}
      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>
          🤖 AI Suggestie
        </Text>
        <Text style={styles.aiText}>
          Op basis van je schema heb je om 19:00 sport. 
          Overweeg een licht diner zoals onze aanbevolen 
          "Post-Workout Herstel Bowl" om 20:30.
        </Text>
        <TouchableOpacity style={styles.aiButton}>
          <Text style={styles.aiButtonText}>Bekijk Recept</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#6b7280',
  },
  summaryValue: {
    fontWeight: '500',
  },
  greenText: {
    color: '#059669',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  actionTitle: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 16,
  },
  actionSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: '#f3e8ff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  aiText: {
    color: '#374151',
    lineHeight: 20,
  },
  aiButton: {
    backgroundColor: '#7c3aed',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});