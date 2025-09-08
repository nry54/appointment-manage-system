const STATUS = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Completed', value: 'COMPLETED' },
]

const DEFAULT_PAGINATION = {
  sortBy: 'fields.appointment_date',
  descending: true,
  page: 1,
  rowsPerPage: 10,
}

export { STATUS, DEFAULT_PAGINATION }
