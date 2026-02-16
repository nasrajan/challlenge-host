"use client"

import { useState, useTransition, memo, useCallback } from "react"
import { Trash2, Eye, Shield, User as UserIcon } from "lucide-react"
import type { UserRole } from "@prisma/client"
import { deleteUser } from "@/app/actions/admin"
import UserRoleSelector from "@/app/admin/UserRoleSelector"
import DateDisplay from "@/app/components/DateDisplay"
import UserParticipationsModal from "./UserParticipationsModal"
import SuccessAlert from "@/app/components/SuccessAlert"
import ConfirmationModal from "@/app/components/ConfirmationModal"

interface User {
    id: string
    name: string | null
    email: string | null
    role: UserRole
    createdAt: Date
}

interface UserManagementTableProps {
    users: User[]
}

const UserRow = memo(({
    user,
    onSelect,
    onDelete,
    isDeleting
}: {
    user: User,
    onSelect: (id: string, name: string) => void,
    onDelete: (id: string, name: string) => void,
    isDeleting: boolean
}) => (
    <tr className="hover:bg-neutral-800/40 transition-colors group">
        <td className="px-4 py-4 sm:px-6">
            <div className="flex flex-col">
                <div className="font-bold text-neutral-200 group-hover:text-white transition-colors truncate max-w-[120px] sm:max-w-[200px]">
                    {user.name || "Unknown User"}
                </div>
                <div className="text-[10px] sm:text-xs text-neutral-500 truncate max-w-[120px] sm:max-w-none">
                    {user.email}
                </div>
            </div>
        </td>
        <td className="px-4 py-4 sm:px-6">
            <div className="relative inline-flex items-center">
                <UserRoleSelector userId={user.id} currentRole={user.role} />
            </div>
        </td>
        <td className="px-6 py-4 text-neutral-500 hidden md:table-cell">
            <DateDisplay date={user.createdAt} />
        </td>
        <td className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button
                    onClick={() => onSelect(user.id, user.name || "User")}
                    className="p-1.5 sm:p-2 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-blue-400 hover:border-blue-500/30 rounded-lg sm:rounded-xl transition-all flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold"
                    title="View Participations"
                >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Details</span>
                </button>
                <button
                    onClick={() => onDelete(user.id, user.name || "User")}
                    disabled={isDeleting}
                    className="p-1.5 sm:p-2 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-red-500 hover:border-red-500/30 rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                    title="Delete User"
                >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
            </div>
        </td>
    </tr>
))

UserRow.displayName = "UserRow"

export default function UserManagementTable({ users: initialUsers }: UserManagementTableProps) {
    const [users, setUsers] = useState(initialUsers)
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null)
    const [isDeleting, startTransition] = useTransition()
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null)

    const handleDeleteUser = useCallback((userId: string, userName: string) => {
        setUserToDelete({ id: userId, name: userName })
    }, [])

    const handleSelectUser = useCallback((userId: string, userName: string) => {
        setSelectedUser({ id: userId, name: userName })
    }, [])

    const confirmDelete = async () => {
        if (!userToDelete) return

        setSuccessMessage(null)
        startTransition(async () => {
            try {
                const result = await deleteUser(userToDelete.id)
                if (result.success) {
                    setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
                    setSuccessMessage(result.message || "User deleted successfully.")
                    setTimeout(() => setSuccessMessage(null), 5000)
                }
            } catch (err) {
                alert("Failed to delete user")
            } finally {
                setUserToDelete(null)
            }
        })
    }

    return (
        <>
            <SuccessAlert message={successMessage} className="mx-6 mt-4" />
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-neutral-500 text-[10px] font-black tracking-widest border-b border-neutral-800 uppercase">
                            <th className="px-4 py-4 sm:px-6">User</th>
                            <th className="px-4 py-4 sm:px-6">Role</th>
                            <th className="px-6 py-4 hidden md:table-cell">Joined</th>
                            <th className="px-4 py-4 sm:px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-sm">
                        {users.map((user) => (
                            <UserRow
                                key={user.id}
                                user={user}
                                onSelect={handleSelectUser}
                                onDelete={handleDeleteUser}
                                isDeleting={isDeleting}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedUser && (
                <UserParticipationsModal
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    joinedAt={users.find(u => u.id === selectedUser.id)?.createdAt || new Date()}
                    isOpen={true}
                    onClose={() => setSelectedUser(null)}
                />
            )}

            <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you absolutely sure you want to delete ${userToDelete?.name}? This will permanently remove all their logs and participation data.`}
                confirmText="Delete User"
                isPending={isDeleting}
            />
        </>
    )
}
