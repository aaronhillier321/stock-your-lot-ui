import { useNavigate } from 'react-router-dom'
import { Text } from '@mantine/core'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import './PurchasesTable.css'

const columns = [
  {
    id: 'firstName',
    accessorFn: (row) => {
      const fn = row.firstName ?? row.first_name
      if (fn != null && fn !== '') return String(fn).trim()
      const name = (row.name ?? row.userName ?? row.fullName ?? row.displayName ?? '').toString().trim()
      return name ? name.split(/\s+/)[0] || '—' : '—'
    },
    header: 'First Name',
    size: 140,
    minSize: 100,
  },
  {
    id: 'lastName',
    accessorFn: (row) => {
      const ln = row.lastName ?? row.last_name
      if (ln != null && ln !== '') return String(ln).trim()
      const name = (row.name ?? row.userName ?? row.fullName ?? row.displayName ?? '').toString().trim()
      const parts = name ? name.split(/\s+/) : []
      return parts.length > 1 ? parts.slice(1).join(' ') : '—'
    },
    header: 'Last Name',
    size: 140,
    minSize: 100,
  },
  {
    id: 'email',
    accessorFn: (row) => (row.email ?? row.userName ?? '').toString().trim() || '—',
    header: 'Email',
    size: 220,
    minSize: 160,
  },
  {
    id: 'phone',
    accessorFn: (row) => (row.phone ?? row.phoneNumber ?? row.phone_number ?? '').toString().trim() || '—',
    header: 'Phone',
    size: 140,
    minSize: 100,
  },
  {
    id: 'role',
    accessorFn: (row) => {
      const r = row.role ?? row.userRole ?? row.roles
      if (r == null || r === '') return '—'
      if (Array.isArray(r)) return r.join(', ')
      return String(r)
    },
    header: 'Role',
    size: 140,
    minSize: 100,
  },
]

export default function UsersTable({ users = [] }) {
  const navigate = useNavigate()

  const table = useMantineReactTable({
    columns,
    data: users,
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
    mantineTableBodyRowProps: ({ row }) => {
      const uid = row.original.id ?? row.original.userId ?? row.original._id
      return {
        onClick: () => {
          if (uid != null) navigate(`/users/${uid}`)
        },
        style: {
          cursor: uid != null ? 'pointer' : 'default',
        },
      }
    },
    initialState: {
      density: 'compact',
    },
    renderTopToolbarCustomActions: () => (
      <div className="purchases-table-toolbar-title">
        <Text size="lg" fw={700}>
          Users
        </Text>
      </div>
    ),
    renderBottomToolbarCustomActions: ({ table }) => {
      const filteredCount = table.getRowModel().rows.length
      const totalCount = users.length
      const isFiltered = filteredCount !== totalCount
      return (
        <span className="purchases-table-footer-count">
          {isFiltered
            ? `${filteredCount} of ${totalCount} ${totalCount === 1 ? 'user' : 'users'}`
            : `${filteredCount} ${filteredCount === 1 ? 'user' : 'users'}`}
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
