"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

export function Pagination({ currentPage, totalPages, hasNextPage, hasPrevPage }: PaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", pageNumber.toString())
        return `?${params.toString()}`
    }

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page))
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center space-x-4 mt-8">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
            >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
            </Button>
            <span className="text-sm font-medium text-gray-600">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
            >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
    )
}
