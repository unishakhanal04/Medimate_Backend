export type AiMessageRole = "user" | "assistant";

export interface IConversation {
  _id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiMessage {
  _id: string;
  userId: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  createdAt: Date;
}

export interface ChatReply {
  role: "assistant";
  content: string;
}
