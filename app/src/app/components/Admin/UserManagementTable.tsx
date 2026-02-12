"use client"

import { useState, useTransition } from "react"
import { Trash2, Eye, Shield, User as UserIcon } from "lucide-react"
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
    role: string
    createdAt: Date
}

interface UserManagementTableProps {
    users: User[]
}

export default function UserManagementTable({ users: initialUsers }: UserManagementTableProps) {
    const [users, setUsers] = useState(initialUsers)
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null)
    const [isDeleting, startTransition] = useTransition()
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null)

    const handleDeleteUser = (userId: string, userName: string) => {
        setUserToDelete({ id: userId, name: userName })
    }

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
                        <tr className="text-neutral-500 text-[10px] font-black tracking-widest border-b border-neutral-800">
                            <th className="px-6 py-4 uppercase">User</th>
                            <th className="px-6 py-4 uppercase">Role</th>
                            <th className="px-6 py-4 uppercase">Joined</th>
                            <th className="px-6 py-4 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-sm">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-neutral-800/40 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-neutral-200 group-hover:text-white transition-colors">
                                        {user.name || "Unknown User"}
                                    </div>
                                    <div className="text-xs text-neutral-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            user.role === 'ORGANIZER' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <UserRoleSelector userId={user.id} currentRole={user.role as any} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-neutral-500">
                                    <DateDisplay date={user.createdAt} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedUser({ id: user.id, name: user.name || "User" })}
                                            className="p-2 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-blue-400 hover:border-blue-500/30 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                                            title="View Participations"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Details
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.name || "User")}
                                            disabled={isDeleting}
                                            className="p-2 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all disabled:opacity-50"
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedUser && (
                <UserParticipationsModal
                    userId={selectedUser.id}
                    userName={selectedUser.name}
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
