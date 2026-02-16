"use client"

import dynamic from "next/dynamic"

const ActivityLogger = dynamic(() => import("./ActivityLogger"), {
    ssr: false
})

export default ActivityLogger
