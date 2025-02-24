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
        if (!auth.isLoading) {
            if (auth.session) {
                setLoading(false);
                fetchUser();
            } else {
                router.push("/auth/login");
            }
        }
    }, [auth.isLoading, auth.session, router]);

    useEffect(() => {
        if (users.length > 0 && Object.keys(userCredits).length > 0) {
            const updatedUserDetails = users.map((user) => ({
                id: user.id,
                name: user.user_metadata?.first_name,
                email: user.email,
                credits: userCredits[user.id] ?? 0,
            }));

            setUserDetails(updatedUserDetails);
            setIsPaginatedLoading(false);
        }
    }, [users, userCredits]);

    /** Fetch all users with pagination */
    const fetchUsers = async (userId: string) => {
        let allUsers: USERS[] = [];
        let page = 1;
        const PAGE_SIZE = 100;

        while (true) {
            const response = await fetch(`/api/users?userId=${userId}&page=${page}`);
            const data = await response.json();

            if (!data.users || !Array.isArray(data.users)) break;

            allUsers = [...allUsers, ...data.users];

            if (data.users.length < PAGE_SIZE) break;
            page++;
        }

        return allUsers;
    };

    /** Fetch all credits with pagination */
    const fetchAllCredits = async () => {
        let allCredits: any[] = [];
        let page = 1;
        const PAGE_SIZE = 100;

        while (true) {
            const { data, error } = await supabaseBrowserClient
                .from("credits")
                .select("user_id, credits, created_at")
                .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

            if (error) {
                console.error("Error fetching credits:", error);
                break;
            }

            if (!data || data.length === 0) break;

            allCredits = [...allCredits, ...data];
            page++;
        }

        return allCredits;
    };

    /** Fetch user details and credits */
    const fetchUser = async () => {
        setIsPaginatedLoading(true);
        try {
            const { data: { user } } = await supabaseServerClient.auth.getUser();
            if (!user) {
                console.error("No logged-in user found");
                return;
            }

            // Fetch users and credits
            const [allUsers, allCredits] = await Promise.all([
                fetchUsers(user.id),
                fetchAllCredits()
            ]);

            setUsers(allUsers);

            // Process credits
            const creditsMap: Record<string, number> = {};
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            allCredits.forEach((credit) => {
                const creditDate = new Date(credit.created_at);
                if (creditDate >= oneYearAgo) {
                    creditsMap[credit.user_id] = (creditsMap[credit.user_id] || 0) + credit.credits;
                }
            });

            // Adjust remaining credits
            const remainingCreditsMap: Record<string, number> = {};
            if (auth.totalUsedCredits) {
                Object.keys(creditsMap).forEach((userId) => {
                    const usedCredits = auth.totalUsedCredits?.find((u) => u.userId === userId)?.totalCredits || 0;
                    remainingCreditsMap[userId] = Math.max(0, creditsMap[userId] - usedCredits);
                });
            } else {
                Object.assign(remainingCreditsMap, creditsMap);
            }

            setUserCredits(remainingCreditsMap);
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
            setIsPaginatedLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const filteredUsers = userDetails.filter((user) =>
        !searchQuery.trim() ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleUpdate = async (userId: string, newCredits: number) => {
        setUserCredits((prev) => ({
            ...prev,
            [userId]: newCredits,
        }));
        setUserDetails((prev) =>
            prev.map((user) =>
                user.id === userId ? { ...user, credits: newCredits } : user
            )
        );
        await fetchUser();
    };

    const handleEdit = (user: UserDetails) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    if (loading) {
        return <Loading />;
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
                <div className="flex justify-center items-center mt-4 space-x-2">
                    <button className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
                    <span className="px-4 py-2 text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                </div>
                {selectedUser && <EditCreditsDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} user={selectedUser} onUpdate={handleUpdate} />}
            </div>
        </div>
    );
}
