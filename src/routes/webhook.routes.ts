import { Router, Request, Response } from "express";
import { Lead } from "../models/Lead";
import { fetchLeadDetails, sendDataGenAIInvite, sendTemplateMessage, sendWhatsAppMessage } from "../services/whatsapp.service";
import { handleMessage } from "../utills/messageHandler";
import { biz } from "../utills/bizData";

const router = Router();

/**
 * =====================================
 * META WEBHOOK VERIFICATION (GET)
 * =====================================
 * This handles the initial handshake when you click 'Verify' in Meta.
 */
router.get("/webhook", (req: Request, res: Response) => {
  console.log("🔵 [WEBHOOK VERIFY] Request received from Meta");
  
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Comparison with your .env variable
  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ [WEBHOOK VERIFY] Token verified successfully");
    return res.status(200).send(challenge);
  }

  console.error("❌ [WEBHOOK VERIFY] Verification failed. Tokens do not match.");
  res.sendStatus(403);
});

/**
 * =====================================
 * META WEBHOOK EXECUTION (POST)
 * =====================================
 * This handles incoming messages and lead form submissions.
 */
// src/routes/webhook.ts


// 1. GET Route: Webhook Verification
// This is required for Meta to verify your server exists.
router.get("/lead", (req, res) => {

  console.log("lead gettting console ")
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Use the same verify token you put in your Meta App Dashboard
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
        console.log("--- WEBHOOK VERIFIED SUCCESSFULLY ---");
        return res.status(200).send(challenge);
    } else {
        console.log("--- WEBHOOK VERIFICATION FAILED ---");
        return res.sendStatus(403);
    }
});

// 2. POST Route: Receive and Log Leads
// This captures the leadgen_id and prints it to your terminal.
// Define the structure of the Meta Webhook
interface MetaLeadChange {
  field: string;
  value: {
      leadgen_id: string;
      page_id: string;
      form_id: string;
      created_time: number;
  };
}

interface MetaEntry {
  id: string;
  time: number;
  changes: MetaLeadChange[];
}

// Update your router code
router.post("/lead", async (req, res) => {
  const body = req.body;

  // 1. Acknowledge the webhook immediately
  res.status(200).send('EVENT_RECEIVED');

  if (body.object === 'page') {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === 'leadgen') {
          const leadId = change.value.leadgen_id;
          
          try {
            const leadData = await fetchLeadDetails(leadId);
            
            let rawPhone = "";
            let customerName = "there";

            // 3. ADAPTABLE EXTRACTION: Checks all possible Meta field names
            leadData.field_data.forEach((field: any) => {
              const fieldName = field.name.toLowerCase();
              if (fieldName.includes("phone") || fieldName.includes("mobile")) {
                rawPhone = field.values[0];
              }
              if (fieldName.includes("full_name") || fieldName.includes("name")) {
                customerName = field.values[0];
              }
            });

            // 🛠️ CRITICAL FIX FOR TEST LEADS: 
            // If phone is empty (common in dummy tests), use a placeholder to prevent DB crash
            if (!rawPhone && (leadId.includes("444") || leadId.length > 10)) {
              console.log("⚠️ Dummy lead detected or phone missing. Using test placeholder.");
              rawPhone = "447000000000"; 
            }

            if (rawPhone) {
              // Clean the number for WhatsApp (Digits only)
              let customerPhone = rawPhone.replace(/\D/g, "");

              // Adapt for UK local format
              if (customerPhone.startsWith("07") && customerPhone.length === 11) {
                customerPhone = "44" + customerPhone.substring(1);
              }

              const communityLink = process.env.COMMUNITY_LINK;
              const messageText = `Hey ${customerName}! 😊 I’m from the EdTechInformative Team.
We help UK professionals start their journey in AI, even with no technical background.

🚀 Our AI Agentic Masterclass is the perfect place to begin.

💷 Price: £99
🕗 Live Session: This weekend (8–9 PM UK time)

👉 Join our free WhatsApp AI community here:
${communityLink}`;

              console.log(`🚀 Sending invite to: ${customerPhone}`);

              // 5. Send via WhatsApp helper
              await sendWhatsAppMessage(customerPhone, messageText);
              
              console.log(`✅ Success: Message sent to ${customerName} at ${customerPhone}`);
            }
          } catch (error: any) {
            console.error("❌ Error processing Lead ID:", leadId, error.message);
          }
        }
      }
    }
  }
});

// router.post("/webhook", async (req: Request, res: Response) => {
//   console.log("🟢 [WEBHOOK HIT] Incoming Meta Webhook Event");
  
//   try {
//     const entry = req.body.entry?.[0];
//     const change = entry?.changes?.[0];

//     if (!change) {
//       console.log("⚠️ No changes object found in payload.");
//       return res.sendStatus(200);
//     }

//     const field = change.field;
//     const value = change.value;
//     if (value.statuses) {
//       const statusObj = value.statuses[0];
//       const status = statusObj.status;
//       const recipient = statusObj.recipient_id;

//       console.log(`📉 [STATUS UPDATE] Message to ${recipient}: ${status.toUpperCase()}`);

//       if (status === "failed") {
//         console.error("❌ Message Failed Error:", JSON.stringify(statusObj.errors, null, 2));
//       }
//       return res.sendStatus(200); // Acknowledge the status webhook
//     }
//     console.log(`📌 Detected Field Type: ${field}`);

//     /**
//      * 1️⃣ HANDLE DIRECT WHATSAPP MESSAGES (Replies like 1, 2, or 3)
//      */
//     if (field === "messages") {
//       console.log("💬 Processing direct WhatsApp message...");
//       const message = value?.messages?.[0];
      
//       if (!message) {
//         console.log("ℹ️ Webhook hit for 'messages' but no message object found.");
//         return res.sendStatus(200);
//       }

//       const from = message.from;
//       const text = (message.text?.body || "").trim(); // User's reply (e.g., "1")
//       const contactName = value?.contacts?.[0]?.profile?.name || "there";

//       console.log(`📩 Message from ${contactName} (${from}): "${text}"`);

//       try {
//         // This handles the "1", "2", or "3" replies automatically
//         await handleMessage(from, text, contactName);
//         console.log(`✅ Automated response sent to ${contactName}`);
//       } catch (sendError: any) {
//         console.error(`❌ Failed to process message:`, sendError.message);
//       }
//     }

//     /**
//      * 2️⃣ HANDLE LEADGEN EVENTS (Sending the FIRST Template)
//      */
//     else if (field === "leadgen") {
//       console.log("📊 Processing new Lead Form...");
      
//       const leadId = value?.leadgen_id;
//       if (!leadId) return res.sendStatus(200);

//       // Check if lead already exists to avoid double-sending
//       const existingLead = await Lead.findOne({ leadId });
//       if (existingLead) {
//         console.log(`⚠️ Duplicate lead: ${leadId}`);
//         return res.sendStatus(200);
//       }

//       let leadInfo;
//       try {
//         leadInfo = await fetchLeadDetails(leadId);
//       } catch (fetchError: any) {
//         console.error(`❌ Failed to fetch lead details:`, fetchError.message);
//         return res.sendStatus(200);
//       }

//       const fieldData = leadInfo?.field_data || [];
//       const name = fieldData.find((f: any) => 
//         ["full_name", "first_name", "name"].includes(f.name.toLowerCase())
//       )?.values?.[0] || "there";

//       const phoneField = fieldData.find((f: any) => {
//         const n = f.name.toLowerCase();
//         return n.includes("phone") || n.includes("mobile") || n.includes("contact");
//       });

//       let rawPhone = phoneField?.values?.[0];

//       if (!rawPhone || rawPhone.trim() === "") {
//         console.warn(`⚠️ Lead ${leadId} has no phone data. Skipping.`);
//         return res.sendStatus(200); 
//       }

//       // Format Phone
//       let cleanPhone = String(rawPhone).replace(/\D/g, "");
//       if (cleanPhone.startsWith("07") && cleanPhone.length === 11) {
//         cleanPhone = "44" + cleanPhone.substring(1);
//       }
      
//       console.log(`👤 Processed Lead: ${name} (${cleanPhone})`);

//       try {
//         // 1. Save to MongoDB
//         await Lead.create({ 
//           name, 
//           phone: cleanPhone, 
//           leadId, 
//           status: "AUTO_SENT", 
//           createdAt: new Date()
//         });
//         console.log("💾 Lead saved to MongoDB");

//         // 2. SEND THE TEMPLATE (The First Message)
//         // This uses your data_gen_ai_invite template exactly
//         await sendDataGenAIInvite(cleanPhone, name);
//         console.log(`🎉 Template "data_gen_ai_invite" sent successfully to ${name}`);
        
//       } catch (dbError: any) {
//         console.error("❌ DB/Template Error:", dbError.message);
//       }
//     }

//     res.sendStatus(200);
    
//   } catch (error: any) {
//     console.error("🔥 CRITICAL WEBHOOK ERROR:", error.message);
//     res.sendStatus(200);
//   }
// });

import mongoose from 'mongoose';

/**
 * 🔌 Setup for the second database (Lead Manager)
 */
const leadManagerConnection = mongoose.createConnection("mongodb://admin-edtech:Edtechinformative1127@168.231.78.166:27017/lead-manager?authSource=admin");

// Create a model instance specifically for the second DB using your existing schema
// We cast (Lead as any).schema to ensure it uses the structure you defined
const LeadManager = leadManagerConnection.model('Lead', (Lead as any).schema);

router.post("/webhook", async (req: Request, res: Response) => {
  console.log("🟢 [WEBHOOK HIT] Incoming Meta Webhook Event");
  
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];

    if (!change) {
      console.log("⚠️ No changes object found in payload.");
      return res.sendStatus(200);
    }

    const field = change.field;
    const value = change.value;

    console.log(`📌 Detected Field Type: ${field}`);

    /**
     * 1️⃣ HANDLE DIRECT WHATSAPP MESSAGES
     */
    if (field === "messages") {
      console.log("💬 Processing direct WhatsApp message...");
      const message = value?.messages?.[0];
      
      if (!message) {
        console.log("ℹ️ Webhook hit for 'messages' but no message object found.");
        return res.sendStatus(200);
      }

      const from = message.from;
      const text = message.text?.body;
      const contactName = value?.contacts?.[0]?.profile?.name || "there";

      try {
        await handleMessage(from, text || "", contactName);
        console.log(`✅ Reply sent to ${contactName}`);
      } catch (sendError: any) {
        console.error(`❌ Failed to process message:`, sendError.message);
        try {
          await sendWhatsAppMessage(from, `Hi ${contactName}! Sorry, I'm having a moment. Could you email ${process.env.BIZ_EMAIL}?`);
        } catch (e) {
          console.error("Double failure!");
        }
      }
    }

    /**
     * 2️⃣ HANDLE LEADGEN EVENTS (Data Analytics & GEN AI Invitation)
     */
    else if (field === "leadgen") {
      console.log("📊 Processing new Lead Form...");
      
      const leadId = value?.leadgen_id;
      if (!leadId) return res.sendStatus(200);

      const existingLead = await Lead.findOne({ leadId });
      if (existingLead) {
        console.log(`⚠️ Duplicate lead: ${leadId}`);
        return res.sendStatus(200);
      }

      let leadInfo;
      try {
        leadInfo = await fetchLeadDetails(leadId);
      } catch (fetchError: any) {
        console.error(`❌ Failed to fetch lead details:`, fetchError.message);
        return res.sendStatus(200);
      }

      // --- ROBUST EXTRACTION ---
      const fieldData = leadInfo?.field_data || [];
      
      const name = fieldData.find((f: any) => 
        ["full_name", "first_name", "name"].includes(f.name.toLowerCase())
      )?.values?.[0] || "there";

      const email = fieldData.find((f: any) => 
        f.name.toLowerCase().includes("email")
      )?.values?.[0] || `no-email-${leadId}@fb.com`;

      const phoneField = fieldData.find((f: any) => {
        const n = f.name.toLowerCase();
        return n.includes("phone") || n.includes("mobile") || n.includes("contact");
      });

      let rawPhone = phoneField?.values?.[0];

      // 🚨 GATEKEEPER: Stop if phone is missing (common in Test Tool)
      if (!rawPhone || rawPhone.trim() === "") {
        console.warn(`⚠️ Lead ${leadId} has no phone data. Skipping DB save.`);
        return res.sendStatus(200); 
      }

      // --- CLEANING & COUNTRY CODE ---
      let cleanPhone = String(rawPhone).replace(/\D/g, "");

      // Handle UK local format (07... to 447...)
      if (cleanPhone.startsWith("07") && cleanPhone.length === 11) {
        cleanPhone = "44" + cleanPhone.substring(1);
      }
      
      console.log(`👤 Processed Lead: ${name} (${cleanPhone})`);

      try {
        // 💾 Save to First MongoDB (Current Connection)
        await Lead.create({ 
          name, 
          phone: cleanPhone, 
          leadId, 
          status: "AUTO_SENT", 
          createdAt: new Date()
        });
        console.log("💾 Lead saved to First MongoDB");

        // 💾 Save to Second MongoDB (Lead Manager) + Duplicate Logic
        try {
          const existingInSecond = await LeadManager.findOne({ 
            $or: [{ phone: cleanPhone }, { email: email.toLowerCase() }] 
          });

          if (existingInSecond) {
            // If duplicate exists, update folder name as per your requirement
            await LeadManager.updateOne(
              { _id: existingInSecond._id },
              { $set: { folder: "duplicate from facebook" } }
            );
            console.log("📂 Lead duplicate found in Lead Manager: Updated folder name.");
          } else {
            // Create new entry if not a duplicate
            await LeadManager.create({
              name,
              email: email.toLowerCase(),
              phone: cleanPhone,
              source: 'Social Media',
              status: 'New',
              createdAt: new Date()
            });
            console.log("💾 Lead saved to Second MongoDB (Lead Manager)");
          }
        } catch (db2Error: any) {
          console.error("❌ Second DB Error:", db2Error.message);
        }

        // 📝 CONSTRUCT NEW MESSAGE
        const invitationMessage = `Hi ${name} 👋

Just saw your application for our Data Analytics and GEN AI Certification Programme!

Quick question - are you looking to:
1️⃣ Switch career completely (non-tech to tech)
2️⃣ Upskill in current IT role
3️⃣ Get back to work after a break

Reply with just the number, and I'll send you the next steps 😊

Edtech Informative`;

        // 📲 Send WhatsApp
        await sendWhatsAppMessage(cleanPhone, invitationMessage);
        console.log(`🎉 New Program Invite sent to ${name}`);
        
      } catch (dbError: any) {
        console.error("❌ DB/WhatsApp Error:", dbError.message);
      }
    }

    res.sendStatus(200);
    
  } catch (error: any) {
    console.error("🔥 CRITICAL WEBHOOK ERROR:", error.message);
    res.sendStatus(200);
  }
});

// Make sure to import this in your main app
export default router;


// import { Router, Request, Response } from "express";
// import { sendWhatsAppMessage } from "../services/whatsapp.service";

// const router = Router();

// /**
//  * =================================================
//  * 🔔 META WEBHOOK VERIFICATION (GET)
//  * =================================================
//  */
// router.get("/webhook", (req: Request, res: Response) => {
  
//   const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // MUST come from .env

//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   console.log("🔔 Webhook verification hit");
//   console.log("MODE :", mode);
//   console.log("TOKEN FROM META:", token);
//   console.log("TOKEN FROM ENV :", VERIFY_TOKEN);

//   if (mode === "subscribe" && token === VERIFY_TOKEN) {
//     console.log("✅ Webhook verified");
//     res.setHeader("Content-Type", "text/plain");
//     return res.status(200).send(challenge);
//   }

//   console.error("❌ Webhook verification failed");
//   return res.status(403).send("Forbidden");
// });

// /**
//  * =================================================
//  * 📩 INCOMING WHATSAPP MESSAGES (POST)
//  * =================================================
//  */
// // 📩 INCOMING WHATSAPP MESSAGES (POST)
// router.post("/webhook", async (req: Request, res: Response) => {
//   try {
//     console.log("🔥 INCOMING WEBHOOK 🔥");
//     console.log(JSON.stringify(req.body, null, 2));

//     const message =
//       req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

//     // 🛑 Ignore non-text or status messages
//     if (!message || message.from === undefined || !message.text?.body) {
//       console.log("ℹ️ Ignored non-user message");
//       return res.sendStatus(200);
//     }

//     // 🛑 Ignore messages sent by the bot itself
//     if (message?.from === req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id) {
//       console.log("ℹ️ Ignored bot's own message");
//       return res.sendStatus(200);
//     }

//     const from = message.from;
//     const text = message.text.body.toLowerCase();

//     console.log("👤 From:", from);
//     console.log("💬 Text:", text);

//     let reply = "";

//     if (text === "hi" || text === "hello") {
//       reply =
//         "👋 Hi! Welcome to our WhatsApp Bot.\n\n" +
//         "You can ask about:\n" +
//         "1️⃣ Course details\n" +
//         "2️⃣ Price\n" +
//         "3️⃣ Help\n\n" +
//         "Just type your question 😊";
//     }
//     else if (text.includes("price")) {
//       reply = "💰 Our course price is ₹999 with lifetime access.";
//     }
//     else if (text.includes("course")) {
//       reply = "📚 We offer WhatsApp Automation & Excel Bot training.";
//     }
//     else if (text.includes("help")) {
//       reply = "🤝 You can ask about price, course details, or offers.";
//     }
//     else {
//       reply =
//         "❓ Please ask questions related to our course only.\n" +
//         "Example: price, course, help";
//     }

//     console.log("🤖 Reply:", reply);

//     await sendWhatsAppMessage(from, reply);
//     return res.sendStatus(200);

//   } catch (err) {
//     console.error("❌ Webhook error:", err);
//     return res.sendStatus(200);
//   }
// });



// export default router;
