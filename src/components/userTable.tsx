import { FiEdit } from "react-icons/fi";
import ListLoader from "./common/loader/listLoader";

interface UserDetails {
    id: string;
    name: string;
    email: string;
    credits: number;
}

interface UserTableProps {
    users: UserDetails[];
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    isLoading: boolean;
    onEdit: (user: UserDetails) => void;
}

const UserTable: React.FC<UserTableProps> = ({
    users,
    currentPage,
    itemsPerPage,
    isLoading,
    onEdit
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg shadow">
                <thead>
                    <tr className="bg-purple-500 text-white uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">ID</th>
                        <th className="py-3 px-6 text-left">Name</th>
                        <th className="py-3 px-6 text-left">Email</th>
                        <th className="py-3 px-6 text-left">Credits</th>
                        <th className="py-3 px-6 text-left flex justify-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8">
                                <div className="flex items-center justify-center">
                                    <ListLoader />
                                    <span className="ml-2 text-gray-500">Loading users...</span>
                                </div>
                            </td>
                        </tr>
                    ) : users.length > 0 ? (
                        users.map((user, index) => (
                            <tr key={user.id} className="border-b hover:bg-gray-100">
                                <td className="py-3 px-6">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td className="py-3 px-6">{user.name}</td>
                                <td className="py-3 px-6">{user.email}</td>
                                <td className="py-3 px-6">{user.credits}</td>
                                <td className="py-3 px-6 flex justify-center">
                                    <FiEdit
                                        className="text-purple-500 cursor-pointer"
                                        size={20}
                                        onClick={() => onEdit(user)}
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="text-center py-4">No users found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

        </div>
    );
};

export default UserTable;
