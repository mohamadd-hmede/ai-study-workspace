import type { Material } from "@/types/material";
import type { ChatMessage } from "@/types/chat";

import { processMaterial } from "@/lib/material-processing";

export const chatWithMaterial = async (
  material: Material,
  messages: ChatMessage[],
  question: string,
): Promise<string> => {
  const conversation = messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const prompt = `
You are an AI study assistant.

Answer the user's question using the study material.

Conversation:
${conversation || "No previous conversation."}

User question:
${question}
`;

  return await processMaterial(material, prompt);
};
