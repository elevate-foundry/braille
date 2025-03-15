import CryptoJS from 'crypto-js';
import { compressBrailleText, decompressBrailleText } from './brailleCompression.js';

// Enhanced medical-specific patterns with more comprehensive coverage
const MEDICAL_PATTERNS = {
  conditions: {
    'hypertension': '⠓⠽⠏',
    'diabetes': '⠙⠊⠁',
    'cardiac': '⠉⠙⠊',
    'respiratory': '⠗⠑⠎⠏',
    'neurological': '⠝⠑⠥⠗',
    'orthopedic': '⠕⠗⠞⠓',
    'chronic': '⠉⠓⠗',
    'acute': '⠁⠉⠥',
    'syndrome': '⠎⠽⠝',
    'disease': '⠙⠊⠎',
    'disorder': '⠙⠎⠗',
    'infection': '⠊⠝⠋',
    'inflammation': '⠊⠝⠋⠇',
    'malignant': '⠍⠁⠇',
    'benign': '⠃⠑⠝'
  },
  measurements: {
    'blood pressure': '⠃⠏',
    'heart rate': '⠓⠗',
    'temperature': '⠞⠑⠍⠏',
    'oxygen saturation': '⠕⠎',
    'respiratory rate': '⠗⠗',
    'blood glucose': '⠃⠛',
    'body mass index': '⠃⠍⠊',
    'pulse': '⠏⠇⠎',
    'weight': '⠺⠞',
    'height': '⠓⠞'
  },
  medications: {
    'acetaminophen': '⠁⠉⠞',
    'ibuprofen': '⠊⠃⠥',
    'amoxicillin': '⠁⠍⠕⠭',
    'lisinopril': '⠇⠊⠎',
    'metformin': '⠍⠑⠞',
    'aspirin': '⠁⠎⠏',
    'insulin': '⠊⠝⠎',
    'warfarin': '⠺⠁⠗',
    'prednisone': '⠏⠗⠙',
    'omeprazole': '⠕⠍⠏'
  },
  units: {
    'milligrams': '⠍⠛',
    'milliliters': '⠍⠇',
    'degrees': '⠙⠑⠛',
    'percent': '⠏⠉⠞',
    'units': '⠥',
    'kilograms': '⠅⠛',
    'centimeters': '⠉⠍',
    'international units': '⠊⠥',
    'micrograms': '⠍⠉⠛',
    'millimoles': '⠍⠍⠕⠇'
  },
  common_phrases: {
    'patient presents with': '⠏⠏⠺',
    'medical history': '⠍⠓',
    'family history': '⠋⠓',
    'vital signs': '⠧⠎',
    'chief complaint': '⠉⠉',
    'review of systems': '⠗⠕⠎',
    'physical examination': '⠏⠑',
    'laboratory results': '⠇⠁⠃',
    'treatment plan': '⠞⠏',
    'follow up': '⠋⠥'
  }
};

interface MedicalRecord {
  patientId: string;
  data: string;
  timestamp: number;
  metadata?: {
    department?: string;
    recordType?: string;
    version?: number;
  };
}

interface StorageProjection {
  year: number;
  originalSize: number;
  compressedSize: number;
  spaceSaved: number;
  recordCount: number;
}

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  spaceSaved: number;
  averageRecordSize: number;
  patternMatchRate: number;
}

/**
 * Applies medical-specific compression patterns
 */
function applyMedicalPatterns(data: string): string {
  let processed = data;
  let matches = 0;
  let totalPatterns = 0;
  
  for (const category of Object.values(MEDICAL_PATTERNS)) {
    for (const [pattern, replacement] of Object.entries(category)) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matchCount = (data.match(regex) || []).length;
      matches += matchCount;
      totalPatterns++;
      processed = processed.replace(regex, replacement);
    }
  }
  
  return processed;
}

/**
 * Encrypts and compresses medical data
 */
export function encryptAndCompressMedicalData(data: string, encryptionKey: string): string {
  const patternCompressed = applyMedicalPatterns(data);
  const compressedData = compressBrailleText(patternCompressed, 'en');
  return CryptoJS.AES.encrypt(compressedData, encryptionKey).toString();
}

/**
 * Decrypts and decompresses medical data
 */
export function decryptAndDecompressMedicalData(encryptedData: string, encryptionKey: string): string {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(CryptoJS.enc.Utf8);
  return decompressBrailleText(decrypted, 'en');
}

/**
 * Generates a unique patient identifier
 */
export function generatePatientIdentifier(personalInfo: string): string {
  return CryptoJS.SHA256(personalInfo).toString();
}

/**
 * Creates a compressed and encrypted medical record
 */
export function createMedicalRecord(
  patientInfo: string,
  medicalData: string,
  encryptionKey: string,
  metadata?: MedicalRecord['metadata']
): MedicalRecord {
  const patientId = generatePatientIdentifier(patientInfo);
  const encryptedData = encryptAndCompressMedicalData(medicalData, encryptionKey);
  
  return {
    patientId,
    data: encryptedData,
    timestamp: Date.now(),
    metadata
  };
}

/**
 * Retrieves and decrypts a medical record
 */
export function retrieveMedicalRecord(
  record: MedicalRecord,
  encryptionKey: string
): string {
  return decryptAndDecompressMedicalData(record.data, encryptionKey);
}

/**
 * Calculates detailed compression statistics for medical data
 */
export function getMedicalDataStats(originalData: string, compressedData: string): CompressionStats {
  const originalSize = new Blob([originalData]).size;
  const compressedSize = new Blob([compressedData]).size;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
  
  // Calculate pattern match rate
  let patternMatches = 0;
  let totalPatterns = 0;
  
  for (const category of Object.values(MEDICAL_PATTERNS)) {
    for (const pattern of Object.keys(category)) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      patternMatches += (originalData.match(regex) || []).length;
      totalPatterns++;
    }
  }
  
  return {
    originalSize,
    compressedSize,
    compressionRatio,
    spaceSaved: originalSize - compressedSize,
    averageRecordSize: compressedSize,
    patternMatchRate: (patternMatches / totalPatterns) * 100
  };
}

/**
 * Projects future storage requirements based on growth rate
 */
export function projectStorageRequirements(
  currentRecordCount: number,
  averageRecordSize: number,
  growthRate: number,
  years: number
): StorageProjection[] {
  const projections: StorageProjection[] = [];
  let recordCount = currentRecordCount;
  
  for (let year = 0; year < years; year++) {
    recordCount *= (1 + growthRate);
    const originalSize = recordCount * averageRecordSize * 3; // Assuming uncompressed is 3x
    const compressedSize = recordCount * averageRecordSize;
    
    projections.push({
      year: new Date().getFullYear() + year,
      originalSize,
      compressedSize,
      spaceSaved: originalSize - compressedSize,
      recordCount: Math.round(recordCount)
    });
  }
  
  return projections;
}

/**
 * Analyzes potential storage impact across a healthcare system
 */
export function analyzeSystemwideImpact(
  hospitalCount: number,
  averageRecordsPerHospital: number,
  averageRecordSize: number
): {
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSaved: number;
  annualCostSavings: number;
} {
  const totalRecords = hospitalCount * averageRecordsPerHospital;
  const originalSize = totalRecords * averageRecordSize * 3;
  const compressedSize = totalRecords * averageRecordSize;
  const spaceSaved = originalSize - compressedSize;
  
  // Estimate cost savings (assuming $0.02 per GB per month for storage)
  const annualCostSavings = (spaceSaved / 1024 / 1024 / 1024) * 0.02 * 12;
  
  return {
    totalOriginalSize: originalSize,
    totalCompressedSize: compressedSize,
    totalSaved: spaceSaved,
    annualCostSavings
  };
}