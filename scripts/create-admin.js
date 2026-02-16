/**
 * Create Admin User Script
 * Creates a specific admin user with provided credentials
 */

import { createClient } from '@supabase/supabase-js';
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = 'admin@bnmit.in';
    const password = '12345'; // Note: In production, use stronger passwords!
    const name = 'System Admin';

    console.log(`🚀 Creating admin user: ${email}...`);

    try {
        // 1. Create Auth User
        let userId;

        // Check if user exists first to avoid error or duplicate attempts
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === email);

        if (existingUser) {
            console.log('⚠️  User already exists in Auth. Updating password...');
            userId = existingUser.id;

            const { error: updateError } = await supabase.auth.admin.updateUserById(
                userId,
                { password: password, email_confirm: true }
            );

            if (updateError) throw updateError;
            console.log('✅ Password updated successfully');
        } else {
            // Create new user
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name }
            });

            if (error) throw error;
            userId = data.user.id;
            console.log('✅ Auth user created successfully');
        }

        // 2. Create/Update Profile with ADMIN role
        const profileData = {
            id: userId,
            name: name,
            email: email,
            role: 'ADMIN', // Critical: Set role to ADMIN
            college: 'BNMIT',
            bio: 'Campus Administrator'
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

        if (profileError) throw profileError;

        console.log('✅ Profile created with ADMIN role');
        console.log('\nLogin Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ADMIN`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
