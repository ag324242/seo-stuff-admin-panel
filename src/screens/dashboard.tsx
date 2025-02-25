"use client";

import { useSupabaseAuthContext } from "@/app-kit/supabase/SupabaseAuthContext";
import Loading from "../components/common/loader/loading";
import EditCreditsDialog from "../components/dialog";
import SearchBar from "../components/search";
import UserTable from "../components/userTable";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import  debounce  from 'lodash.debounce';
import { User } from "../types/user/type";

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
    const [users, setUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const ITEMS_PER_PAGE = 10;
    const [searchQuery, setSearchQuery] = useState("");
    const [isPaginatedLoading, setIsPaginatedLoading] = useState(true);
    const [totalPages, setTotalPages] = useState<number>(0);
    

    useEffect(() => {
        if (!auth.isLoading ) {
            if (auth.session) {
                setLoading(false);
                fetchUsers(1);
            } else {
                router.push("/auth/login");
            }
        }
    }, [auth.isLoading, auth.session, router]);

    useEffect(() => {
        return () => {
          debouncedFetchUsers.cancel(); // Clean up the debounced function
        };
      }, []);


    /** Fetch all users with pagination */
    const fetchUsers = async (pageNo: number, searchValue: string = "") => {
        setIsPaginatedLoading(true)
        let allUsers: User[] = [];

        const response = await fetch(`/api/users?page=${pageNo}&search=${searchValue}`);
        const data = await response.json();

        if (!data.users || !Array.isArray(data.users))
            return allUsers

        allUsers = [...allUsers, ...data.users];
        setIsPaginatedLoading(false)
        setUsers(allUsers)
        setTotalPages(data?.totalPages)

        return allUsers;
    };

    const debouncedFetchUsers = debounce((page: number, query: string) => {
        fetchUsers(page, query);
      }, 900);

    // Handler functions
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        debouncedFetchUsers(1, query)
        setCurrentPage(1);

    }, []);

    const handleEdit = useCallback((user: UserDetails) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    }, []);

    const handlePrevPage = useCallback(() => {

        let previousPage = Math.max(currentPage - 1, 1);

        setCurrentPage(previousPage);
        fetchUsers(previousPage)

    }, [currentPage]);

    const handleNextPage = useCallback(() => {
        let nextPage = Math.min(currentPage + 1, totalPages);
        setCurrentPage(nextPage);
        fetchUsers(nextPage)

    }, [totalPages, currentPage]);

    const handleUpdate = async () => {
        await fetchUsers(currentPage, searchQuery);
    };


    if (loading) {
        return (<div className="flex w-full justify-center items-center h-screen"><Loading/></div>);
    }

    return (
        <div className="pt-16 p-6">
            <h1 className="text-2xl font-bold">Welcome to the Admin Dashboard</h1>
            <div className="mt-6">
                <div className="flex justify-end mb-2 w-full">
                    <SearchBar onSearch={handleSearch} placeholder="Search users by name or email" />
                </div>
                <UserTable
                    users={users}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={ITEMS_PER_PAGE}
                    isLoading={isPaginatedLoading}
                    onEdit={handleEdit}
                />
                <div className="flex justify-center items-center mt-4 space-x-2">
                    <button 
                        className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50" 
                        onClick={handlePrevPage} 
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50" 
                        onClick={handleNextPage} 
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
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