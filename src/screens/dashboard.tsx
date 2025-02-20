"use client";

import { useSupabaseAuthContext } from "@/app-kit/supabase/SupabaseAuthContext";
import supabaseBrowserClient from "@/app-kit/supabase/supabaseClient";
import supabaseServerClient from "@/app-kit/supabase/supabaseService";
import Loading from "../components/common/loader/loading";
import EditCreditsDialog from "../components/dialog";
import SearchBar from "../components/search";
import UserTable from "../components/userTable";
import { USERS } from "../types/user/type";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


interface UserDetails {
    id: string;
    name: string;
    email: string;
    credits: number;
}

export default function Dashboard() {
    const auth = useSupabaseAuthContext();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<USERS[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [userCredits, setUserCredits] = useState<Record<string, number>>({});
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const ITEMS_PER_PAGE = 10;
    const [userDetails, setUserDetails] = useState<UserDetails[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPaginatedLoading, setIsPaginatedLoading] = useState(true);
    

    useEffect(() => {
        if (!auth.isLoading ) {
            if (auth.session) {
                setLoading(false);
                fetchUser();
            } else {
                router.push("/auth/login");
            }
        }
    }, [auth.isLoading, auth.session, router, auth.totalUsedCredits]);
    
    

    const fetchUser = async () => {
        setIsPaginatedLoading(true);
        try {
            const { data: { user } } = await supabaseServerClient.auth.getUser();
            if (!user) {
                console.error("No logged-in user found");
                return;
            }

            const response = await fetch(`/api/users?userId=${user.id}`);
            const data = await response.json();
            
            if (!data.users || !Array.isArray(data.users)) {
                console.error("Invalid users data:", data);
                return;
            }

            // Store users first
            const fetchedUsers = data.users;
            setUsers(fetchedUsers);

            // Calculate one year ago date
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            // Fetch credits for all users
            const creditsMap: Record<string, number> = {};
            for (const user of fetchedUsers) {
                const { data: creditsData, error: creditsError } = await supabaseBrowserClient
                    .from("credits")
                    .select("credits,created_at")
                    .eq("user_id", user.id);

                if (creditsError) {
                    console.error(`Error fetching credits for user ${user.id}:`, creditsError);
                    continue;
                }
                const totalCredits = creditsData.reduce((sum, credit) => {
                    const creditDate = new Date(credit.created_at);
                    return creditDate >= oneYearAgo ? sum + credit.credits : sum;
                }, 0);
                creditsMap[user.id] = totalCredits;
            }

            // Calculate remaining credits
            const remainingCreditsMap: Record<string, number> = {};
            if (auth.totalUsedCredits) {
                Object.keys(creditsMap).forEach((userId) => {
                    const usedCredits = auth.totalUsedCredits?.find((u) => u.userId === userId)?.totalCredits || 0;
                    remainingCreditsMap[userId] = Math.max(0, creditsMap[userId] - usedCredits);
                });
            } else {
                Object.assign(remainingCreditsMap, creditsMap);
            }

            // Update credits
            setUserCredits(remainingCreditsMap);

            // Create and set user details immediately
            const updatedUserDetails = fetchedUsers.map((user:any) => ({
                id: user.id,
                name: user.user_metadata.first_name,
                email: user.email,
                credits: remainingCreditsMap[user.id] ?? 0,
            }));

            setUserDetails(updatedUserDetails);
            setLoading(false);
            setIsPaginatedLoading(false);

        } catch (error) {
            console.error("Error fetching user data:", error);
            setLoading(false);
            setIsPaginatedLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setIsPaginatedLoading(true);
        setSearchQuery(query);
        setCurrentPage(1);
        setIsPaginatedLoading(false); 
    };



    // Filter users based on search query
    const filteredUsers = userDetails.filter((user) => {
        if (!searchQuery.trim()) return true;
        
        return (
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });



    // Calculate pagination for filtered results
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );




    const handleUpdate = (userId: string, newCredits: number) => {
        setUserCredits((prev) => ({
            ...prev,
            [userId]: newCredits,
        }));
        setUserDetails((prev) => 
            prev.map((user) => 
                user.id === userId 
                    ? { ...user, credits: newCredits }
                    : user
            )
        );
    };

    const handleEdit = (user: UserDetails) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    if (loading) {
        return <Loading/>;
    }

    return (
        <div className="pt-16 p-6">
            <h1 className="text-2xl font-bold">Welcome to the Admin Dashboard</h1>
            <div className="mt-6">
                <div className="flex justify-end mb-2 w-full">
                    <SearchBar onSearch={handleSearch} placeholder="Search users by name or email" />
                </div>
                <UserTable
                    users={paginatedUsers}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={ITEMS_PER_PAGE}
                    isLoading={isPaginatedLoading}
                    onEdit={handleEdit}
                />

                {/* Pagination */}
                <div className="flex justify-center items-center mt-4 space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-white bg-primary rounded disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>

                {/* Dialog Edit credits */}
                {selectedUser && (
                    <EditCreditsDialog
                        isOpen={isDialogOpen}
                        onClose={() => setIsDialogOpen(false)}
                        user={selectedUser}
                        onUpdate={handleUpdate}
                    />
                )}
            </div>
        </div>
    );
}