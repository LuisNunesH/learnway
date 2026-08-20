package com.learnway.common;

/**
 * Maps total XP to a level. Levels follow a gentle quadratic curve:
 * reaching level L requires 50 * (L-1) * L XP total
 * (level 2 = 100xp, level 3 = 300xp, level 4 = 600xp, ...).
 */
public final class LevelCalculator {

    private LevelCalculator() {}

    /** Total XP required to *reach* the given level (level 1 = 0). */
    public static int xpToReachLevel(int level) {
        if (level <= 1) return 0;
        return 50 * (level - 1) * level;
    }

    /** The user's current level for a given total XP. */
    public static int levelFor(int xpTotal) {
        int level = 1;
        while (xpToReachLevel(level + 1) <= xpTotal) {
            level++;
        }
        return level;
    }

    /** XP accumulated within the current level. */
    public static int xpIntoLevel(int xpTotal) {
        int level = levelFor(xpTotal);
        return xpTotal - xpToReachLevel(level);
    }
}
