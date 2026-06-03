import { ACHIEVEMENTS } from './progress';

const NEW_ACHIEVEMENTS_KEY = 'geodaily_new_achievements';
const QUEST_RECAP_KEY = 'geodaily_quest_recap';

export interface QuestRecap {
  missedCountries: Array<{ name: string; code: string }>;
  score: number;
  maxScore: number;
}

export interface UnlockedAchievementDisplay {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export function storeNewAchievements(ids: string[]): void {
  if (ids.length === 0) return;
  const details = ids
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
    }));
  sessionStorage.setItem(NEW_ACHIEVEMENTS_KEY, JSON.stringify(details));
}

export function consumeNewAchievements(): UnlockedAchievementDisplay[] {
  const raw = sessionStorage.getItem(NEW_ACHIEVEMENTS_KEY);
  sessionStorage.removeItem(NEW_ACHIEVEMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UnlockedAchievementDisplay[];
  } catch {
    return [];
  }
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
