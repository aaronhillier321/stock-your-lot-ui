import { useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from '@mantine/core'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import { getApiBase, authFetch } from '../api'
import { usePdfPreview } from '../hooks/usePdfPreview'
import PdfPreviewModal from './PdfPreviewModal'
import pdfIcon from '../../assets/pdf-icon.png'
import './PurchasesTable.css'

function buildColumns(showBuyerColumn, onPdfClick) {
  const cols = [
    {
      accessorKey: 'vin',
      header: 'VIN',
      // size: 'auto'
    },
    {
      
      accessorKey: 'date',
      header: 'Date',
      minSize: 0
    },
    {
      id: 'dealership',
      accessorFn: (row) => (row.dealershipName ?? row.dealership ?? '—').toString(),
      header: 'Dealership',
      // size: 140,
    },
    {
      id: 'vehicle',
      accessorFn: (row) =>
        [row.vehicleYear, row.vehicleMake, row.vehicleModel].filter(Boolean).join(' ') || '—',
      header: 'Vehicle',
      // size: 180,
    },
    {
      accessorKey: 'miles',
      header: 'Miles',
      // size: 90,
      Cell: ({ cell }) =>
        cell.getValue() != null ? Number(cell.getValue()).toLocaleString() : '—',
    },
    {
      accessorKey: 'purchasePrice',
      header: 'Purchase Price',
      // size: 120,
      Cell: ({ cell }) =>
        cell.getValue() != null
          ? `$${Number(cell.getValue()).toLocaleString()}`
          : '—',
    },
    {
      id: 'billOfSale',
      accessorFn: (row) => row.billOfSaleFileId ?? row.billOfSaleFileID ?? null,
      header: 'Bill of Sale',
      // size: 100,
      enableColumnFilter: false,
      Cell: ({ cell }) => {
        const id = cell.getValue()
        if (id == null) return ''
        return (
          <button
            type="button"
            className="purchases-table-pdf-btn"
            onClick={(e) => {
              e.stopPropagation()
              onPdfClick(id, 'Bill of Sale')
            }}
            title="View Bill of Sale"
            disabled={!onPdfClick}
          >
            <img src={pdfIcon} alt="Bill of Sale" className="purchases-table-pdf-icon" />
          </button>
        )
      },
    },
    {
      id: 'conditionReport',
      accessorFn: (row) => row.conditionReportFileId ?? row.conditionReportFileID ?? null,
      header: 'Condition Report',
      // size: 120,
      enableColumnFilter: false,
      Cell: ({ cell }) => {
        const id = cell.getValue()
        if (id == null) return ''
        return (
          <button
            type="button"
            className="purchases-table-pdf-btn"
            onClick={(e) => {
              e.stopPropagation()
              onPdfClick(id, 'Condition Report')
            }}
            title="View Condition Report"
            disabled={!onPdfClick}
          >
            <img src={pdfIcon} alt="Condition Report" className="purchases-table-pdf-icon" />
          </button>
        )
      },
    },
  ]
  if (showBuyerColumn) {
    cols.push({
      id: 'buyer',
      accessorFn: (row) =>
        (row.buyerEmail ?? row.buyer?.email ?? '—').toString(),
      header: 'Buyer',
      // size: 140,
    })
  }
  return cols
}

export default function PurchasesTable({ purchases = [], showBuyerColumn = false }) {
  const navigate = useNavigate()
  const pdfPreview = usePdfPreview()
  const [pdfError, setPdfError] = useState(null)

  const handlePdfClick = useCallback(async (fileId, label) => {
    if (fileId == null) return
    setPdfError(null)
    try {
      const res = await authFetch(`${getApiBase()}/api/files/${fileId}`)
      if (!res.ok) {
        setPdfError(res.status === 404 ? 'File not found' : `Failed to load (${res.status})`)
        return
      }
      const blob = await res.blob()
      const file = new File([blob], `${label.toLowerCase().replace(/\s+/g, '-')}.pdf`, { type: blob.type || 'application/pdf' })
      pdfPreview.openPreview(file, label)
    } catch (err) {
      setPdfError(err.message || 'Failed to load PDF')
    }
  }, [pdfPreview])

  const columns = useMemo(
    () => buildColumns(showBuyerColumn, handlePdfClick),
    [showBuyerColumn, handlePdfClick]
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
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
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
      style: { flex: 1, minHeight: 0, overflow: 'auto', overflowX: 'auto' },
    },
    mantineTableProps: {
      style: { minWidth: 'max-content' },
    },
    mantineTableHeadCellProps: {
      style: { padding: '12px 14px', display: 'flex', justifyContent: 'center', width: 'auto' },
    },
    mantineTableBodyCellProps: {
      style: { padding: '12px 14px', display: 'flex', justifyContent: 'center', width: 'auto' },
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
      columnPinning: { left: ['vin'] },
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
      {pdfError && (
        <div className="purchases-table-pdf-error" role="alert">
          {pdfError}
        </div>
      )}
      <MantineReactTable table={table} />
      <PdfPreviewModal
        open={pdfPreview.isOpen}
        url={pdfPreview.url}
        label={pdfPreview.label}
        onClose={() => {
          setPdfError(null)
          pdfPreview.closePreview()
        }}
      />
    </div>
  )
}
