import { DailyTask } from '../store/useStore';

export async function generateDailyTasks(date: string): Promise<DailyTask[]> {
  try {
    const response = await fetch(`/api/daily?date=${date}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData && errorData.error) {
        throw new Error(errorData.error);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Failed to fetch daily tasks:", error);
    // Re-throw the error so the UI can display it
    throw error;
  }
}
