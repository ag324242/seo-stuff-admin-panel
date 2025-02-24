export const dynamic = 'force-dynamic'; // Disable static generation

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const loggedInUserId = searchParams.get("userId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const perPage = 100; // Max per request

        if (!loggedInUserId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage,
        });

        if (error) throw error;

        return NextResponse.json({ users: data.users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}