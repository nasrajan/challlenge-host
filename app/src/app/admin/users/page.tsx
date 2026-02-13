import { getAllUsers } from "@/app/actions/admin"
import { Shield, User as UserIcon, ChevronLeft } from "lucide-react"
import Link from "next/link"
import UserManagementTable from "@/app/components/Admin/UserManagementTable"

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

                    <UserManagementTable users={users} />
                </section>
            </div>
        </div>
    )
}
