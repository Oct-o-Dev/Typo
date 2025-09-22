// server/src/config/wordlist.ts

// A list of the 200 most common English words for our initial game mode.
// In the future, we can easily add more lists (e.g., punctuation, numbers).
const commonWords = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", 
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", 
  "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", 
  "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", 
  "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", 
  "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

// This function generates a string of a specified number of random words.
export const generateRandomWords = (count = 40): string => {
    let words = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * commonWords.length);
        words.push(commonWords[randomIndex]);
    }
    return words.join(' ');
};