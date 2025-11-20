
export interface ChatMessage {
    role: 'user' | 'ai' | 'system';
    content: string;
}
