'use client'

import { useState, useRef, memo } from "react"
import { ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ExpandableDescriptionProps {
    title: string
    description: string
}

function ExpandableDescription({ title, description }: ExpandableDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [loadingPDF, setLoadingPDF] = useState(false)
    const descriptionRef = useRef<HTMLDivElement>(null)
    const isLong = description.length > 300 // Heuristic for long description

    const handleDownloadPDF = async () => {
        if (!descriptionRef.current) return
        setLoadingPDF(true)

        try {
            const container = document.createElement('div')
            container.style.position = 'absolute'
            container.style.left = '-9999px'
            container.style.top = '0'
            container.style.width = '800px'
            container.style.padding = '40px'
            container.style.backgroundColor = '#171717'
            container.style.color = '#ffffff'
            container.style.fontFamily = 'Arial, sans-serif'
            container.style.borderRadius = '24px'

            const titleEl = document.createElement('h1')
            titleEl.innerText = title
            titleEl.style.fontSize = '32px'
            titleEl.style.fontWeight = 'bold'
            titleEl.style.marginBottom = '20px'
            titleEl.style.borderBottom = '2px solid #262626'
            titleEl.style.paddingBottom = '10px'
            container.appendChild(titleEl)

            const bodyEl = document.createElement('div')
            bodyEl.innerText = description
            bodyEl.style.fontSize = '18px'
            bodyEl.style.lineHeight = '1.6'
            bodyEl.style.whiteSpace = 'pre-wrap'
            bodyEl.style.wordBreak = 'break-word'
            bodyEl.style.color = '#a3a3a3'

            const isArabic = /[\u0600-\u06FF]/.test(description)
            if (isArabic) {
                bodyEl.dir = 'rtl'
                bodyEl.style.textAlign = 'right'
            }

            container.appendChild(bodyEl)
            document.body.appendChild(container)

            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#171717',
                useCORS: true,
                logging: false,
            })

            document.body.removeChild(container)

            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            })

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
            pdf.save(`${title.replace(/\s+/g, '_')}_description.pdf`)

        } catch (err) {
            console.error("PDF generation failed:", err)
            alert("Failed to generate PDF. Falling back to basic version.")
            try {
                const doc = new jsPDF()
                doc.setFontSize(20)
                doc.text(title, 20, 20)
                doc.setFontSize(12)
                const splitText = doc.splitTextToSize(description, 170)
                doc.text(splitText, 20, 40)
                doc.save(`${title.replace(/\s+/g, '_')}_description.pdf`)
            } catch (e) {
                console.error("Critical PDF failure:", e)
            }
        } finally {
            setLoadingPDF(false)
        }
    }

    const DownloadButton = () => (
        <button
            onClick={handleDownloadPDF}
            disabled={loadingPDF}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl transition-all text-xs font-bold border border-neutral-700/50 mb-4 active:scale-95 disabled:opacity-50"
            title="Download description as PDF (Arabic Supported)"
        >
            {loadingPDF ? (
                <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
            ) : (
                <FileText className="h-4 w-4 text-yellow-500" />
            )}
            {loadingPDF ? "Generating PDF..." : "PDF Description"}
        </button>
    )

    return (
        <div className="mb-8 max-w-6xl">
            {isLong && (
                <div className="flex justify-end">
                    <DownloadButton />
                </div>
            )}

            <div
                ref={descriptionRef}
                className="p-6 rounded-3xl border border-neutral-800/50 bg-neutral-900"
            >
                <div className={`description-container relative ${!isExpanded && isLong ? 'max-h-32 overflow-hidden' : ''} transition-all duration-300 ease-in-out`}>
                    <p className="text-base sm:text-lg text-neutral-400 leading-relaxed whitespace-pre-wrap break-words">
                        {description}
                    </p>
                    {!isExpanded && isLong && (
                        <div className="description-gradient absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none" />
                    )}
                </div>
            </div>

            {isLong && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-4 text-yellow-500 font-bold text-sm flex items-center gap-1 hover:text-yellow-400 transition-colors ml-2"
                >
                    {isExpanded ? (
                        <>Show Less <ChevronUp className="h-4 w-4" /></>
                    ) : (
                        <>Read More <ChevronDown className="h-4 w-4" /></>
                    )}
                </button>
            )}
        </div>
    )
}

export default memo(ExpandableDescription)
