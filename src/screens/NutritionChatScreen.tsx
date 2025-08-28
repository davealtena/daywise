import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { aiService, ChatMessage, MealRecommendation } from '../services/aiService';

interface NutritionContext {
  currentNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function NutritionChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionContext, setNutritionContext] = useState<NutritionContext | null>(null);

  // Initialize with context from navigation params
  useEffect(() => {
    const params = route.params as any;
    if (params?.context) {
      setNutritionContext(params.context);
    }
    if (params?.initialMessage) {
      setMessages([params.initialMessage]);
    } else {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: 'Hallo! Ik ben je AI voedingsassistent. Ik kan je helpen met gepersonaliseerd voedingsadvies. Vraag me alles over recepten, voedingsstoffen, maaltijdplanning of je voedingsdoelen!',
        timestamp: new Date(),
        recommendations: []
      };
      setMessages([welcomeMessage]);
    }
  }, [route.params]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.chatNutritionAdvice(
        userMessage.content,
        {
          currentNutrition: nutritionContext?.currentNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
          targets: nutritionContext?.targets || { calories: 2200, protein: 150, carbs: 250, fat: 80 },
          preferences: ['Dutch cuisine', 'healthy']
        }
      );

      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, ik kon je vraag niet beantwoorden. Controleer of Ollama draait en probeer het opnieuw.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickQuestion = async (question: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await aiService.chatNutritionAdvice(
        question,
        {
          currentNutrition: nutritionContext?.currentNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
          targets: nutritionContext?.targets || { calories: 2200, protein: 150, carbs: 250, fat: 80 },
          preferences: ['Dutch cuisine', 'healthy']
        }
      );

      setMessages(prev => [...prev, response]);
    } catch (error) {
      Alert.alert('Fout', 'Kon geen antwoord genereren. Probeer het later opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationPress = (recommendation: MealRecommendation) => {
    Alert.alert(
      recommendation.name,
      `${recommendation.description}\n\nVoedingswaarden:\n• ${recommendation.calories} kcal\n• ${recommendation.protein}g eiwit\n• ${recommendation.carbs}g koolhydraten\n• ${recommendation.fat}g vet\n\nBereidingstijd: ${recommendation.prepTime} min\nMoeilijkheid: ${recommendation.difficulty}/5`,
      [
        { text: 'Sluiten', style: 'cancel' },
        {
          text: 'Toevoegen aan planning',
          onPress: () => {
            // TODO: Add to meal planning
            Alert.alert('Success', `${recommendation.name} toegevoegd aan je maaltijdplanning!`);
          }
        }
      ]
    );
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const quickQuestions = [
    'Hoe kan ik meer eiwitten eten?',
    'Welke gezonde snacks raad je aan?',
    'Ik wil afvallen, wat moet ik eten?',
    'Post-workout maaltijden aanbevelingen',
    'Vegetarische recepten met hoog eiwit',
    'Voedsel voor meer energie'
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Voedingsadvies</Text>
          <Text style={styles.headerSubtitle}>Powered by Ollama + Claude</Text>
        </View>
      </View>

      {/* Nutrition Context Summary */}
      {nutritionContext && (
        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>Je huidige voeding vandaag:</Text>
          <View style={styles.contextStats}>
            <Text style={styles.contextStat}>
              {nutritionContext.currentNutrition.calories}/{nutritionContext.targets.calories} kcal
            </Text>
            <Text style={styles.contextStat}>
              {nutritionContext.currentNutrition.protein}g/{nutritionContext.targets.protein}g eiwit
            </Text>
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => (
          <View 
            key={message.id}
            style={[
              styles.messageContainer,
              message.type === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text style={[
              styles.messageText,
              message.type === 'user' ? styles.userMessageText : styles.assistantMessageText
            ]}>
              {message.content}
            </Text>
            
            {message.recommendations && message.recommendations.length > 0 && (
              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>Aanbevolen recepten:</Text>
                {message.recommendations.map((recommendation, idx) => (
                  <TouchableOpacity 
                    key={idx}
                    style={styles.recommendationCard}
                    onPress={() => handleRecommendationPress(recommendation)}
                  >
                    <Text style={styles.recommendationEmoji}>
                      {recommendation.mealType === 'breakfast' ? '🌅' : 
                       recommendation.mealType === 'lunch' ? '☀️' : 
                       recommendation.mealType === 'dinner' ? '🌙' : '🍎'}
                    </Text>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationName}>{recommendation.name}</Text>
                      <Text style={styles.recommendationMeta}>
                        {recommendation.calories} kcal • {recommendation.protein}g eiwit • {recommendation.prepTime} min
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <Text style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString('nl-NL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator size="small" color="#7c3aed" />
            <Text style={styles.loadingText}>AI denkt na...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickQuestionsTitle}>Snelle vragen:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickQuestions}>
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickQuestionButton}
                  onPress={() => sendQuickQuestion(question)}
                >
                  <Text style={styles.quickQuestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Vraag om voedingsadvies..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#c4b5fd',
    fontSize: 12,
    marginTop: 2,
  },
  contextCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  contextStats: {
    flexDirection: 'row',
    gap: 16,
  },
  contextStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#7c3aed',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  recommendationsContainer: {
    marginTop: 12,
  },
  recommendationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recommendationEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  recommendationMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginVertical: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  quickQuestionsContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  quickQuestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  quickQuestions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  quickQuestionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickQuestionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#7c3aed',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});