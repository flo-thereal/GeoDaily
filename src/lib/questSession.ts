const QUEST_RECAP_KEY = 'geodaily_quest_recap';

export interface QuestRecap {
  missedCountries: Array<{ name: string; code: string }>;
  score: number;
  maxScore: number;
}

export function storeQuestRecap(recap: QuestRecap): void {
  sessionStorage.setItem(QUEST_RECAP_KEY, JSON.stringify(recap));
}

export function consumeQuestRecap(): QuestRecap | null {
  const raw = sessionStorage.getItem(QUEST_RECAP_KEY);
  sessionStorage.removeItem(QUEST_RECAP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuestRecap;
  } catch {
    return null;
  }
}
