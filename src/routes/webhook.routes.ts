import { Router, Request, Response } from "express";
import { Lead } from "../models/Lead";
import { fetchLeadDetails, sendTemplateMessage, sendWhatsAppMessage } from "../services/whatsapp.service";
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
      const message = value?.messages?.[0];
      
      if (!message) {
        console.log("ℹ️ Webhook hit for 'messages' but no message object found.");
        return res.sendStatus(200);
      }

      const from = message.from;
      const text = message.text?.body;
      const contactName = value?.contacts?.[0]?.profile?.name || "there";

      console.log(`📩 Message from ${contactName} (${from}): "${text}"`);

      // Use our smart message handler instead of simple reply
      try {
        await handleMessage(from, text || "", contactName);
        console.log(`✅ Reply sent to ${contactName}`);
      } catch (sendError: any) {
        console.error(`❌ Failed to process message:`, sendError.message);
        
        // Even on error, try to send something
        try {
          await sendWhatsAppMessage(from, `Hi ${contactName}! Sorry, I'm having a moment. Could you email ${biz.contact.email}?`);
        } catch (e) {
          console.error("Double failure!");
        }
      }
    }

    /**
     * 2️⃣ HANDLE LEADGEN EVENTS (Meta Lead Forms)
     */
    else if (field === "leadgen") {
      console.log("📊 Processing new Lead Form...");
      
      const leadId = value?.leadgen_id;
      if (!leadId) {
        console.error("❌ No Lead ID");
        return res.sendStatus(200);
      }

      // Check duplicate
      const existingLead = await Lead.findOne({ leadId });
      if (existingLead) {
        console.log(`⚠️ Duplicate lead: ${leadId}`);
        return res.sendStatus(200);
      }

      console.log(`📡 Fetching lead: ${leadId}`);
      const leadInfo = await fetchLeadDetails(leadId);

      // Extract data
      const name = leadInfo.field_data?.find((f: any) => f.name === "full_name")?.values?.[0] || "Friend";
      const phone = leadInfo.field_data?.find((f: any) => f.name === "phone_number")?.values?.[0];

      if (!phone) {
        console.error("❌ No phone in lead");
        return res.sendStatus(200);
      }

      console.log(`👤 New Lead: ${name} (${phone})`);

      // Save to DB
      await Lead.create({ 
        name, 
        phone, 
        leadId, 
        status: "AUTO_SENT",
        createdAt: new Date()
      });
      console.log("💾 Lead saved");

      // Send welcome message using our handler
      try {
        await handleMessage(phone, "hi", name);
        console.log(`🎉 Welcome sent to ${name}`);
      } catch (error) {
        console.error("Failed to send welcome:", error);
      }
    }

    // Always return 200
    res.sendStatus(200);
    
  } catch (error: any) {
    console.error("🔥 CRITICAL ERROR:");
    console.error("Message:", error.message);
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
