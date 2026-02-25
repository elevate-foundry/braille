import { 
  createMedicalRecord, 
  retrieveMedicalRecord, 
  getMedicalDataStats,
  analyzeSystemwideImpact,
  projectStorageRequirements
} from './hospitalIdentifier.js';
import { analyzeWithAI, enhanceCompression } from './aiCompression.js';
import nodemailer from 'nodemailer';
import Table from 'cli-table3';
import chalk from 'chalk';
import { config } from 'dotenv';

// Initialize environment variables
config();

// Sample medical records with comprehensive data
const sampleMedicalData = `
Patient presents with hypertension and type 2 diabetes mellitus.
Blood pressure: 140/90 mmHg
Heart rate: 82 bpm
Temperature: 98.6°F
Respiratory rate: 16/min
Oxygen saturation: 98% on room air

Medications:
- Lisinopril 10mg daily for blood pressure
- Metformin 500mg twice daily for diabetes
- Aspirin 81mg daily for cardiovascular prevention
Last A1C: 7.2%
Blood Glucose: 142 mg/dL (fasting)

Medical History:
- Hypertension diagnosed 2018, well-controlled on current regimen
- Type 2 Diabetes diagnosed 2019, moderate control
- Family history of cardiovascular disease
- No known drug allergies
- Appendectomy 2010
- Annual flu vaccinations up to date

Physical Examination:
- Weight: 85 kilograms
- Height: 175 centimeters
- BMI: 27.8
- Heart: Regular rate and rhythm, no murmurs
- Lungs: Clear to auscultation bilaterally
- Abdomen: Soft, non-tender`;

// Demo encryption key (in production, use secure key management)
const DEMO_KEY = 'secure-demo-key-2024';

async function generateBedtimeStory() {
  // Simple bedtime stories for educational purposes
  const stories = [
    "Once upon a time, a magical unicorn named Sparkle helped children learn braille by creating colorful patterns with its horn.",
    "In a land of dreams, a gentle unicorn taught the stars how to write messages in braille for sleepy children to discover.",
    "The rainbow unicorn danced across the night sky, leaving trails of braille patterns that spelled out sweet dreams for all children below.",
    "Luna the unicorn used her glowing horn to create braille constellations, helping visually impaired children navigate the night sky.",
    "Every night, the guardian unicorn visits children's dreams and teaches them the magic of reading with their fingertips."
  ];
  
  // Select a random story
  const randomStory = stories[Math.floor(Math.random() * stories.length)];

  console.log(chalk.magenta('\nAI Generated Bedtime Story:'));
  console.log(chalk.cyan(randomStory));
}

async function sendCompressionReport(stats: any, email: string) {
  // Create a test account
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

  const projections = projectStorageRequirements(1000000, stats.averageRecordSize, 0.05, 5);
  const systemImpact = analyzeSystemwideImpact(5000, 20000, stats.averageRecordSize);

  const htmlReport = `
    <h2>Medical Record Compression Analysis</h2>
    <h3>Basic Statistics</h3>
    <ul>
      <li>Original Size: ${stats.originalSize} bytes</li>
      <li>Compressed Size: ${stats.compressedSize} bytes</li>
      <li>Compression Ratio: ${stats.compressionRatio.toFixed(2)}%</li>
      <li>Space Saved: ${stats.spaceSaved} bytes</li>
      <li>Pattern Match Rate: ${stats.patternMatchRate.toFixed(2)}%</li>
    </ul>

    <h3>5-Year Projection</h3>
    <table border="1">
      <tr><th>Year</th><th>Records</th><th>Space Saved (GB)</th></tr>
      ${projections.map(p => `
        <tr>
          <td>${p.year}</td>
          <td>${p.recordCount.toLocaleString()}</td>
          <td>${(p.spaceSaved / 1024 / 1024 / 1024).toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>

    <h3>System-wide Impact</h3>
    <ul>
      <li>Total Space Saved: ${(systemImpact.totalSaved / 1024 / 1024 / 1024).toFixed(2)} GB</li>
      <li>Estimated Annual Cost Savings: $${systemImpact.annualCostSavings.toFixed(2)}</li>
    </ul>`;

  const info = await transporter.sendMail({
    from: '"Compression Analysis" <compression@example.com>',
    to: email,
    subject: "Medical Record Compression Analysis Report",
    html: htmlReport,
  });

  console.log(chalk.green("\nEmail Report Preview URL: ") + chalk.blue(nodemailer.getTestMessageUrl(info)));
}

async function demonstrateMedicalCompression(email?: string) {
  console.log(chalk.cyan('=== Medical Record Compression Demonstration ===\n'));
  
  // Create an encrypted and compressed medical record
  const record = createMedicalRecord(
    'John Doe 1970-01-01',
    sampleMedicalData,
    DEMO_KEY
  );
  
  // Calculate compression statistics
  const stats = getMedicalDataStats(sampleMedicalData, record.data);
  
  // Create a table for the results
  const table = new Table({
    head: [chalk.green('Metric'), chalk.green('Value')],
    style: { head: [], border: [] }
  });

  // Perform AI analysis
  console.log(chalk.yellow('\nPerforming AI analysis...'));
  const aiAnalysis = await analyzeWithAI(sampleMedicalData);
  const enhancedCompressed = await enhanceCompression(sampleMedicalData, record.data);

  table.push(
    ['Original Size', `${stats.originalSize} bytes`],
    ['Compressed Size', `${stats.compressedSize} bytes`],
    ['Compression Ratio', `${stats.compressionRatio.toFixed(2)}%`],
    ['Space Saved', `${stats.spaceSaved} bytes`],
    ['Pattern Match Rate', `${stats.patternMatchRate.toFixed(2)}%`],
    ['Semantic Score', `${(aiAnalysis.semanticScore * 100).toFixed(2)}%`]
  );

  console.log(table.toString());

  // Generate a bedtime story as a fun demo of the AI capabilities
  await generateBedtimeStory();

  if (email) {
    console.log(chalk.yellow('\nSending detailed report via email...'));
    await sendCompressionReport(stats, email);
  }

  // Project future storage requirements
  const projections = projectStorageRequirements(1000000, stats.averageRecordSize, 0.05, 5);
  
  console.log(chalk.cyan('\n5-Year Storage Projection:'));
  const projectionTable = new Table({
    head: [chalk.green('Year'), chalk.green('Records'), chalk.green('Space Saved (GB)')],
    style: { head: [], border: [] }
  });

  projections.forEach(p => {
    projectionTable.push([
      p.year.toString(),
      p.recordCount.toLocaleString(),
      (p.spaceSaved / 1024 / 1024 / 1024).toFixed(2)
    ]);
  });

  console.log(projectionTable.toString());
}

// Run the demonstration with optional email parameter
const email = process.argv[2];
demonstrateMedicalCompression(email).catch(error => {
  console.error(chalk.red('Demonstration failed:', error.message));
});