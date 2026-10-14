export interface HighscoreEntry {
  name: string;
  score: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
}

const HIGHSCORES_KEY = "tinyplanet_highscores";
const ACHIEVEMENTS_KEY = "tinyplanet_achievements";

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_delivery",
    title: "First Steps",
    desc: "Complete your very first parcel delivery.",
    unlocked: false,
    icon: "📦",
  },
  {
    id: "courier_master",
    title: "Master Courier",
    desc: "Deliver 5 parcels in a single session.",
    unlocked: false,
    icon: "👑",
  },
  {
    id: "speedy_delivery",
    title: "Special Delivery",
    desc: "Deliver a parcel within 25 seconds of picking it up.",
    unlocked: false,
    icon: "⚡",
  },
  {
    id: "explorer",
    title: "Scenic Route",
    desc: "Walk/run a total distance of 300 units.",
    unlocked: false,
    icon: "🚶",
  },
  {
    id: "traffic_dodger",
    title: "Frogger Expert",
    desc: "Dodge cars and cross roads successfully 6 times.",
    unlocked: false,
    icon: "🚗",
  },
];

export function getHighscores(): HighscoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HIGHSCORES_KEY);
    if (!data) return [];
    return JSON.parse(data) as HighscoreEntry[];
  } catch (e) {
    console.error("Failed to read highscores:", e);
    return [];
  }
}

export function saveHighscore(score: number, name: string): HighscoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const scores = getHighscores();
    const newEntry: HighscoreEntry = {
      name: name || "Anonymous Courier",
      score,
      date: new Date().toLocaleDateString(),
    };
    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    const trimmed = scores.slice(0, 5); // top 5
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    console.error("Failed to save highscore:", e);
    return [];
  }
}

export function getAchievements(): Achievement[] {
  if (typeof window === "undefined") return DEFAULT_ACHIEVEMENTS;
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!data) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(DEFAULT_ACHIEVEMENTS));
      return DEFAULT_ACHIEVEMENTS;
    }
    const parsed = JSON.parse(data) as Achievement[];
    // Fill in any missing achievements (in case of updates)
    return DEFAULT_ACHIEVEMENTS.map((def) => {
      const found = parsed.find((p) => p.id === def.id);
      return found ? { ...def, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : def;
    });
  } catch (e) {
    console.error("Failed to read achievements:", e);
    return DEFAULT_ACHIEVEMENTS;
  }
}

export function unlockAchievement(id: string, onUnlock: (ach: Achievement) => void): Achievement[] {
  if (typeof window === "undefined") return DEFAULT_ACHIEVEMENTS;
  try {
    const achievements = getAchievements();
    const target = achievements.find((a) => a.id === id);
    if (target && !target.unlocked) {
      target.unlocked = true;
      target.unlockedAt = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      onUnlock(target);
    }
    return achievements;
  } catch (e) {
    console.error("Failed to unlock achievement:", e);
    return DEFAULT_ACHIEVEMENTS;
  }
}

export function resetSaveData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HIGHSCORES_KEY);
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(DEFAULT_ACHIEVEMENTS));
  } catch (e) {
    console.error("Failed to reset storage:", e);
  }
}
