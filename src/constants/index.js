const STATUS = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Completed', value: 'COMPLETED' },
]

const DEFAULT_PAGINATION = {
  sortBy: 'date',
  descending: false,
  page: 1,
  rowsPerPage: 10,
}

export { STATUS, DEFAULT_PAGINATION }
