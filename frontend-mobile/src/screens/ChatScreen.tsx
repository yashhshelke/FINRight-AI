import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AIAPI } from '@finexa/api';

const C = { teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36', cream: '#f5eee2', white: '#ffffff', muted: 'rgba(42,43,47,0.45)', border: 'rgba(42,43,47,0.1)', rustLight: 'rgba(176,91,54,0.1)', sageLight: 'rgba(205,250,206,0.35)' };

type Message = { id: number; role: 'user' | 'assistant'; text: string; sources?: any[]; };

const initialMessages: Message[] = [{ id: 1, role: 'assistant', text: "Hi! I'm your Finexa AI assistant. Ask me anything about your finances, or upload an invoice!" }];

const quickPrompts = ['Analyze my spending', 'Budget tips', 'Saving advice'];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages]);

  const send = async (text?: string) => {
    const question = text ?? input;
    if (!question.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const res = await AIAPI.chat(question);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: res.answer, sources: res.sources }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: `Error: ${e.message}` }]);
    } finally { setIsTyping(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiIcon}><Text style={{ fontSize: 20 }}>✨</Text></View>
        <View>
          <Text style={styles.title}>Finexa <Text style={{ color: C.sage, fontStyle: 'italic' }}>AI</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.sage }} />
            <Text style={styles.subtitle}>Active · Powered by RAG</Text>
          </View>
        </View>
      </View>

      {/* Quick prompts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {quickPrompts.map(q => (
          <TouchableOpacity key={q} onPress={() => send(q)} style={styles.chip}>
            <Text style={styles.chipText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {messages.map(msg => (
          <View key={msg.id} style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <View style={[styles.bubble, { backgroundColor: msg.role === 'assistant' ? C.white : C.teal, borderRadius: msg.role === 'assistant' ? 4 : 18, borderBottomLeftRadius: msg.role === 'assistant' ? 18 : 4, borderTopRightRadius: msg.role === 'user' ? 4 : 18 }]}>
              <Text style={{ color: msg.role === 'assistant' ? C.charcoal : '#fff', fontSize: 13, lineHeight: 20 }}>{msg.text}</Text>
              {msg.sources && msg.sources.length > 0 && msg.sources.map((s, i) => (
                <View key={i} style={[styles.sourceTag, { marginTop: 6 }]}>
                  <Text style={{ color: C.teal, fontSize: 10, fontWeight: '500' }}>📄 {s.document_name}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={{ alignItems: 'flex-start' }}>
            <View style={[styles.bubble, { backgroundColor: C.white }]}><Text style={{ color: C.muted, fontSize: 13 }}>Thinking…</Text></View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TextInput value={input} onChangeText={setInput} placeholder="Ask about your finances…" placeholderTextColor={C.muted} style={styles.input} />
          <TouchableOpacity onPress={() => send()} disabled={isTyping || !input.trim()} style={[styles.sendBtn, { opacity: isTyping || !input.trim() ? 0.5 : 1 }]}>
            <Text style={{ color: '#fff', fontSize: 16 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.teal, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.rust, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontWeight: '600', fontSize: 17 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  chipsRow: { backgroundColor: C.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, flexGrow: 0 },
  chip: { backgroundColor: 'rgba(205,250,206,0.35)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(0,61,61,0.15)' },
  chipText: { color: C.teal, fontSize: 12, fontWeight: '500' },
  messages: { flex: 1 },
  bubble: { maxWidth: '80%', padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: C.border },
  sourceTag: { backgroundColor: 'rgba(205,250,206,0.35)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  inputArea: { backgroundColor: C.white, padding: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.border },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cream, borderRadius: 24, paddingLeft: 18, paddingRight: 8, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(0,61,61,0.15)', gap: 10 },
  input: { flex: 1, color: C.charcoal, fontSize: 14 },
  sendBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center' },
});
