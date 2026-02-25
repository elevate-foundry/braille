/**
 * Bank Transaction to Braille Summary Converter
 * Converts structured CSV bank transaction data into braille summaries for underwriting audits
 */

class TransactionBrailleConverter {
    constructor() {
        this.brailleAlphabet = this.initializeBrailleAlphabet();
        this.numberSign = [0, 0, 1, 1, 1, 1]; // # indicator for numbers
        this.decimalPoint = [0, 1, 0, 0, 1, 1]; // . in braille
        this.comma = [0, 1, 0, 0, 0, 0]; // , in braille
        this.space = [0, 0, 0, 0, 0, 0]; // space
        this.capitalSign = [0, 0, 0, 0, 0, 1]; // capital letter indicator
    }

    initializeBrailleAlphabet() {
        return {
            // Letters
            'a': [1, 0, 0, 0, 0, 0], 'b': [1, 1, 0, 0, 0, 0], 'c': [1, 0, 0, 1, 0, 0],
            'd': [1, 0, 0, 1, 1, 0], 'e': [1, 0, 0, 0, 1, 0], 'f': [1, 1, 0, 1, 0, 0],
            'g': [1, 1, 0, 1, 1, 0], 'h': [1, 1, 0, 0, 1, 0], 'i': [0, 1, 0, 1, 0, 0],
            'j': [0, 1, 0, 1, 1, 0], 'k': [1, 0, 1, 0, 0, 0], 'l': [1, 1, 1, 0, 0, 0],
            'm': [1, 0, 1, 1, 0, 0], 'n': [1, 0, 1, 1, 1, 0], 'o': [1, 0, 1, 0, 1, 0],
            'p': [1, 1, 1, 1, 0, 0], 'q': [1, 1, 1, 1, 1, 0], 'r': [1, 1, 1, 0, 1, 0],
            's': [0, 1, 1, 1, 0, 0], 't': [0, 1, 1, 1, 1, 0], 'u': [1, 0, 1, 0, 0, 1],
            'v': [1, 1, 1, 0, 0, 1], 'w': [0, 1, 0, 1, 1, 1], 'x': [1, 0, 1, 1, 0, 1],
            'y': [1, 0, 1, 1, 1, 1], 'z': [1, 0, 1, 0, 1, 1],
            
            // Numbers (use same patterns as a-j)
            '1': [1, 0, 0, 0, 0, 0], '2': [1, 1, 0, 0, 0, 0], '3': [1, 0, 0, 1, 0, 0],
            '4': [1, 0, 0, 1, 1, 0], '5': [1, 0, 0, 0, 1, 0], '6': [1, 1, 0, 1, 0, 0],
            '7': [1, 1, 0, 1, 1, 0], '8': [1, 1, 0, 0, 1, 0], '9': [0, 1, 0, 1, 0, 0],
            '0': [0, 1, 0, 1, 1, 0],
            
            // Special characters
            '.': [0, 1, 0, 0, 1, 1], ',': [0, 1, 0, 0, 0, 0], '-': [0, 0, 1, 0, 0, 1],
            ':': [0, 1, 0, 0, 1, 0], '/': [0, 0, 1, 1, 0, 1], '$': [0, 1, 1, 0, 1, 1],
            '%': [0, 1, 1, 0, 0, 1], '(': [0, 1, 1, 0, 1, 0], ')': [0, 1, 1, 0, 1, 0]
        };
    }

    /**
     * Parse CSV data into structured transaction objects
     * @param {string} csvData - Raw CSV string
     * @returns {Array} Array of transaction objects
     */
    parseCSV(csvData) {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must contain header row and at least one transaction');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const transaction = {};
            headers.forEach((header, index) => {
                transaction[header] = values[index] ? values[index].trim() : '';
            });
            transactions.push(transaction);
        }

        return transactions;
    }

    /**
     * Parse a single CSV line handling quoted values
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    /**
     * Analyze transactions and generate underwriting summary
     * @param {Array} transactions - Array of transaction objects
     * @returns {Object} Summary object with key metrics
     */
    generateUnderwritingSummary(transactions) {
        if (!transactions || transactions.length === 0) {
            throw new Error('No transactions to analyze');
        }

        const summary = {
            totalTransactions: transactions.length,
            dateRange: this.getDateRange(transactions),
            income: { total: 0, count: 0, average: 0, sources: {} },
            expenses: { total: 0, count: 0, average: 0, categories: {} },
            netCashFlow: 0,
            averageBalance: 0,
            largestDeposit: 0,
            largestWithdrawal: 0,
            recurringPayments: [],
            unusualActivity: [],
            riskIndicators: []
        };

        let balanceSum = 0;
        const amounts = [];

        transactions.forEach(transaction => {
            const amount = this.parseAmount(transaction.amount);
            const balance = this.parseAmount(transaction.balance);
            const description = (transaction.description || '').toLowerCase();
            const category = transaction.category || 'uncategorized';

            amounts.push(amount);

            // Track income vs expenses
            if (amount > 0) {
                summary.income.total += amount;
                summary.income.count++;
                summary.income.sources[category] = (summary.income.sources[category] || 0) + amount;
                if (amount > summary.largestDeposit) {
                    summary.largestDeposit = amount;
                }
            } else if (amount < 0) {
                const absAmount = Math.abs(amount);
                summary.expenses.total += absAmount;
                summary.expenses.count++;
                summary.expenses.categories[category] = (summary.expenses.categories[category] || 0) + absAmount;
                if (absAmount > summary.largestWithdrawal) {
                    summary.largestWithdrawal = absAmount;
                }
            }

            if (balance) {
                balanceSum += balance;
            }

            // Detect unusual activity
            if (Math.abs(amount) > 10000) {
                summary.unusualActivity.push({
                    date: transaction.date,
                    amount: amount,
                    description: description
                });
            }

            // Detect risk indicators
            if (description.includes('overdraft') || description.includes('nsf') || 
                description.includes('insufficient') || balance < 0) {
                summary.riskIndicators.push({
                    type: 'overdraft',
                    date: transaction.date,
                    description: description
                });
            }
        });

        // Calculate averages
        summary.income.average = summary.income.count > 0 ? 
            summary.income.total / summary.income.count : 0;
        summary.expenses.average = summary.expenses.count > 0 ? 
            summary.expenses.total / summary.expenses.count : 0;
        summary.netCashFlow = summary.income.total - summary.expenses.total;
        summary.averageBalance = balanceSum / transactions.length;

        // Detect recurring payments
        summary.recurringPayments = this.detectRecurringPayments(transactions);

        return summary;
    }

    /**
     * Parse amount from string, handling various formats
     */
    parseAmount(amountStr) {
        if (!amountStr) return 0;
        // Remove currency symbols and commas
        const cleaned = amountStr.toString().replace(/[$,]/g, '');
        return parseFloat(cleaned) || 0;
    }

    /**
     * Get date range from transactions
     */
    getDateRange(transactions) {
        const dates = transactions
            .map(t => new Date(t.date))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a - b);

        if (dates.length === 0) {
            return { start: 'Unknown', end: 'Unknown', days: 0 };
        }

        const start = dates[0];
        const end = dates[dates.length - 1];
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            days: days
        };
    }

    /**
     * Detect recurring payments in transactions
     */
    detectRecurringPayments(transactions) {
        const paymentGroups = {};
        
        transactions.forEach(t => {
            const amount = this.parseAmount(t.amount);
            if (amount >= 0) return; // Only look at expenses
            
            const desc = (t.description || '').toLowerCase().trim();
            const key = `${desc}_${Math.abs(amount).toFixed(2)}`;
            
            if (!paymentGroups[key]) {
                paymentGroups[key] = [];
            }
            paymentGroups[key].push(new Date(t.date));
        });

        const recurring = [];
        Object.entries(paymentGroups).forEach(([key, dates]) => {
            if (dates.length >= 2) {
                dates.sort((a, b) => a - b);
                const intervals = [];
                for (let i = 1; i < dates.length; i++) {
                    const days = Math.ceil((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
                    intervals.push(days);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                
                // Consider it recurring if average interval is between 7-35 days
                if (avgInterval >= 7 && avgInterval <= 35) {
                    const [desc, amount] = key.split('_');
                    recurring.push({
                        description: desc,
                        amount: parseFloat(amount),
                        frequency: Math.round(avgInterval),
                        occurrences: dates.length
                    });
                }
            }
        });

        return recurring;
    }

    /**
     * Convert text to braille dots representation
     * @param {string} text - Text to convert
     * @returns {Array} Array of braille dot patterns
     */
    textToBraille(text) {
        const braillePatterns = [];
        let inNumber = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const lowerChar = char.toLowerCase();

            if (char === ' ') {
                braillePatterns.push(this.space);
                inNumber = false;
                continue;
            }

            // Handle numbers
            if (/\d/.test(char)) {
                if (!inNumber) {
                    braillePatterns.push(this.numberSign);
                    inNumber = true;
                }
                braillePatterns.push(this.brailleAlphabet[char]);
            }
            // Handle letters
            else if (/[a-z]/i.test(char)) {
                inNumber = false;
                // Add capital indicator if uppercase
                if (char === char.toUpperCase()) {
                    braillePatterns.push(this.capitalSign);
                }
                braillePatterns.push(this.brailleAlphabet[lowerChar]);
            }
            // Handle special characters
            else if (this.brailleAlphabet[char]) {
                inNumber = false;
                braillePatterns.push(this.brailleAlphabet[char]);
            }
        }

        return braillePatterns;
    }

    /**
     * Convert braille dots to Unicode braille characters
     * @param {Array} braillePatterns - Array of 6-dot patterns
     * @returns {string} Unicode braille string
     */
    brailleToUnicode(braillePatterns) {
        return braillePatterns.map(pattern => {
            // Unicode braille starts at U+2800
            // Each dot adds: dot1=1, dot2=2, dot3=4, dot4=8, dot5=16, dot6=32
            const value = pattern.reduce((sum, dot, index) => {
                return sum + (dot ? Math.pow(2, index) : 0);
            }, 0);
            return String.fromCharCode(0x2800 + value);
        }).join('');
    }

    /**
     * Format summary as human-readable text
     * @param {Object} summary - Summary object
     * @returns {string} Formatted text summary
     */
    formatSummaryText(summary) {
        let text = 'UNDERWRITING SUMMARY\n\n';
        
        text += `Period: ${summary.dateRange.start} to ${summary.dateRange.end}\n`;
        text += `Duration: ${summary.dateRange.days} days\n`;
        text += `Total Transactions: ${summary.totalTransactions}\n\n`;
        
        text += 'INCOME ANALYSIS\n';
        text += `Total Income: $${summary.income.total.toFixed(2)}\n`;
        text += `Income Transactions: ${summary.income.count}\n`;
        text += `Average Income: $${summary.income.average.toFixed(2)}\n`;
        text += `Largest Deposit: $${summary.largestDeposit.toFixed(2)}\n\n`;
        
        text += 'EXPENSE ANALYSIS\n';
        text += `Total Expenses: $${summary.expenses.total.toFixed(2)}\n`;
        text += `Expense Transactions: ${summary.expenses.count}\n`;
        text += `Average Expense: $${summary.expenses.average.toFixed(2)}\n`;
        text += `Largest Withdrawal: $${summary.largestWithdrawal.toFixed(2)}\n\n`;
        
        text += 'CASH FLOW\n';
        text += `Net Cash Flow: $${summary.netCashFlow.toFixed(2)}\n`;
        text += `Average Balance: $${summary.averageBalance.toFixed(2)}\n\n`;
        
        if (summary.recurringPayments.length > 0) {
            text += 'RECURRING PAYMENTS\n';
            summary.recurringPayments.slice(0, 5).forEach(payment => {
                text += `${payment.description}: $${payment.amount.toFixed(2)} every ${payment.frequency} days\n`;
            });
            text += '\n';
        }
        
        if (summary.riskIndicators.length > 0) {
            text += 'RISK INDICATORS\n';
            text += `Overdraft/NSF Events: ${summary.riskIndicators.length}\n\n`;
        }
        
        if (summary.unusualActivity.length > 0) {
            text += 'UNUSUAL ACTIVITY\n';
            text += `Large Transactions (>$10,000): ${summary.unusualActivity.length}\n`;
        }
        
        return text;
    }

    /**
     * Convert summary to braille format
     * @param {Object} summary - Summary object
     * @returns {Object} Object with text and braille versions
     */
    convertSummaryToBraille(summary) {
        const textSummary = this.formatSummaryText(summary);
        const lines = textSummary.split('\n');
        
        const brailleLines = lines.map(line => {
            const braillePatterns = this.textToBraille(line);
            return {
                text: line,
                braille: this.brailleToUnicode(braillePatterns),
                dots: braillePatterns
            };
        });

        return {
            text: textSummary,
            braille: brailleLines.map(l => l.braille).join('\n'),
            structured: brailleLines,
            summary: summary
        };
    }

    /**
     * Generate audit file with both text and braille versions
     * @param {Object} summary - Summary object
     * @param {string} format - Output format ('json', 'txt', 'html')
     * @returns {string} Formatted audit file content
     */
    generateAuditFile(summary, format = 'txt') {
        const brailleOutput = this.convertSummaryToBraille(summary);
        const timestamp = new Date().toISOString();

        if (format === 'json') {
            return JSON.stringify({
                metadata: {
                    generatedAt: timestamp,
                    version: '1.0',
                    type: 'underwriting-summary'
                },
                summary: summary,
                textVersion: brailleOutput.text,
                brailleVersion: brailleOutput.braille,
                structuredBraille: brailleOutput.structured
            }, null, 2);
        } else if (format === 'html') {
            return this.generateHTMLAuditFile(brailleOutput, timestamp);
        } else {
            // Default text format
            let output = '='.repeat(60) + '\n';
            output += 'UNDERWRITING AUDIT FILE\n';
            output += `Generated: ${timestamp}\n`;
            output += '='.repeat(60) + '\n\n';
            output += 'TEXT VERSION\n';
            output += '-'.repeat(60) + '\n';
            output += brailleOutput.text + '\n\n';
            output += '='.repeat(60) + '\n';
            output += 'BRAILLE VERSION\n';
            output += '-'.repeat(60) + '\n';
            output += brailleOutput.braille + '\n';
            output += '='.repeat(60) + '\n';
            return output;
        }
    }

    /**
     * Generate HTML audit file with side-by-side text and braille
     */
    generateHTMLAuditFile(brailleOutput, timestamp) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Underwriting Audit File</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .panel {
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .panel h2 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .braille-text {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            line-height: 1.8;
            white-space: pre-wrap;
        }
        .text-content {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        .metadata {
            background: #ecf0f1;
            padding: 10px;
            border-radius: 3px;
            font-size: 12px;
            color: #7f8c8d;
        }
        @media print {
            body { background: white; }
            .panel { box-shadow: none; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Underwriting Audit File</h1>
        <div class="metadata">
            Generated: ${timestamp}<br>
            Version: 1.0<br>
            Type: Bank Transaction Analysis
        </div>
    </div>
    
    <div class="container">
        <div class="panel">
            <h2>Text Version</h2>
            <div class="text-content">${this.escapeHtml(brailleOutput.text)}</div>
        </div>
        
        <div class="panel">
            <h2>Braille Version</h2>
            <div class="braille-text">${brailleOutput.braille}</div>
        </div>
    </div>
    
    <div class="panel">
        <h2>Summary Metrics</h2>
        <div class="text-content">${this.escapeHtml(JSON.stringify(brailleOutput.summary, null, 2))}</div>
    </div>
</body>
</html>`;
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        // Node.js compatible HTML escaping
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Main processing function
     * @param {string} csvData - Raw CSV data
     * @param {string} outputFormat - Output format ('json', 'txt', 'html')
     * @returns {Object} Processing result with audit file
     */
    process(csvData, outputFormat = 'txt') {
        try {
            const transactions = this.parseCSV(csvData);
            const summary = this.generateUnderwritingSummary(transactions);
            const auditFile = this.generateAuditFile(summary, outputFormat);
            
            return {
                success: true,
                transactions: transactions,
                summary: summary,
                auditFile: auditFile,
                format: outputFormat
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionBrailleConverter;
} else {
    window.TransactionBrailleConverter = TransactionBrailleConverter;
}
