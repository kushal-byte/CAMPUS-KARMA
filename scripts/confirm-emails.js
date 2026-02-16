/**
 * Confirm all user emails in Supabase
 * This script will mark all users' emails as confirmed
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

async function confirmAllEmails() {
    console.log('🔄 Starting email confirmation process...\n');

    // Read the import results to get all user IDs
    const resultsFiles = fs.readdirSync('.').filter(f => f.startsWith('import-results-') && f.endsWith('.json'));
    if (resultsFiles.length === 0) {
        console.error('❌ No import results file found');
        process.exit(1);
    }

    const latestResults = resultsFiles.sort().reverse()[0];
    const results = JSON.parse(fs.readFileSync(latestResults, 'utf-8'));

    console.log(`📄 Found ${results.success.length} users to confirm\n`);

    let confirmed = 0;
    let failed = 0;

    for (const user of results.success) {
        try {
            const { error } = await supabase.auth.admin.updateUserById(
                user.userId,
                { email_confirm: true }
            );

            if (error) {
                console.log(`❌ Failed to confirm ${user.email}: ${error.message}`);
                failed++;
            } else {
                console.log(`✅ Confirmed ${user.email}`);
                confirmed++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
            console.log(`❌ Error confirming ${user.email}: ${error.message}`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 CONFIRMATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully confirmed: ${confirmed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total processed: ${results.success.length}`);
    console.log('='.repeat(60));
}

confirmAllEmails()
    .then(() => {
        console.log('\n✅ Email confirmation process completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Email confirmation process failed:', error);
        process.exit(1);
    });
