import { DailyTask } from '../store/useStore';

export async function generateDailyTasks(date: string): Promise<DailyTask[]> {
  try {
    const response = await fetch(`/api/daily?date=${date}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch daily tasks:", error);
    return [];
  }
}
