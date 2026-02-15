import { useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text, Loader } from '@mantine/core'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import { getApiBase, authFetch } from '../api'
import { usePdfPreview } from '../hooks/usePdfPreview'
import PdfPreviewModal from './PdfPreviewModal'
import pdfIcon from '../../assets/pdf-icon.png'
import './PurchasesTable.css'

function buildColumns(showBuyerColumn, onPdfClick, loadingFileId) {
  const cols = [
    {
      accessorKey: 'vin',
      header: 'VIN',
      size: 180,
      minSize: 180,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      size: 160,
      minSize: 160,
    },
    {
      id: 'dealership',
      accessorFn: (row) => (row.dealershipName ?? row.dealership ?? '—').toString(),
      header: 'Dealership',
      size: 160,
      minSize: 120,
    },
    {
      id: 'vehicle',
      accessorFn: (row) =>
        [row.vehicleYear, row.vehicleMake, row.vehicleModel].filter(Boolean).join(' ') || '—',
      header: 'Vehicle',
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: 'miles',
      header: 'Miles',
      size: 130,
      minSize: 130,
      Cell: ({ cell }) =>
        cell.getValue() != null ? Number(cell.getValue()).toLocaleString() : '—',
    },
    {
      accessorKey: 'purchasePrice',
      header: 'Purchase Price',
      size: 140,
      minSize: 140,
      Cell: ({ cell }) =>
        cell.getValue() != null
          ? `$${Number(cell.getValue()).toLocaleString()}`
          : '—',
    },
    {
      id: 'billOfSale',
      accessorFn: (row) => row.billOfSaleFileId ?? row.billOfSaleFileID ?? null,
      header: 'Bill of Sale',
      size: 145,
      minSize: 145,
      enableColumnFilter: false,
      Cell: ({ cell }) => {
        const id = cell.getValue()
        if (id == null) return ''
        const loading = id === loadingFileId
        return (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button
              type="button"
              className="purchases-table-pdf-btn"
              onClick={(e) => {
                e.stopPropagation()
                onPdfClick(id, 'Bill of Sale')
              }}
              title="View Bill of Sale"
              disabled={!onPdfClick || loading}
            >
              {loading ? (
                <Loader size="sm" className="purchases-table-pdf-loader" />
              ) : (
                <img src={pdfIcon} alt="Bill of Sale" className="purchases-table-pdf-icon" />
              )}
            </button>
          </div>
        )
      },
    },
    {
      id: 'conditionReport',
      accessorFn: (row) => row.conditionReportFileId ?? row.conditionReportFileID ?? null,
      header: 'Condition\nReport',
      size: 200,
      minSize: 200,
      enableColumnFilter: false,
      Cell: ({ cell }) => {
        const id = cell.getValue()
        if (id == null) return ''
        const loading = id === loadingFileId
        return (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button
              type="button"
              className="purchases-table-pdf-btn"
              onClick={(e) => {
                e.stopPropagation()
                onPdfClick(id, 'Condition Report')
              }}
              title="View Condition Report"
              disabled={!onPdfClick || loading}
            >
              {loading ? (
                <Loader size="sm" className="purchases-table-pdf-loader" />
              ) : (
                <img src={pdfIcon} alt="Condition Report" className="purchases-table-pdf-icon" />
              )}
            </button>
          </div>
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
      size: 200,
      minSize: 200,
    })
  }
  return cols
}

export default function PurchasesTable({ purchases = [], showBuyerColumn = false }) {
  const navigate = useNavigate()
  const pdfPreview = usePdfPreview()
  const [pdfError, setPdfError] = useState(null)
  const [loadingFileId, setLoadingFileId] = useState(null)

  const handlePdfClick = useCallback(async (fileId, label) => {
    if (fileId == null) return
    setPdfError(null)
    setLoadingFileId(fileId)
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
    } finally {
      setLoadingFileId(null)
    }
  }, [pdfPreview])

  const columns = useMemo(
    () => buildColumns(showBuyerColumn, handlePdfClick, loadingFileId),
    [showBuyerColumn, handlePdfClick, loadingFileId]
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
      style: { padding: '12px 14px', whiteSpace: 'normal!important'},
    },
    mantineTableBodyCellProps: {
      style: { padding: '12px 14px'},
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
