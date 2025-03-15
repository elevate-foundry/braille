import { 
  createMedicalRecord,
  getMedicalDataStats,
  analyzeSystemwideImpact,
  projectStorageRequirements
} from './hospitalIdentifier.js';
import { analyzeWithAI } from './aiCompression.js';
import nodemailer from 'nodemailer';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DEMO_KEY = 'secure-demo-key-2024';

async function promptEmail(): Promise<string> {
  return new Promise((resolve) => {
    rl.question(chalk.cyan('Please enter your email to receive the whitepaper: '), (email) => {
      resolve(email);
    });
  });
}

async function sendWhitepaper(email: string, stats: any, aiAnalysis: any) {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const systemImpact = analyzeSystemwideImpact(5000, 20000, stats.averageRecordSize);
  const projections = projectStorageRequirements(1000000, stats.averageRecordSize, 0.05, 5);

  const whitepaper = `
    Medical Data Compression: A Technical Whitepaper
    ==============================================

    Executive Summary
    ----------------
    This whitepaper explores advanced compression techniques for medical data, combining traditional 
    pattern-based compression with AI-enhanced semantic analysis. Our research demonstrates significant 
    storage savings while maintaining data integrity and accessibility.

    1. Compression Analysis
    ----------------------
    - Original Size: ${stats.originalSize} bytes
    - Compressed Size: ${stats.compressedSize} bytes
    - Compression Ratio: ${stats.compressionRatio.toFixed(2)}%
    - Pattern Match Rate: ${stats.patternMatchRate.toFixed(2)}%
    - Semantic Preservation Score: ${(aiAnalysis.semanticScore * 100).toFixed(2)}%

    2. AI Analysis Insights
    ----------------------
    ${aiAnalysis.summary}

    Key Medical Concepts:
    ${aiAnalysis.keywords.join(', ')}

    3. System-wide Impact
    --------------------
    - Total Potential Storage Savings: ${(systemImpact.totalSaved / 1024 / 1024 / 1024).toFixed(2)} GB
    - Estimated Annual Cost Savings: $${systemImpact.annualCostSavings.toFixed(2)}

    4. Future Projections
    -------------------
    ${projections.map(p => `
    Year ${p.year}:
    - Records: ${p.recordCount.toLocaleString()}
    - Space Saved: ${(p.spaceSaved / 1024 / 1024 / 1024).toFixed(2)} GB
    `).join('\n')}

    5. Technical Implementation
    -------------------------
    Our compression system employs a multi-layered approach:
    1. Pattern-based medical terminology compression
    2. Braille-based encoding for common medical phrases
    3. AI-enhanced semantic analysis for context preservation
    4. Secure encryption for data protection

    6. Conclusion
    ------------
    The implemented compression system demonstrates significant potential for healthcare 
    organizations, offering both storage efficiency and cost savings while maintaining 
    data integrity and accessibility.
  `;

  const info = await transporter.sendMail({
    from: '"Medical Compression Research" <research@example.com>',
    to: email,
    subject: "Medical Data Compression Whitepaper",
    text: whitepaper,
  });

  console.log(chalk.green("\nWhitepaper sent! Preview URL: ") + chalk.blue(nodemailer.getTestMessageUrl(info)));
}

async function runDemo() {
  console.log(chalk.cyan('\n=== Medical Data Compression Demo ===\n'));
  
  const email = await promptEmail();
  
  console.log(chalk.yellow('\nAnalyzing compression patterns...'));
  
  const record = createMedicalRecord(
    'Demo Patient',
    'Sample medical data for compression analysis',
    DEMO_KEY
  );
  
  const stats = getMedicalDataStats('Sample medical data', record.data);
  const aiAnalysis = await analyzeWithAI('Sample medical data');
  
  console.log(chalk.green('\nCompression Analysis:'));
  console.log(`Compression Ratio: ${stats.compressionRatio.toFixed(2)}%`);
  console.log(`Space Saved: ${stats.spaceSaved} bytes`);
  
  console.log(chalk.yellow('\nGenerating and sending whitepaper...'));
  await sendWhitepaper(email, stats, aiAnalysis);
  
  console.log(chalk.green('\nDemo completed! Check your email for the whitepaper.'));
  rl.close();
}

runDemo().catch(console.error);