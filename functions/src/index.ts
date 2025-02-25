import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {OpenAI} from "openai";

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

type DeepSeekMessage = OpenAI.ChatCompletionMessage & {
  reasoning_content?: string;
};

interface ChatRequest {
  messages: Array<{
    role: "system"|"user"|"assistant";
    content: string;
  }>;
  maxTokens: number;
  model: "deepseek-chat"|"deepseek-reasoner";
}

interface CharacterConfig {
  name: string;
  age?: string;
  gender?: string;
  species?: string;
  description?: string;
  background?: string;
  scenario?: string;
  worldView?: string;
  family?: string;
  living?: string;
  job?: string;
  outfit?: string;
  appearance?: string;
  temper?: string;
  secrets?: string;
  specials?: string;
}

export const chatCompletion = onCall({region: "asia-northeast1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  try {
    const {messages, maxTokens, model} = request.data as ChatRequest;

    if (!messages?.length || maxTokens > 4096) {
      throw new HttpsError("invalid-argument", "Invalid request parameters");
    }

    const completion = await openai.chat.completions.create({
      model: model || "deepseek-chat",
      messages,
      max_tokens: maxTokens,
      temperature: 1.3
    });

    const message = completion.choices[0].message as DeepSeekMessage;

    return {
      content: message.content,
      reasoning: message.reasoning_content || ""
    };
  } catch (error) {
    logger.error("Chat error:", error);
    throw new HttpsError("internal", "Failed to process chat request");
  }
});

export const saveCharacterConfig = onCall({region: "asia-northeast1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  try {
    const configData = request.data as CharacterConfig;

    if (!configData.name?.trim()) {
      throw new HttpsError("invalid-argument", "Character name required");
    }

    const configRef = db.collection("users")
      .doc(request.auth.uid)
      .collection("configs")
      .doc();

    await configRef.set({
      ...configData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {status: "success", configId: configRef.id};
  } catch (error) {
    logger.error("Save config error:", error);
    throw new HttpsError("internal", "Failed to save configuration");
  }
});

export const loadCharacterConfig = onCall({region: "asia-northeast1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  try {
    const snapshot = await db.collection("users")
      .doc(request.auth.uid)
      .collection("configs")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {status: "no-config"};
    }

    return snapshot.docs[0].data();
  } catch (error) {
    logger.error("Load config error:", error);
    throw new HttpsError("internal", "Failed to load configuration");
  }
});
