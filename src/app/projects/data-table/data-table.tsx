"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
    Row,
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
        <div className="rounded-md border shadow-sm bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="font-semibold text-gray-700">
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
                                    className="cursor-pointer hover:bg-gray-50/80 transition-colors"
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
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
