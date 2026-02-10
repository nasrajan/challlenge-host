import { getAllUsers } from "@/app/actions/admin"
import { UserRole } from "@prisma/client"
import { Shield, User as UserIcon, ChevronLeft } from "lucide-react"
import Link from "next/link"
import UserRoleSelector from "../UserRoleSelector"

export default async function AdminUsersPage() {
    const users = await getAllUsers()

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col gap-6 mb-12">
                    <Link href="/admin" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors w-fit">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Control Center
                    </Link>
                    <div className="flex items-center gap-4">
                        <UserIcon className="h-8 w-8 text-blue-500" />
                        <h1 className="text-3xl font-bold tracking-tight text-blue-400">User Management</h1>
                    </div>
                </header>

                <section className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
                    <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            Users
                        </h2>
                        <span className="text-xs font-black tracking-widest text-neutral-500 bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                            {users.length} total
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-neutral-500 text-[10px] font-black  tracking-widest border-b border-neutral-800">
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800 text-sm">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-neutral-200 group-hover:text-white transition-colors">{user.name}</div>
                                            <div className="text-xs text-neutral-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                user.role === 'ORGANIZER' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-500">
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
    )
}
