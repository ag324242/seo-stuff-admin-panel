export const dynamic = 'force-dynamic'; // Disable static generation

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { User } from '../../../types/user/type';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const searchTerm = searchParams.get("search") || ""
        const perPage = 100; // Max per request
        const createdAt = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        const formattedDate = createdAt.getFullYear() + '-' +
                      String(createdAt.getMonth() + 1).padStart(2, '0') + '-' +
                      String(createdAt.getDate()).padStart(2, '0') + ':' +
                      String(createdAt.getHours()).padStart(2, '0') + ':' +
                      String(createdAt.getMinutes()).padStart(2, '0') + ':' +
                      String(createdAt.getSeconds()).padStart(2, '0') + 
                      '.' + String(createdAt.getMilliseconds()).padStart(3, '0');


        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: totalUsers } = await supabase
            .rpc('get_total_users', { search_term: searchTerm });


        let { data, error } = await supabase
            .rpc('search_users', {
                search_term: searchTerm,
                page_limit: perPage,
                page_offset: (page - 1) * perPage
            });

        if (error) throw error;

        const totalUsersSafe = totalUsers ?? 0; 
        const totalPages = Math.ceil(totalUsersSafe / perPage);

        // Map through the users and get credits data for each user
        const usersWithCredits = await Promise.all(
            data.map(async (user:User) => {
                // Fetch credit data where user_id matches the current user's id and calculate the sum
                const creditsData = await supabase
                    .from('credits')
                    .select('credits, created_at')
                    .eq('user_id', user.id)
                    .gt('created_at', formattedDate)
                    .then(res => res?.data ? res.data.reduce((sum, row) => sum + row.credits, 0) : 0);
        
                // Fetch reports data where user_id matches the current user's id and calculate the sum
                const reportsData = await supabase
                    .from('reports')
                    .select('credits, created_at')
                    .eq('user_id', user.id)
                    .gt('created_at', formattedDate)
                    .then(res => res?.data ? res.data.reduce((sum, row) => sum + row.credits, 0) : 0);
        
                // Return user data along with their credits and reports sums
                let totalCredits = (creditsData - reportsData) || 0
                return {
                    ...user,
                    credits: totalCredits > 0 ? totalCredits : 0, // default to 0 if no credits found
                };
            })
        );
        
        return NextResponse.json({ users: usersWithCredits, totalPages: totalPages });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}