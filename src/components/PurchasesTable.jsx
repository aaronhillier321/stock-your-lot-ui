import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from '@mantine/core'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import './PurchasesTable.css'

function buildColumns(showBuyerColumn) {
  const cols = [
    {
      accessorKey: 'date',
      header: 'Date',
      size: 90,
    },
    {
      id: 'dealership',
      accessorFn: (row) => (row.dealershipName ?? row.dealership ?? '—').toString(),
      header: 'Dealership',
      size: 140,
    },
    {
      accessorKey: 'vin',
      header: 'VIN',
      size: 120,
    },
    {
      id: 'vehicle',
      accessorFn: (row) =>
        [row.vehicleYear, row.vehicleMake, row.vehicleModel].filter(Boolean).join(' ') || '—',
      header: 'Vehicle',
      size: 180,
    },
    {
      accessorKey: 'miles',
      header: 'Miles',
      size: 90,
      Cell: ({ cell }) =>
        cell.getValue() != null ? Number(cell.getValue()).toLocaleString() : '—',
    },
    {
      accessorKey: 'purchasePrice',
      header: 'Purchase Price',
      size: 120,
      Cell: ({ cell }) =>
        cell.getValue() != null
          ? `$${Number(cell.getValue()).toLocaleString()}`
          : '—',
    },
  ]
  if (showBuyerColumn) {
    cols.push({
      id: 'buyer',
      accessorFn: (row) =>
        (row.buyerEmail ?? row.buyer?.email ?? '—').toString(),
      header: 'Buyer',
      size: 140,
    })
  }
  return cols
}

export default function PurchasesTable({ purchases = [], showBuyerColumn = false }) {
  const navigate = useNavigate()
  const columns = useMemo(
    () => buildColumns(showBuyerColumn),
    [showBuyerColumn]
  )

  const table = useMantineReactTable({
    columns,
    data: purchases,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: false,
    enableTableFooter: false,
    enableBottomToolbar: true,
    enableStickyHeader: true,
    mantinePaperProps: {
      className: 'purchases-table-paper',
      style: {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
    },
    mantineTableContainerProps: {
      className: 'purchases-table-wrap',
      style: { flex: 1, minHeight: 0, overflow: 'auto' },
    },
    mantineTableHeadCellProps: {
      style: { padding: '12px 14px' },
    },
    mantineTableBodyCellProps: {
      style: { padding: '12px 14px' },
    },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        if (row.original.id != null) navigate(`/purchases/${row.original.id}`)
      },
      style: {
        cursor: row.original.id != null ? 'pointer' : 'default',
      },
    }),
    initialState: {
      density: 'compact',
    },
    renderTopToolbarCustomActions: () => (
      <div className="purchases-table-toolbar-title">
      <Text size="lg" fw={700} className=" p2">
        Purchases
      </Text>
      </div>
    ),
    renderBottomToolbarCustomActions: ({ table }) => {
      const filteredCount = table.getRowModel().rows.length
      const totalCount = purchases.length
      const isFiltered = filteredCount !== totalCount
      return (
        <span className="purchases-table-footer-count">
          {isFiltered
            ? `${filteredCount} of ${totalCount} ${totalCount === 1 ? 'record' : 'records'}`
            : `${filteredCount} ${filteredCount === 1 ? 'record' : 'records'}`}
        </span>
      )
    },
  })

  return (
    <div className="purchases-table-with-footer">
      <MantineReactTable table={table} />
    </div>
  )
}
