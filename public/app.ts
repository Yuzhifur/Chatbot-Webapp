import { initializeApp, FirebaseApp } from "firebase/app";
import {
  Firestore,
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, Auth, User, onAuthStateChanged } from "firebase/auth";
import { getFunctions, Functions, httpsCallable } from "firebase/functions";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Message interface for chat history
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Character configuration interface
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

// Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyAVusOJqUZp98eR7imK40VGcowAHPrCMts",
  authDomain: "chatbot-app-8848.firebaseapp.com",
  projectId: "chatbot-app-8848",
  storageBucket: "chatbot-app-8848.appspot.com",
  messagingSenderId: "590283329300",
  appId: "1:590283329300:web:4d417b3f2e38164b5f3c01",
  measurementId: "G-M0BBDX3380",
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const functions: Functions = getFunctions(app, "your-region-if-needed");

// Global state
let currentUser: User | null = null;
let chatHistory: Message[] = [];

// Authentication state listener
onAuthStateChanged(auth, (user: User | null) => {
  currentUser = user;
  if (user) {
    loadChatHistory();
    loadCharacterConfig();
  }
});

// Chat functionality
document.getElementById("send-btn")?.addEventListener("click", async () => {
  const userInput = (document.getElementById("user-input") as HTMLInputElement)?.value;
  const maxTokens = (document.getElementById("max-tokens") as HTMLSelectElement)?.value;

  if (!userInput) return;

  chatHistory.push({ role: "user", content: userInput });

  try {
    const chatCompletion = httpsCallable<{ messages: Message[]; maxTokens: number }, string>(
      functions,
      "chatCompletion"
    );

    const result = await chatCompletion({
      messages: chatHistory,
      maxTokens: parseInt(maxTokens || "256"),
    });

    chatHistory.push({ role: "assistant", content: result.data });
    updateChatUI();
    saveChatHistory();
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : "Unknown error");
  }
});

// Character configuration
document.getElementById("save-btn")?.addEventListener("click", async () => {
  const characterConfig: CharacterConfig = {
    name: (document.getElementById("character-name") as HTMLInputElement)?.value || "",
    age: (document.getElementById("character-age") as HTMLInputElement)?.value,
    gender: (document.getElementById("character-gender") as HTMLSelectElement)?.value,
    species: (document.getElementById("character-species") as HTMLSelectElement)?.value,
    description: (document.getElementById("character-description") as HTMLTextAreaElement)?.value,
    background: (document.getElementById("character-background") as HTMLTextAreaElement)?.value,
    scenario: (document.getElementById("character-scenario") as HTMLTextAreaElement)?.value,
    worldView: (document.getElementById("character-world-view") as HTMLTextAreaElement)?.value,
    family: (document.getElementById("character-family") as HTMLTextAreaElement)?.value,
    living: (document.getElementById("character-living") as HTMLInputElement)?.value,
    job: (document.getElementById("character-job") as HTMLInputElement)?.value,
    outfit: (document.getElementById("character-outfit") as HTMLInputElement)?.value,
    appearance: (document.getElementById("character-appearance") as HTMLInputElement)?.value,
    temper: (document.getElementById("character-temper") as HTMLInputElement)?.value,
    secrets: (document.getElementById("character-secrets") as HTMLInputElement)?.value,
    specials: (document.getElementById("character-specials") as HTMLInputElement)?.value,
  };

  try {
    if (currentUser) {
      const configsRef = collection(db, "users", currentUser.uid, "configs");
      await addDoc(configsRef, {
        ...characterConfig,
        timestamp: serverTimestamp(),
      });
      console.log("Character config saved successfully.");
    }
  } catch (error) {
    console.error("Error saving config:", error instanceof Error ? error.message : "Unknown error");
  }
});

// Load chat history from Firestore
async function loadChatHistory(): Promise<void> {
  if (!currentUser) return;

  try {
    const chatsRef = collection(db, "users", currentUser.uid, "chats");
    const q = query(chatsRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      if (docData?.history) {
        chatHistory = docData.history as Message[];
        updateChatUI();
      }
    }
  } catch (error) {
    console.error("Error loading chat history:", error instanceof Error ? error.message : "Unknown error");
  }
}

// Update the chat UI
function updateChatUI(): void {
  const chatContainer = document.getElementById("chatbot");
  if (chatContainer) {
    chatContainer.innerHTML = chatHistory
      .map((msg) => `<div class="message ${msg.role}">${msg.content}</div>`)
      .join("");
  }
}

// Save chat history to Firestore
async function saveChatHistory(): Promise<void> {
  if (!currentUser) return;

  try {
    const chatsRef = collection(db, "users", currentUser.uid, "chats");
    await addDoc(chatsRef, {
      history: chatHistory,
      timestamp: serverTimestamp(),
    });
    console.log("Chat history saved successfully.");
  } catch (error) {
    console.error("Error saving chat history:", error instanceof Error ? error.message : "Unknown error");
  }
}

// Load character configuration from Firestore
async function loadCharacterConfig(): Promise<void> {
  if (!currentUser) return;

  try {
    const configsRef = collection(db, "users", currentUser.uid, "configs");
    const q = query(configsRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const configData = querySnapshot.docs[0].data() as CharacterConfig;

      // Update UI elements with loaded config
      const nameInput = document.getElementById("character-name") as HTMLInputElement;
      if (nameInput && configData.name) {
        nameInput.value = configData.name;
      }

      const ageInput = document.getElementById("character-age") as HTMLInputElement;
      if (ageInput && configData.age) {
        ageInput.value = configData.age;
      }

      const descriptionInput = document.getElementById("character-description") as HTMLTextAreaElement;
      if (descriptionInput && configData.description) {
        descriptionInput.value = configData.description;
      }

      // Add similar updates for other fields
      console.log("Character config loaded successfully.");
    } else {
      console.log("No character config found.");
    }
  } catch (error) {
    console.error("Error loading character config:", error instanceof Error ? error.message : "Unknown error");
  }
}