"use client"

import { FolderOpen } from "lucide-react"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
    ExpandedState,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ExpandedRow } from "./ExpandedRow"
import { EmptyState } from "@/components/insight/primitives"
import { Project } from "@/lib/types" // Import Project type

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [expanded, setExpanded] = React.useState<ExpandedState>({})

    const table = useReactTable({
        data,
        columns,
        state: {
            expanded,
        },
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: () => true,
    })

    return (
        // overflow-x-auto so a wide table scrolls inside its own frame instead of forcing the
        // whole page sideways on a laptop screen.
        <div className="overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-gray-50/80">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead
                                        key={header.id}
                                        className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-gray-500"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <React.Fragment key={row.id}>
                                <TableRow
                                    data-state={row.getIsSelected() && "selected"}
                                    className="cursor-pointer border-gray-100 transition-colors hover:bg-gray-50/80"
                                    onClick={row.getToggleExpandedHandler()} // Make the whole row click to expand
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        // Stop propagation on Actions column to prevent expanding when clicking menu
                                        <TableCell key={cell.id} onClick={(e) => {
                                            if (cell.column.id === 'actions') {
                                                e.stopPropagation();
                                            }
                                        }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                {/* Render the expanded content */}
                                {row.getIsExpanded() && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={columns.length} className="p-0 border-t-0">
                                            {/* We cast row.original to Project because we know it is one.
                                             In a stricter generic, we'd handle TData better, but for this app it's fine. */}
                                            <ExpandedRow project={row.original as unknown as Project} />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={columns.length} className="p-4">
                                <EmptyState
                                    icon={<FolderOpen className="h-8 w-8" />}
                                    title="No projects found"
                                    className="border-0 bg-transparent"
                                >
                                    Nothing matches the current filters and status tab. Clear a filter above, or
                                    start a new project request.
                                </EmptyState>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
