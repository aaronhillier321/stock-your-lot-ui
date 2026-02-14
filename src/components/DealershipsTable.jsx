import { useNavigate } from 'react-router-dom'
import { Text } from '@mantine/core'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import './PurchasesTable.css'

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 160,
  },
  {
    id: 'address',
    accessorFn: (row) => (row.addressLine1 ?? row.address ?? '—').toString(),
    header: 'Address',
    size: 180,
  },
  {
    accessorKey: 'city',
    header: 'City',
    size: 120,
  },
  {
    accessorKey: 'state',
    header: 'State',
    size: 80,
  },
  {
    id: 'zip',
    accessorFn: (row) => (row.postalCode ?? row.zip ?? '—').toString(),
    header: 'ZIP',
    size: 90,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    size: 130,
  },
  {
    id: 'purchases',
    accessorFn: (row) =>
      row.id != null ? (row.purchaseCount ?? row.purchase_count ?? 0) : '—',
    header: 'Purchases',
    size: 100,
    Cell: ({ cell }) => {
      const v = cell.getValue()
      return v === '—' ? '—' : Number(v).toLocaleString()
    },
  },
]

export default function DealershipsTable({ dealerships = [] }) {
  const navigate = useNavigate()

  const table = useMantineReactTable({
    columns,
    data: dealerships,
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
        if (row.original.id != null) navigate(`/dealerships/${row.original.id}`)
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
        <Text size="lg" fw={700}>
          Dealerships
        </Text>
      </div>
    ),
    renderBottomToolbarCustomActions: ({ table }) => {
      const filteredCount = table.getRowModel().rows.length
      const totalCount = dealerships.length
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
