export interface SlideMeta {
  id: number;
  title: string;
  part: 'A' | 'B' | 'C' | 'intro';
  stepCount: number;
  suggestedMinutes: number;
}

export const SLIDE_META: SlideMeta[] = [
  { id: 1, title: "Distributed Consensus in Blockchain", part: 'intro', stepCount: 1, suggestedMinutes: 1 },
  { id: 2, title: "What We'll Cover", part: 'A', stepCount: 3, suggestedMinutes: 2 },
  { id: 3, title: "Words You'll Hear Today", part: 'A', stepCount: 2, suggestedMinutes: 3 },
  { id: 4, title: "What Is a Blockchain?", part: 'A', stepCount: 6, suggestedMinutes: 6 },
  { id: 5, title: "Three Kinds of Networks", part: 'A', stepCount: 3, suggestedMinutes: 3 },
  { id: 6, title: "How Do Strangers Agree?", part: 'A', stepCount: 4, suggestedMinutes: 4 },
  { id: 7, title: "What Is Consensus?", part: 'A', stepCount: 5, suggestedMinutes: 4 },
  { id: 8, title: "Why Do We Need It?", part: 'A', stepCount: 4, suggestedMinutes: 3 },
  { id: 9, title: "What Makes It Good?", part: 'A', stepCount: 4, suggestedMinutes: 4 },
  { id: 10, title: "Two Kinds of Failure", part: 'A', stepCount: 3, suggestedMinutes: 3 },
  { id: 11, title: "The Blockchain Trilemma", part: 'A', stepCount: 4, suggestedMinutes: 4 },
  { id: 12, title: "The Consensus Family Tree", part: 'B', stepCount: 4, suggestedMinutes: 3 },
  { id: 13, title: "Proof of Work", part: 'B', stepCount: 6, suggestedMinutes: 6 },
  { id: 14, title: "PoW in Real Life: Bitcoin", part: 'B', stepCount: 4, suggestedMinutes: 3 },
  { id: 15, title: "Proof of Stake", part: 'B', stepCount: 6, suggestedMinutes: 5 },
  { id: 16, title: "More Methods, Quick Look", part: 'B', stepCount: 3, suggestedMinutes: 3 },
  { id: 17, title: "Forks: When the Chain Splits", part: 'C', stepCount: 4, suggestedMinutes: 4 },
  { id: 18, title: "Common Attacks", part: 'C', stepCount: 6, suggestedMinutes: 7 },
  { id: 19, title: "Who Uses What", part: 'C', stepCount: 2, suggestedMinutes: 3 },
  { id: 20, title: "What's Coming Next", part: 'C', stepCount: 4, suggestedMinutes: 4 },
  { id: 21, title: "Everything in One Picture", part: 'C', stepCount: 5, suggestedMinutes: 4 },
  { id: 22, title: "Thank You", part: 'C', stepCount: 1, suggestedMinutes: 1 },
];
