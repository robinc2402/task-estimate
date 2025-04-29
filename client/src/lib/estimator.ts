import { TShirtSizeType } from "@shared/schema";

// A simplified version of the server-side prediction algorithm
// for client-side preview or offline mode
export function predictTaskSize(title: string, description: string): {
  size: TShirtSizeType;
  confidence: number;
} {
  // Combine title and description for feature extraction
  const text = `${title} ${description}`.toLowerCase();
  
  // Count words as a simple complexity metric
  const wordCount = text.split(/\s+/).length;
  
  // Look for complexity keywords
  const complexityKeywords = [
    'complex', 'difficult', 'challenging', 'intricate',
    'refactor', 'architecture', 'redesign', 'optimize', 'security',
    'implement', 'create', 'build', 'develop', 'integration',
    'database', 'api', 'performance', 'authentication', 'authorization'
  ];
  
  // Count complexity indicators
  let complexityScore = 0;
  complexityKeywords.forEach(keyword => {
    if (text.includes(keyword)) complexityScore++;
  });
  
  // Adjust based on description length (longer descriptions often indicate more complexity)
  let lengthFactor = Math.min(Math.floor(wordCount / 20), 3);
  
  // Combined score
  const totalScore = complexityScore + lengthFactor;
  
  // Determine T-shirt size based on score
  let size: TShirtSizeType;
  let confidence: number;
  
  if (totalScore <= 1) {
    size = 'XS';
    confidence = 70 + Math.floor(Math.random() * 15);
  } else if (totalScore <= 3) {
    size = 'S';
    confidence = 75 + Math.floor(Math.random() * 15);
  } else if (totalScore <= 5) {
    size = 'M';
    confidence = 80 + Math.floor(Math.random() * 15);
  } else if (totalScore <= 7) {
    size = 'L';
    confidence = 75 + Math.floor(Math.random() * 20);
  } else if (totalScore <= 9) {
    size = 'XL';
    confidence = 70 + Math.floor(Math.random() * 20);
  } else {
    size = 'XXL';
    confidence = 65 + Math.floor(Math.random() * 25);
  }
  
  return { size, confidence };
}
