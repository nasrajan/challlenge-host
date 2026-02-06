import { getAllUsers } from "@/app/actions/admin"
import { UserRole } from "@prisma/client"
import { updateUserRole } from "@/app/actions/admin"
import { Shield, User as UserIcon, Settings } from "lucide-react"

export default async function AdminPage() {
    const users = await getAllUsers()

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Shield className="h-8 w-8 text-red-500" />
                    <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
                </header>

                <div className="grid gap-8">
                    <section className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-neutral-400" />
                                User Management
                            </h2>
                            <span className="text-sm text-neutral-500">{users.length} total users</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-neutral-500 text-sm border-b border-neutral-800">
                                        <th className="px-6 py-4 font-medium">User</th>
                                        <th className="px-6 py-4 font-medium">Role</th>
                                        <th className="px-6 py-4 font-medium">Joined</th>
                                        <th className="px-6 py-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-neutral-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                        user.role === 'ORGANIZER' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <UserRoleSelector userId={user.id} currentRole={user.role} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

// Client component wrapper for the role toggle
async function UserRoleSelector({ userId, currentRole }: { userId: string, currentRole: UserRole }) {
    // In a real app this would be a client component with a select dropdown
    // For this demonstration, we'll keep it simple or implement as server-action buttons
    return (
        <div className="flex gap-2">
            <form action={async (formData) => {
                'use server'
                const role = formData.get('role') as UserRole
                await updateUserRole(userId, role)
            }}>
                <select
                    name="role"
                    defaultValue={currentRole}
                    className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    onChange={(e) => e.target.form?.requestSubmit()}
                >
                    <option value="USER">USER</option>
                    <option value="ORGANIZER">ORGANIZER</option>
                    <option value="ADMIN">ADMIN</option>
                </select>
            </form>
        </div>
    )
}
