import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url); // Get the full request URL
        const loggedInUserId = url.searchParams.get('userId'); // Extract userId

        if (!loggedInUserId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch all users from Supabase Auth
        const { data, error } = await supabase.auth.admin.listUsers();

        if (error) throw error;

        // Filter out the logged-in user
        const filteredUsers = data.users.filter(u => u.id !== loggedInUserId);

        return NextResponse.json({ users: filteredUsers });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
