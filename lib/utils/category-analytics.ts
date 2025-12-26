/**
 * Calculate average ratings grouped by question category
 */

export type QuestionCategory = 'research' | 'strategy' | 'core_qualities' | 'leadership' | 'technical';

export interface CategoryScore {
  category: string;
  categoryKey: QuestionCategory;
  averageRating: number;
  questionCount: number;
}

export interface CategoryScores {
  research: number;
  strategy: number;
  core_qualities: number;
  leadership: number;
  technical: number;
}

export interface RadarChartData {
  category: string;
  you: number;
  team: number;
  fullMark: number;
}

/**
 * Calculate category scores from answers and questions
 */
export function calculateCategoryScores(
  answers: Array<{
    rating_value: number | null;
    question: {
      category: QuestionCategory | null;
    };
  }>
): CategoryScore[] {
  // Group answers by category
  const categoryMap = new Map<QuestionCategory, number[]>();

  answers.forEach(answer => {
    if (answer.rating_value !== null && answer.question?.category) {
      const category = answer.question.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(answer.rating_value);
    }
  });

  // Calculate averages
  const scores: CategoryScore[] = [];
  const categoryNames = {
    research: 'Research',
    strategy: 'Strategy',
    core_qualities: 'Core Qualities',
    leadership: 'Leadership',
    technical: 'Technical'
  };

  categoryMap.forEach((ratings, categoryKey) => {
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    scores.push({
      category: categoryNames[categoryKey],
      categoryKey,
      averageRating: Number(average.toFixed(2)),
      questionCount: ratings.length
    });
  });

  return scores;
}

/**
 * Convert category scores to radar chart format
 */
export function formatForRadarChart(
  userScores: CategoryScore[],
  teamScores?: CategoryScore[]
): RadarChartData[] {
  const categories: QuestionCategory[] = ['research', 'strategy', 'core_qualities', 'leadership', 'technical'];
  const categoryNames = {
    research: 'Research',
    strategy: 'Strategy',
    core_qualities: 'Core Qualities',
    leadership: 'Leadership',
    technical: 'Technical'
  };

  return categories.map(categoryKey => {
    const userScore = userScores.find(s => s.categoryKey === categoryKey);
    const teamScore = teamScores?.find(s => s.categoryKey === categoryKey);

    return {
      category: categoryNames[categoryKey],
      you: userScore?.averageRating || 0,
      team: teamScore?.averageRating || 0,
      fullMark: 5
    };
  });
}

/**
 * Calculate team average scores across all team members
 */
export function calculateTeamAverageScores(
  memberScores: CategoryScore[][]
): CategoryScore[] {
  const categoryMap = new Map<QuestionCategory, number[]>();

  // Collect all scores by category
  memberScores.forEach(scores => {
    scores.forEach(score => {
      if (!categoryMap.has(score.categoryKey)) {
        categoryMap.set(score.categoryKey, []);
      }
      categoryMap.get(score.categoryKey)!.push(score.averageRating);
    });
  });

  // Calculate averages
  const teamScores: CategoryScore[] = [];
  const categoryNames = {
    research: 'Research',
    strategy: 'Strategy',
    core_qualities: 'Core Qualities',
    leadership: 'Leadership',
    technical: 'Technical'
  };

  categoryMap.forEach((ratings, categoryKey) => {
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    teamScores.push({
      category: categoryNames[categoryKey],
      categoryKey,
      averageRating: Number(average.toFixed(2)),
      questionCount: ratings.length
    });
  });

  return teamScores;
}
