/* eslint-disable react-hooks/incompatible-library */
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

export default function DataTable({ columns, data, onRowClick, className, empty }) {
  const [sorting, setSorting] = useState([])

  const table = useReactTable({
    data: data || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const colCount = useMemo(() => table.getAllLeafColumns().length, [table])

  return (
    <div
      className={clsx(
        'max-w-full overflow-auto overscroll-x-contain rounded-2xl border border-black/5 dark:border-white/10',
        className
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="bg-[rgb(var(--muted))]/60 text-[rgb(var(--text))]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={clsx(
                      'whitespace-nowrap px-4 py-3 text-left font-semibold',
                      canSort ? 'cursor-pointer select-none' : null
                    )}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    scope="col"
                  >
                    <span className="inline-flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDir === 'asc' ? <span aria-hidden="true">^</span> : null}
                      {sortDir === 'desc' ? <span aria-hidden="true">v</span> : null}
                    </span>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="bg-[rgb(var(--panel))]/40">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  'border-t border-black/5 hover:bg-[rgb(var(--muted))]/40 dark:border-white/10',
                  onRowClick ? 'cursor-pointer' : null
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle text-[rgb(var(--text))]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={colCount}
                className="px-4 py-10 text-center text-[rgb(var(--text-muted))]"
              >
                {empty || 'No rows'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
