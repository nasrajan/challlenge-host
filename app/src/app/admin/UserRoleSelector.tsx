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
                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
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
