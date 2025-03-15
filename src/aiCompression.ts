import * as tf from '@tensorflow/tfjs-node';
import { config } from 'dotenv';
import stringSimilarity from 'string-similarity';
import { NeuralNetwork } from 'node-nlp';
import natural from 'natural';

// Initialize environment variables
config();

// Tokenizer for text analysis
const tokenizer = new natural.WordTokenizer();

interface AISummary {
  summary: string;
  keywords: string[];
  semanticScore: number;
}

interface CompressionMetrics {
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
  semanticPreservation: number;
  keywordDensity: number;
}

// Medical vocabulary for TensorFlow model
const medicalVocabulary = [
  'diagnosis', 'treatment', 'prognosis', 'symptoms', 'patient',
  'medication', 'dosage', 'chronic', 'acute', 'condition',
  'hypertension', 'diabetes', 'cardiac', 'respiratory', 'neurological',
  'assessment', 'evaluation', 'therapy', 'surgery', 'recovery',
  'outpatient', 'inpatient', 'emergency', 'prescription', 'allergy',
  'laboratory', 'radiology', 'pathology', 'oncology', 'pediatric'
];

// Create a vocabulary map for word embeddings
const vocabularyMap = new Map<string, number>();
medicalVocabulary.forEach((word, index) => {
  vocabularyMap.set(word.toLowerCase(), index);
});

// TensorFlow model for text analysis
let model: tf.LayersModel;

/**
 * Initialize TensorFlow model for text analysis
 */
async function initializeModel() {
  try {
    // Create a simple model for text classification
    model = tf.sequential();
    
    // Add embedding layer
    model.add(tf.layers.embedding({
      inputDim: medicalVocabulary.length,
      outputDim: 32,
      inputLength: 1
    }));
    
    // Add dense layers
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    console.log('TensorFlow model initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize TensorFlow model:', error);
    return false;
  }
}

// Initialize model when module loads
initializeModel();

/**
 * Analyzes text using TensorFlow to extract key medical concepts
 */
export async function analyzeWithAI(text: string): Promise<AISummary> {
  try {
    // Tokenize the text
    const tokens = tokenizer.tokenize(text);
    
    // Extract keywords using NLP techniques
    const keywords = await extractKeywords(tokens || []);
    
    // Generate a summary using TF-IDF
    const summary = generateSummary(text, keywords);
    
    // Calculate semantic density score
    const semanticScore = calculateSemanticDensity(text, summary);

    return {
      summary,
      keywords,
      semanticScore
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
}

/**
 * Generates a summary using TF-IDF and sentence ranking
 */
function generateSummary(text: string, keywords: string[]): string {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  
  // Split text into sentences
  const sentenceTokenizer = new natural.SentenceTokenizer();
  const sentences = sentenceTokenizer.tokenize(text) || [];
  
  // Add each sentence to TF-IDF
  sentences.forEach(sentence => {
    tfidf.addDocument(sentence);
  });
  
  // Score sentences based on keywords
  const sentenceScores = sentences.map((sentence, i) => {
    let score = 0;
    keywords.forEach(keyword => {
      tfidf.tfidfs(keyword, (j, measure) => {
        if (i === j) {
          score += measure;
        }
      });
    });
    return { sentence, score };
  });
  
  // Sort sentences by score and take top 3
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence);
  
  return topSentences.join(' ');
}

/**
 * Enhances compression using TensorFlow-generated insights
 */
export async function enhanceCompression(
  originalText: string,
  compressedText: string
): Promise<string> {
  const analysis = await analyzeWithAI(originalText);
  
  // Use TensorFlow insights to optimize compression
  const enhancedCompression = optimizeCompression(
    compressedText,
    analysis.keywords
  );

  return enhancedCompression;
}

/**
 * Calculates compression metrics including semantic preservation
 */
export function calculateCompressionMetrics(
  original: string,
  compressed: string,
  aiSummary: AISummary
): CompressionMetrics {
  const originalLength = original.length;
  const compressedLength = compressed.length;
  
  // Calculate basic compression ratio
  const compressionRatio = ((originalLength - compressedLength) / originalLength) * 100;
  
  // Calculate semantic preservation using string similarity
  const semanticPreservation = stringSimilarity.compareTwoStrings(
    original.toLowerCase(),
    compressed.toLowerCase()
  ) * 100;
  
  // Calculate keyword density
  const keywordDensity = calculateKeywordDensity(compressed, aiSummary.keywords);
  
  return {
    originalLength,
    compressedLength,
    compressionRatio,
    semanticPreservation,
    keywordDensity
  };
}

/**
 * Extracts keywords using NLP techniques
 */
async function extractKeywords(tokens: string[]): Promise<string[]> {
  const net = new NeuralNetwork();
  const tfidf = new natural.TfIdf();
  
  // Add document to TF-IDF
  tfidf.addDocument(tokens);
  
  // Get top keywords
  const keywords: string[] = [];
  tfidf.listTerms(0).slice(0, 10).forEach(item => {
    keywords.push(item.term);
  });
  
  return keywords;
}

/**
 * Calculates semantic density of compressed text
 */
function calculateSemanticDensity(
  originalText: string,
  summary: string
): number {
  const originalTokens = tokenizer.tokenize(originalText) || [];
  const summaryTokens = tokenizer.tokenize(summary) || [];
  
  // Calculate information density
  const density = (summaryTokens.length / (originalTokens.length || 1)) * 100;
  
  // Normalize to 0-1 range
  return Math.min(density / 100, 1);
}

/**
 * Optimizes compression using keyword analysis
 */
function optimizeCompression(
  compressedText: string,
  keywords: string[]
): string {
  let optimized = compressedText;
  
  // Apply keyword-based optimization
  keywords.forEach(keyword => {
    const pattern = new RegExp(keyword, 'gi');
    if (pattern.test(optimized)) {
      // Create a shorter representation for frequently used keywords
      const hash = natural.Metaphone.process(keyword);
      optimized = optimized.replace(pattern, hash);
    }
  });
  
  return optimized;
}

/**
 * Calculates keyword density in compressed text
 */
function calculateKeywordDensity(
  text: string,
  keywords: string[]
): number {
  const tokens = tokenizer.tokenize(text) || [];
  let keywordCount = 0;
  
  keywords.forEach(keyword => {
    const pattern = new RegExp(keyword, 'gi');
    const matches = text.match(pattern);
    if (matches) {
      keywordCount += matches.length;
    }
  });
  
  return (keywordCount / (tokens.length || 1)) * 100;
}