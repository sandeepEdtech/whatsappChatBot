// src/handlers/messageHandler.ts - UPDATED VERSION
import { biz } from './bizData'; 
import { sendWhatsAppMessage } from '../services/whatsapp.service';
import { generateAIResponse } from '../services/groqService';

// Session interface remains the same
interface Session {
  phone: string;
  name: string;
  currentTopic: 'agentic_ai' | 'data_analytics' | null;
  conversationStage: 'new' | 'greeting' | 'topic_selected' | 'conversation';
  messageCount: number;
  lastQuestion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessions = new Map<string, Session>();

const cleanText = (text: string): string => {
  return text.toLowerCase().trim().replace(/[^\w\s]/gi, '');
};

const getSession = (phone: string, userName: string): Session => {
  if (!sessions.has(phone)) {
    sessions.set(phone, {
      phone,
      name: userName,
      currentTopic: null,
      conversationStage: 'new',
      messageCount: 0,
      lastQuestion: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  return sessions.get(phone)!;
};

const updateSession = (phone: string, updates: Partial<Session>): Session => {
  const session = getSession(phone, updates.name || '');
  Object.assign(session, { ...updates, updatedAt: new Date() });
  sessions.set(phone, session);
  return session;
};

// NEW: Better formatted greetings
const getFormattedGreeting = (userName: string): string => {
  const now = new Date();
  const hour = now.getHours();
  let timeGreeting = "Hello";
  
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 18) timeGreeting = "Good afternoon";
  else timeGreeting = "Good evening";
  
  return `${timeGreeting} ${userName}! 👋\n\nI'm here to help you explore career opportunities! 🚀\n\nAt ${biz.company_name}, we offer:\n\n🤖 *Agentic AI Program* - Build autonomous AI systems\n📊 *Data Analytics Program* - Master data-driven decisions\n\n*Which program interests you? Reply with "AI" or "Data"*`;
};

// NEW: Course overview with better formatting
const getCourseOverview = (): string => {
  return `*Our Career-Transforming Programs:*\n\n📱 *Perfect for your career growth!*\n\n` +
         `🤖 *AGENTIC AI PROGRAM*\n` +
         `   ${biz.faqs.agentic_ai_definition}\n\n` +
         `📊 *DATA ANALYTICS PROGRAM*\n` +
         `   ${biz.faqs.data_analytics_definition}\n\n` +
         `🎯 *Both programs include:*\n` +
         `• 100% Placement Support 🚀\n` +
         `• Live + Recorded Classes 📚\n` +
         `• Pay After Placement 💰\n` +
         `• Industry Projects 🏆\n\n` +
         `*Which one excites you? Reply "AI" or "Data"*`;
};

// NEW: Handle bot identity questions
const handleBotQuestion = (text: string, userName: string): string => {
  const clean = cleanText(text);
  
  if (clean.includes('bot') || clean.includes('ai') || clean.includes('robot')) {
    if (clean.includes('are you bot') || clean.includes('you bot') || clean.includes('is this bot')) {
      return `Interesting question, ${userName}! 🤔\n\nI'm an AI-powered career advisor from ${biz.company_name}. I'm here to provide instant, helpful information about our programs!\n\nWould you prefer to:\n1️⃣ Continue chatting with me\n2️⃣ Speak with a human advisor\n\n*Reply with 1 or 2*`;
    }
  }
  return '';
};

// Main message handler - UPDATED
export const handleMessage = async (from: string, text: string, userName: string): Promise<void> => {
  const session = getSession(from, userName);
  session.messageCount++;
  
  console.log(`💬 Message #${session.messageCount} from ${userName}: "${text}"`);
  
  const cleanTextMsg = cleanText(text);
  
  // 1️⃣ Handle greetings
  const greetings = ['hi', 'hello', 'hey', 'hay', 'hii', 'hola', 'namaste', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(word => cleanTextMsg.includes(word))) {
    updateSession(from, { conversationStage: 'greeting' });
    
    const greeting = getFormattedGreeting(userName);
    await sendWhatsAppMessage(from, greeting);
    return;
  }
  
  // 2️⃣ Handle bot/identity questions
  const botResponse = handleBotQuestion(text, userName);
  if (botResponse) {
    await sendWhatsAppMessage(from, botResponse);
    return;
  }
  
  // 3️⃣ Handle "what courses" questions
  if (cleanTextMsg.includes('course') || cleanTextMsg.includes('program') || cleanTextMsg.includes('provide') || 
      cleanTextMsg.includes('offer') || cleanTextMsg.includes('tell me about course')) {
    
    const courseOverview = getCourseOverview();
    await sendWhatsAppMessage(from, courseOverview);
    return;
  }
  
  // 4️⃣ Program selection
  if (cleanTextMsg.includes('agentic') || cleanTextMsg.includes('ai') || cleanTextMsg === 'a') {
    updateSession(from, { 
      currentTopic: 'agentic_ai',
      conversationStage: 'topic_selected'
    });
    
    const response = `🤖 *Excellent choice! Agentic AI Program*\n\n` +
                     `${biz.faqs.agentic_ai_definition}\n\n` +
                     `*🚀 What You'll Learn:*\n` +
                     `${biz.faqs.ai_tools.map(t => `• ${t}`).join('\n')}\n\n` +
                     `*💼 Career Roles:*\n` +
                     `${biz.faqs.ai_roles.map(r => `• ${r}`).join('\n')}\n\n` +
                     `*What would you like to know next?*\n\n` +
                     `1️⃣ Curriculum details\n` +
                     `2️⃣ Eligibility & requirements\n` +
                     `3️⃣ Placement support\n` +
                     `4️⃣ Fees & payment\n` +
                     `5️⃣ Class schedule\n` +
                     `6️⃣ Contact admissions\n\n` +
                     `*Reply with number (1-6) or ask your question*`;
    
    await sendWhatsAppMessage(from, response);
    return;
  }
  
  if (cleanTextMsg.includes('data') || cleanTextMsg.includes('analytics') || cleanTextMsg === 'd') {
    updateSession(from, { 
      currentTopic: 'data_analytics',
      conversationStage: 'topic_selected'
    });
    
    const response = `📊 *Amazing! Data Analytics Program*\n\n` +
                     `${biz.faqs.data_analytics_definition}\n\n` +
                     `*📈 What You'll Learn:*\n` +
                     `${biz.faqs.data_tools.map(t => `• ${t}`).join('\n')}\n\n` +
                     `*💼 Career Roles:*\n` +
                     `${biz.faqs.data_roles.map(r => `• ${r}`).join('\n')}\n\n` +
                     `*What would you like to know next?*\n\n` +
                     `1️⃣ Curriculum details\n` +
                     `2️⃣ Eligibility & requirements\n` +
                     `3️⃣ Placement support\n` +
                     `4️⃣ Fees & payment\n` +
                     `5️⃣ Class schedule\n` +
                     `6️⃣ Contact admissions\n\n` +
                     `*Reply with number (1-6) or ask your question*`;
    
    await sendWhatsAppMessage(from, response);
    return;
  }
  
  // 5️⃣ Numbered options (1-6)
  if (/^[1-6]$/.test(cleanTextMsg)) {
    const option = parseInt(cleanTextMsg);
    const response = getNumberedResponse(option, session.currentTopic, userName);
    await sendWhatsAppMessage(from, response);
    return;
  }
  
  // 6️⃣ Check FAQ for quick answers
  const faqMatch = matchFAQ(text);
  if (faqMatch.matched && faqMatch.response) {
    console.log(`📚 FAQ matched: "${text}"`);
    await sendWhatsAppMessage(from, `${faqMatch.response}\n\n${getFollowUp()}`);
    return;
  }
  
  // 7️⃣ Use Groq AI for everything else
  console.log(`🤔 Using Groq AI for: "${text}"`);
  
  try {
    const aiResponse = await generateAIResponse(text, userName, session);
    await sendWhatsAppMessage(from, formatForWhatsApp(aiResponse, userName));
  } catch (error) {
    console.error("❌ Groq failed:", error);
    const fallback = `Hi ${userName}! For detailed help:\n\n📧 ${biz.contact.email}\n📝 ${biz.contact.callback_form}`;
    await sendWhatsAppMessage(from, fallback);
  }
};

// NEW: Format messages for WhatsApp UI
function formatForWhatsApp(text: string, userName: string): string {
  // Remove excessive line breaks
  let formatted = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Ensure proper spacing
  formatted = formatted.replace(/\n/g, '\n\n');
  
  // Add emoji if too plain
  const lines = formatted.split('\n');
  if (lines.length < 3 && !formatted.includes('😊') && !formatted.includes('🚀') && !formatted.includes('🤖') && !formatted.includes('📊')) {
    formatted += ' 😊';
  }
  
  return formatted;
}

// NEW: Improved FAQ matcher
function matchFAQ(text: string): { matched: boolean; response?: string } {
  const clean = cleanText(text);
  
  const faqMap: Record<string, string> = {
    // Contact - IMMEDIATE with good formatting
    'contact': `📞 *Contact Our Team*\n\nFor immediate assistance:\n\n📧 Email: ${biz.contact.email}\n📝 Callback Form: ${biz.contact.callback_form}\n\n*Response:* 2-4 hours on business days`,
    'email': `📧 *Email Us*\n\n${biz.contact.email}\n\nWe check emails regularly!`,
    'talk to human': `👨‍💼 *Speak with Advisor*\n\nPerfect! Our team would love to chat:\n\n📝 Form: ${biz.contact.callback_form}\n📧 Email: ${biz.contact.email}\n\n*They'll contact you within 24 hours*`,
    
    // Fees
    'fee': `💰 *Fees & Payment*\n\n${biz.faqs.pay_after_placement}\n\n*Registration:* ${biz.faqs.registration_fee}`,
    
    // Placement
    'placement': `🚀 *Placement Support*\n\n${biz.faqs.placement_support}\n\n${biz.faqs.placement_meaning}`,
    
    // Eligibility
    'eligibility': `✅ *Eligibility*\n\n*Who can join:*\n${biz.faqs.eligibility.map(e => `• ${e}`).join('\n')}`,
    
    // Salary
    'salary': `💷 *Salary Expectations*\n\n${biz.faqs.salary_expectation}`,
  };
  
  // Check for keywords
  for (const [keyword, response] of Object.entries(faqMap)) {
    if (clean.includes(keyword)) {
      return { matched: true, response };
    }
  }
  
  return { matched: false };
}

function getFollowUp(): string {
  const followUps = [
    "What else would you like to know?",
    "Does this help?",
    "Shall we explore more?",
    "Any other questions?",
    "Ready to learn more?"
  ];
  return followUps[Math.floor(Math.random() * followUps.length)];
}

function getNumberedResponse(option: number, topic: string | null, userName: string): string {
  if (!topic) {
    return `Hi ${userName}! First, choose a program:\n\n🤖 AI or 📊 Data?\n\n*Then use numbers 1-6*`;
  }
  
  const isAI = topic === 'agentic_ai';
  const topicName = isAI ? 'Agentic AI' : 'Data Analytics';
  const emoji = isAI ? '🤖' : '📊';
  
  const responses: Record<number, string> = {
    1: `${emoji} *${topicName} Curriculum*\n\n*Tools You'll Learn:*\n${(isAI ? biz.faqs.ai_tools : biz.faqs.data_tools).map((t, i) => `${i+1}. ${t}`).join('\n')}\n\n*Projects:* ${biz.faqs.projects}`,
    2: `✅ *Eligibility for ${topicName}*\n\n*Who Can Join:*\n${biz.faqs.eligibility.map(e => `• ${e}`).join('\n')}\n\n*Coding:* ${isAI ? biz.faqs.ai_coding : biz.faqs.data_coding}`,
    3: `🚀 *Placement Support*\n\n${biz.faqs.placement_support}\n\n*Career Roles:*\n${(isAI ? biz.faqs.ai_roles : biz.faqs.data_roles).map(r => `• ${r}`).join('\n')}\n\n*Salary:* ${biz.faqs.salary_expectation}`,
    4: `💰 *Fees & Payment*\n\n${biz.faqs.pay_after_placement}\n\n*Registration:* ${biz.faqs.registration_fee}\n*Refund:* ${biz.faqs.refund_policy}`,
    5: `📚 *Class Schedule*\n\n${biz.faqs.class_format}\n\n*Missed Class:* ${biz.faqs.missed_session}\n*Support:* ${biz.faqs.support}`,
    6: `📞 *Contact Admissions*\n\nFor personalized guidance:\n\n📧 ${biz.contact.email}\n📝 ${biz.contact.callback_form}\n\n*Response:* Within 24 hours`
  };
  
  const response = responses[option] || "Please choose 1-6";
  return `*Thanks ${userName}!* 😊\n\n${response}\n\n${getFollowUp()}`;
}