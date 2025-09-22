// server/src/services/eloService.ts

// The K-factor determines how much a rating changes after a match.
// A higher K-factor means ratings change more quickly.
const K_FACTOR = 32;

/**
 * Calculates the expected score for player A against player B.
 * @param ratingA Player A's rating
 * @param ratingB Player B's rating
 * @returns The probability of player A winning (a value between 0 and 1)
 */
const getExpectedScore = (ratingA: number, ratingB: number): number => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Calculates the new ELO ratings for two players after a match.
 * @param playerARating Player A's current rating
 * @param playerBRating Player B's current rating
 * @param result The result of the match from Player A's perspective (1 for win, 0.5 for draw, 0 for loss)
 * @returns An object with the new ratings for both players.
 */
export const calculateNewRatings = (
    playerARating: number, 
    playerBRating: number, 
    result: 1 | 0.5 | 0
): { newRatingA: number; newRatingB: number } => {
    const expectedScoreA = getExpectedScore(playerARating, playerBRating);
    const expectedScoreB = getExpectedScore(playerBRating, playerARating);

    const newRatingA = Math.round(playerARating + K_FACTOR * (result - expectedScoreA));
    // Player B's result is the inverse of Player A's (1 - result)
    const newRatingB = Math.round(playerBRating + K_FACTOR * ((1 - result) - expectedScoreB));

    return { newRatingA, newRatingB };
};