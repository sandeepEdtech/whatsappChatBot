// src/data/bizData.ts
export const biz = {
  company_name: "EdTech Informative",
  contact: {
    "email": "support@edtechinformative.uk",
    "callback_form": "https://docs.google.com/forms/d/e/1FAIpQLScy3uYPpWn0hYqltpYuBcefKe2jvmXFq7PUdgM0T5m3MWhHcQ/viewform?usp=dialog"
  },
  
  // Structured FAQs for quick access
  faqs: {
    // Program Definitions - EXACT MATCHES NEEDED
    "data_analytics_definition": "Data Analytics is the process of collecting, cleaning, and analysing data to help organisations make data-driven business decisions using tools like Excel, SQL, Power BI, and Python.",
    "agentic_ai_definition": "Agentic AI focuses on building autonomous AI agents that can independently make decisions, automate workflows, and interact with systems using AI models.",
    "difference": "Data Analytics: Focuses on analysing historical and current data to generate insights. Agentic AI: Focuses on creating intelligent systems that act, decide, and automate tasks.",
    
    // Eligibility - EXACT MATCHES NEEDED
    "eligibility": ["Freshers", "Working professionals", "Career switchers", "Non-technical and technical backgrounds"],
    "data_coding": "Data Analytics: Basic Python & SQL (taught from scratch)",
    "ai_coding": "Agentic AI: Introductory to intermediate coding (fully covered during training)",
    
    // Tools & Curriculum - PROPERTY NAME CHANGES!
    // CHANGE "data_tools" to "data_tools" (same) ✓
    "data_tools": ["Excel / Google Sheets", "SQL", "Power BI / Tableau", "Python", "Statistics & Business Analysis"],
    
    // CHANGE "ai_tools" to "ai_tools" (same) ✓
    "ai_tools": ["Python & AI APIs", "Prompt Engineering", "Autonomous AI Agents", "Workflow Automation", "Real-world AI implementations"],
    
    "projects": "✅ Yes. Both courses include industry-based projects and UK-aligned case studies to build a strong portfolio.",
    
    // Placement - EXACT MATCHES NEEDED
    "placement_support": "🚀 Yes. We provide a 100% Placement Guarantee. We ensure every eligible learner receives end-to-end placement support until they are placed.",
    "placement_meaning": "It means: We stay with you until you secure a job. You are not left alone after course completion. Dedicated placement team works continuously on your profile.",
    
    // CHANGE "data_roles" to "data_roles" (same) ✓
    "data_roles": ["Data Analyst", "Business Analyst", "Reporting Analyst", "Junior Data Consultant"],
    
    // CHANGE "ai_roles" to "ai_roles" (same) ✓
    "ai_roles": ["AI Analyst", "AI Automation Specialist", "Junior AI Engineer", "AI Solutions Associate"],
    
    // Fees - EXACT MATCHES NEEDED
    "pay_after_placement": "✅ Yes. Eligible candidates can opt for Pay After Placement, allowing them to pay fees after securing employment.",
    "registration_fee": "Yes, a one-time registration fee is required to confirm enrollment and block your seat.",
    "refund_policy": "Refunds are processed as per the organisation's internal refund policy and may take 30-45 working days.",
    
    // Classes - EXACT MATCHES NEEDED
    "class_format": "Classes are live instructor-led, and recordings are provided for revision.",
    "missed_session": "You can watch the recorded class and clarify doubts in upcoming sessions.",
    "support": "✅ Yes, you will receive dedicated mentor & doubt support throughout the course.",
    
    // Salary - EXACT MATCH NEEDED
    "salary_expectation": "UK (Entry-Level Data Analyst): £45,000 - £60,000 per year (Salary depends on skills, interview performance, and role.)"
  },
  
  // Additional business info - OPTIONAL (not used in new handler)
  programs: {
    "data_analytics": {
      name: "Data Analytics",
      emoji: "📊",
      description: "Master data-driven decisions"
    },
    "agentic_ai": {
      name: "Agentic AI", 
      emoji: "🤖",
      description: "Build autonomous AI systems"
    }
  }
} as const;
