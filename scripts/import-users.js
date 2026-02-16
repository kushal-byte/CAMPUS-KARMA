/**
 * Bulk User Import Script for Campus Karma Hub
 * Supports both CSV and Excel (.xlsx) files
 * 
 * This script imports student data and creates:
 * 1. Supabase Auth users (email + password)
 * 2. Profile records in the profiles table
 * 
 * Password: Last 5 digits of mobile number
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Read data from CSV or Excel file
 * @param {string} filePath - Path to the file
 * @returns {Array} Array of records
 */
function readDataFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv') {
        // Read CSV file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
    } else if (ext === '.xlsx' || ext === '.xls') {
        // Read Excel file
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Convert all values to strings
            defval: '' // Default value for empty cells
        });
    } else {
        throw new Error(`Unsupported file format: ${ext}. Use .csv, .xlsx, or .xls`);
    }
}

/**
 * Normalize column names (handle variations in Excel column names)
 * @param {Object} record - Original record
 * @returns {Object} Normalized record
 */
function normalizeRecord(record) {
    const normalized = {};

    // Map common column name variations
    const columnMap = {
        'name': ['name', 'Name', 'NAME', 'Full Name', 'Student Name', 'First Name', 'FirstName'],
        'middle_name': ['Middle Name', 'middle_name', 'MiddleName'],
        'last_name': ['Last Name', 'last_name', 'LastName', 'Surname'],
        'email': ['email', 'Email', 'EMAIL', 'Email Address', 'E-mail', 'Email ID', 'EmailID'],
        'mobile': ['mobile', 'Mobile', 'MOBILE', 'Phone', 'Mobile Number', 'Contact', 'Phone Number', 'Contact Number'],
        'role': ['role', 'Role', 'ROLE', 'User Role'],
        'college': ['college', 'College', 'COLLEGE', 'Institution'],
        'branch': ['branch', 'Branch', 'BRANCH', 'Department', 'Stream'],
        'year': ['year', 'Year', 'YEAR', 'Year of Study'],
        'bio': ['bio', 'Bio', 'BIO', 'About', 'Description'],
        'linkedin_url': ['linkedin_url', 'LinkedIn', 'linkedin', 'LinkedIn URL', 'LinkedIn Profile']
    };

    // Find and map columns
    for (const [targetKey, possibleNames] of Object.entries(columnMap)) {
        for (const possibleName of possibleNames) {
            if (record[possibleName] !== undefined && record[possibleName] !== '') {
                normalized[targetKey] = record[possibleName];
                break;
            }
        }
    }

    // Combine first, middle, and last names if present
    if (normalized.name || normalized.middle_name || normalized.last_name) {
        const nameParts = [
            normalized.name || '',
            normalized.middle_name || '',
            normalized.last_name || ''
        ].filter(part => part && part.trim() !== '');

        normalized.name = nameParts.join(' ').trim();
    }

    return normalized;
}

/**
 * Import users from file
 * @param {string} filePath - Path to the CSV or Excel file
 */
async function importUsers(filePath) {
    console.log('🚀 Starting bulk user import...\n');
    console.log(`📁 File: ${filePath}\n`);

    // Read and parse file
    let records;
    try {
        records = readDataFile(filePath);
        console.log(`📄 Found ${records.length} records\n`);

        // Show first record structure for debugging
        if (records.length > 0) {
            console.log('📋 Column headers detected:');
            console.log(Object.keys(records[0]).join(', '));
            console.log('');
        }
    } catch (error) {
        console.error('❌ Error reading file:', error.message);
        process.exit(1);
    }

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
        const rawRecord = records[i];
        const record = normalizeRecord(rawRecord);
        const rowNum = i + 2; // +2 for header row and 0-indexing

        console.log(`\n[${i + 1}/${records.length}] Processing: ${record.email || 'NO EMAIL'}`);

        try {
            // Validate required fields
            if (!record.email || !record.mobile || !record.name) {
                console.log(`⚠️  Row ${rowNum}: Missing required fields`);
                console.log(`   Name: ${record.name || 'MISSING'}`);
                console.log(`   Email: ${record.email || 'MISSING'}`);
                console.log(`   Mobile: ${record.mobile || 'MISSING'}`);
                results.skipped.push({
                    row: rowNum,
                    email: record.email,
                    reason: 'Missing required fields (name, email, or mobile)'
                });
                continue;
            }

            // Clean and validate email
            const email = record.email.toString().trim().toLowerCase();
            if (!email.includes('@')) {
                console.log(`⚠️  Row ${rowNum}: Invalid email format`);
                results.skipped.push({ row: rowNum, email, reason: 'Invalid email format' });
                continue;
            }

            // Generate password from last 5 digits of mobile
            const mobile = record.mobile.toString().replace(/\D/g, ''); // Remove non-digits
            if (mobile.length < 5) {
                console.log(`⚠️  Row ${rowNum}: Mobile number too short (${mobile})`);
                results.skipped.push({ row: rowNum, email, reason: 'Invalid mobile number' });
                continue;
            }
            const password = mobile.slice(-5);

            console.log(`   Creating user with password: ${password}`);

            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    name: record.name
                }
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    console.log(`⚠️  Row ${rowNum}: User already exists`);
                    results.skipped.push({ row: rowNum, email, reason: 'Already exists' });
                } else {
                    console.log(`❌ Row ${rowNum}: Auth error - ${authError.message}`);
                    results.failed.push({ row: rowNum, email, error: authError.message });
                }
                continue;
            }

            const userId = authData.user.id;

            // Create/update profile record
            const profileData = {
                id: userId,
                name: record.name,
                email: email,
                role: record.role || 'STUDENT',
                college: record.college || null,
                branch: record.branch || null,
                year: record.year ? parseInt(record.year) : null,
                bio: record.bio || null,
                linkedin_url: record.linkedin_url || null
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' });

            if (profileError) {
                console.log(`⚠️  Row ${rowNum}: Profile creation failed - ${profileError.message}`);
                results.success.push({
                    row: rowNum,
                    email,
                    userId,
                    password,
                    warning: 'Profile creation failed'
                });
            } else {
                console.log(`✅ Row ${rowNum}: User created successfully`);
                results.success.push({ row: rowNum, email, userId, password });
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.log(`❌ Row ${rowNum}: Unexpected error - ${error.message}`);
            results.failed.push({ row: rowNum, email: record.email, error: error.message });
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${results.success.length}`);
    console.log(`⚠️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`📝 Total processed: ${records.length}`);
    console.log('='.repeat(60));

    // Save detailed results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `import-results-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsFile}`);

    // Save credentials to file for easy reference
    if (results.success.length > 0) {
        const credentialsFile = `user-credentials-${timestamp}.txt`;
        let credentialsText = 'CAMPUS KARMA HUB - USER CREDENTIALS\n';
        credentialsText += '='.repeat(60) + '\n\n';
        results.success.forEach(user => {
            credentialsText += `Email: ${user.email}\n`;
            credentialsText += `Password: ${user.password}\n`;
            credentialsText += `User ID: ${user.userId}\n`;
            if (user.warning) credentialsText += `Warning: ${user.warning}\n`;
            credentialsText += '-'.repeat(60) + '\n';
        });
        fs.writeFileSync(credentialsFile, credentialsText);
        console.log(`📄 User credentials saved to: ${credentialsFile}`);
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed records:');
        results.failed.forEach(f => console.log(`   Row ${f.row}: ${f.email} - ${f.error}`));
    }

    if (results.skipped.length > 0) {
        console.log('\n⚠️  Skipped records:');
        results.skipped.forEach(s => console.log(`   Row ${s.row}: ${s.email || 'NO EMAIL'} - ${s.reason}`));
    }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
    console.error('❌ Usage: node import-users.js <path-to-file>');
    console.error('Example: node import-users.js ck.xlsx');
    console.error('Example: node import-users.js students.csv');
    console.error('\nSupported formats: .csv, .xlsx, .xls');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
}

importUsers(filePath)
    .then(() => {
        console.log('\n✅ Import process completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Import process failed:', error);
        process.exit(1);
    });
