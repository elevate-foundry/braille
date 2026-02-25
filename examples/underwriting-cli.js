#!/usr/bin/env node

/**
 * Command-line interface for Bank Transaction to Braille Underwriting
 * 
 * Usage:
 *   node underwriting-cli.js <csv-file> [output-format]
 * 
 * Example:
 *   node underwriting-cli.js transactions.csv html
 *   node underwriting-cli.js transactions.csv json > audit.json
 */

const fs = require('fs');
const path = require('path');

// Load the converter module
const TransactionBrailleConverter = require('../js/transaction-braille-converter.js');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Bank Transaction to Braille Underwriting - CLI Tool

USAGE:
    node underwriting-cli.js <csv-file> [format] [options]

ARGUMENTS:
    csv-file        Path to CSV file containing bank transactions
    format          Output format: txt, json, or html (default: txt)

OPTIONS:
    --output, -o    Output file path (default: stdout)
    --summary       Show summary only (no full audit file)
    --metrics       Show metrics only
    --help, -h      Show this help message

EXAMPLES:
    # Process CSV and output to console
    node underwriting-cli.js transactions.csv

    # Generate HTML audit file
    node underwriting-cli.js transactions.csv html -o audit.html

    # Generate JSON and save to file
    node underwriting-cli.js transactions.csv json > audit.json

    # Show summary metrics only
    node underwriting-cli.js transactions.csv --summary

CSV FORMAT:
    Required columns: date, description, amount
    Optional columns: balance, category, type

    Example:
    date,description,amount,balance,category
    2024-01-01,Salary,5000.00,5000.00,income
    2024-01-02,Rent,-1500.00,3500.00,housing

For more information, see TRANSACTION-UNDERWRITING-README.md
`);
    process.exit(0);
}

// Get input file
const inputFile = args[0];
if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
}

// Get output format
let format = 'txt';
let outputFile = null;
let summaryOnly = false;
let metricsOnly = false;

for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--output' || arg === '-o') {
        outputFile = args[++i];
    } else if (arg === '--summary') {
        summaryOnly = true;
    } else if (arg === '--metrics') {
        metricsOnly = true;
    } else if (['txt', 'json', 'html'].includes(arg)) {
        format = arg;
    }
}

// Read CSV file
let csvData;
try {
    csvData = fs.readFileSync(inputFile, 'utf8');
} catch (error) {
    console.error(`Error reading file: ${error.message}`);
    process.exit(1);
}

// Process transactions
const converter = new TransactionBrailleConverter();
const result = converter.process(csvData, format);

if (!result.success) {
    console.error(`Error processing transactions: ${result.error}`);
    process.exit(1);
}

// Generate output
let output;

if (metricsOnly) {
    // Show metrics only
    const summary = result.summary;
    output = JSON.stringify({
        totalTransactions: summary.totalTransactions,
        dateRange: summary.dateRange,
        income: {
            total: summary.income.total,
            count: summary.income.count,
            average: summary.income.average
        },
        expenses: {
            total: summary.expenses.total,
            count: summary.expenses.count,
            average: summary.expenses.average
        },
        netCashFlow: summary.netCashFlow,
        averageBalance: summary.averageBalance,
        riskIndicators: summary.riskIndicators.length,
        recurringPayments: summary.recurringPayments.length,
        unusualActivity: summary.unusualActivity.length
    }, null, 2);
} else if (summaryOnly) {
    // Show summary only
    const summary = result.summary;
    const brailleOutput = converter.convertSummaryToBraille(summary);
    output = brailleOutput.text;
} else {
    // Full audit file
    output = result.auditFile;
}

// Write output
if (outputFile) {
    try {
        fs.writeFileSync(outputFile, output, 'utf8');
        console.error(`✅ Audit file generated: ${outputFile}`);
        console.error(`   Format: ${format.toUpperCase()}`);
        console.error(`   Transactions: ${result.summary.totalTransactions}`);
        console.error(`   Period: ${result.summary.dateRange.start} to ${result.summary.dateRange.end}`);
        console.error(`   Net Cash Flow: $${result.summary.netCashFlow.toFixed(2)}`);
        
        if (result.summary.riskIndicators.length > 0) {
            console.error(`   ⚠️  Risk Indicators: ${result.summary.riskIndicators.length}`);
        }
    } catch (error) {
        console.error(`Error writing output file: ${error.message}`);
        process.exit(1);
    }
} else {
    // Output to stdout
    console.log(output);
}

// Exit successfully
process.exit(0);
