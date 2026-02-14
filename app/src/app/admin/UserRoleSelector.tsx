'use client'

import { UserRole } from "@prisma/client"
import { updateUserRole } from "@/app/actions/admin"

interface UserRoleSelectorProps {
    userId: string;
    currentRole: UserRole;
}

export default function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
    return (
        <div className="flex gap-2">
            <select
                name="role"
                defaultValue={currentRole}
                className={`bg-neutral-800 border rounded px-1.5 py-0.5 text-[10px] font-black tracking-tight focus:outline-none transition-all cursor-pointer ${currentRole === 'ADMIN' ? 'border-red-500/50 text-red-400 ring-red-500/20' :
                        currentRole === 'ORGANIZER' ? 'border-yellow-500/50 text-yellow-400 ring-yellow-500/20' :
                            'border-blue-500/50 text-blue-400 ring-blue-500/20'
                    }`}
                onChange={async (e) => {
                    const newRole = e.target.value as UserRole;
                    await updateUserRole(userId, newRole);
                }}
            >
                <option value="USER">USER</option>
                <option value="ORGANIZER">ORGANIZER</option>
                <option value="ADMIN">ADMIN</option>
            </select>
        </div>
    )
}
