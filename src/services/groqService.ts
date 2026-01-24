// src/services/groqService.ts
import { Groq } from 'groq-sdk';
import { biz } from '../utills/bizData'; // Note: Check if path is correct - 'utills' vs 'utils'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Format FAQs for AI context - YOU NEED THIS FUNCTION!
const formatFAQsForAI = (): string => {
  return `
  ABOUT OUR COMPANY: ${biz.company_name}
  
  OUR PROGRAMS:
  1. 🤖 AGENTIC AI
     - What: ${biz.faqs.agentic_ai_definition}
     - Tools: ${biz.faqs.ai_tools.join(', ')}
     - Career Roles: ${biz.faqs.ai_roles.join(', ')}
  
  2. 📊 DATA ANALYTICS
     - What: ${biz.faqs.data_analytics_definition}
     - Tools: ${biz.faqs.data_tools.join(', ')}
     - Career Roles: ${biz.faqs.data_roles.join(', ')}
  
  KEY INFORMATION:
  • Eligibility: ${biz.faqs.eligibility.join(', ')}
  • Placement: ${biz.faqs.placement_support}
  • Placement Meaning: ${biz.faqs.placement_meaning}
  • Pay After Placement: ${biz.faqs.pay_after_placement}
  • Registration Fee: ${biz.faqs.registration_fee}
  • Refund Policy: ${biz.faqs.refund_policy}
  • Class Format: ${biz.faqs.class_format}
  • Missed Session: ${biz.faqs.missed_session}
  • Doubt Support: ${biz.faqs.support}
  • Projects: ${biz.faqs.projects}
  • Salary: ${biz.faqs.salary_expectation}
  
  CONTACT INFORMATION:
  • Email: ${biz.contact.email}
  • Callback Form: ${biz.contact.callback_form}
  `;
};

export async function generateAIResponse(
  userMessage: string, 
  userName: string, 
  sessionContext?: any
): Promise<string> {
  
  // Build context from session
  let context = '';
  if (sessionContext?.currentTopic) {
    const topicName = sessionContext.currentTopic === 'agentic_ai' ? 'Agentic AI' : 'Data Analytics';
    context = `We're discussing ${topicName}. `;
  }
  
  // Check if it's a greeting
  const isGreeting = /hi|hello|hey|namaste|hola/gmi.test(userMessage);
  if (isGreeting) {
    return `👋 Hi ${userName}! I'm Edu from ${biz.company_name}. I'm here to help you explore career opportunities! 🚀\n\nAt ${biz.company_name}, we offer:\n\n🤖 *Agentic AI Program* - Build autonomous AI systems\n📊 *Data Analytics Program* - Master data-driven decisions\n\n*Which program interests you? Reply with "AI" or "Data"*`;
  }
  
  // Complete system prompt
  const systemPrompt = `You are "Edu", a friendly and helpful career advisor at ${biz.company_name}.

PERSONALITY:
- Warm, professional, and genuinely helpful
- Use the person's name (${userName}) naturally
- Keep responses concise and well-formatted for WhatsApp
- Use emojis sparingly (😊, 🚀, 📊, 🤖) for visual appeal
- If someone asks "are you a bot?", say: "I'm an AI assistant here to help you with career guidance! How can I assist you today?"

RESPONSE GUIDELINES:
1. FORMAT FOR WHATSAPP:
   - Use clear sections with emoji headers
   - Keep paragraphs short (2-3 lines max)
   - Use bullet points for lists
   - Leave space between sections
   - Maximum 500 characters per message

2. ABOUT OUR KNOWLEDGE:
${formatFAQsForAI()}

3. CONTACT INFO:
   - Email: ${biz.contact.email}
   - Callback Form: ${biz.contact.callback_form}

4. IMPORTANT RULES:
   - If asked about courses/programs, mention both options clearly
   - If asked about contact, provide both email and form immediately
   - If unsure about something, suggest contacting our team
   - Keep responses mobile-friendly (short lines, good spacing)
   - End with a helpful question or suggestion
   - NEVER say "I don't know" - instead redirect to contact info

CONVERSATION CONTEXT: ${context}

CURRENT USER: ${userName}
USER'S QUESTION: "${userMessage}"`;
  
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: `${userName}: ${userMessage}`
    }
  ];
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, // Slightly lower for more consistent responses
      max_tokens: 500,  // Shorter for WhatsApp
      presence_penalty: 0.3,
    });
    
    let response = chatCompletion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      return getHumanFallback(userName);
    }
    
    // Format the response for WhatsApp
    response = formatForWhatsApp(response, userName);
    
    return response;
    
  } catch (error: any) {
    console.error("Groq error:", error.message);
    return getHumanFallback(userName);
  }
}

// Helper: Format response for WhatsApp UI
function formatForWhatsApp(text: string, userName: string): string {
  // Ensure it starts with personal touch
  if (!text.toLowerCase().includes(userName.toLowerCase())) {
    text = `Hi ${userName}! 😊 ${text}`;
  }
  
  // Clean up formatting
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Reduce excessive line breaks
    .replace(/\.\s+/g, '.\n\n')        // Add space after periods
    .trim();
  
  // Ensure it ends with a question or emoji
  if (!text.endsWith('?') && !text.endsWith('!') && !text.endsWith('😊') && !text.endsWith('🚀')) {
    const endings = ['Does this help?', 'Any questions?', 'Ready to learn more?', '😊'];
    text += ' ' + endings[Math.floor(Math.random() * endings.length)];
  }
  
  return text;
}

// Helper: Human-like fallback
function getHumanFallback(userName: string): string {
  const fallbacks = [
    `Hi ${userName}! 😊 For detailed guidance:\n\n📧 ${biz.contact.email}\n📝 ${biz.contact.callback_form}\n\nOur team will help you!`,
    `Hey ${userName}! Let me connect you with our experts:\n\n📧 ${biz.contact.email}\n📝 ${biz.contact.callback_form}\n\nThey'll answer all your questions! 😊`,
    `${userName}, for personalized help:\n\n📧 Email: ${biz.contact.email}\n📝 Form: ${biz.contact.callback_form}\n\nWe're here for you! 🚀`
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Optional: Add conversation memory function
export const addToConversationMemory = (phone: string, message: string, sender: 'user' | 'bot'): void => {
  // Implement if you want conversation history
  // Could use a database or in-memory store
};

// Optional: Quick test function
export const testGroqConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    const testResponse = await generateAIResponse(
      "What is data analytics?", 
      "TestUser", 
      {}
    );
    
    return {
      success: true,
      message: `Groq connected! Response length: ${testResponse.length} chars`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Groq connection failed: ${error.message}`
    };
  }
};