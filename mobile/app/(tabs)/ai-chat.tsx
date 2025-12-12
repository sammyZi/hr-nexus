import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Colors, Spacing, Typography, BorderRadius, FontFamily } from '@/constants/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    // Simulate AI response (replace with real API call)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: 'This is an AI response.', sender: 'ai' },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.aiMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
        inverted
      />
      <View style={styles.inputRow}>
        <Input
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          style={styles.input}
          editable={!loading}
          onSubmitEditing={sendMessage}
        />
        <Button
          title="Send"
          onPress={sendMessage}
          loading={loading}
          disabled={loading || !input.trim()}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  message: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    color: Colors.text,
    fontSize: Typography.body,
    fontFamily: FontFamily.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  sendButton: {
    minWidth: 80,
  },
});
