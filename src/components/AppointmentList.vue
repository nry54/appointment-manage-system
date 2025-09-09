<template>
  <q-layout view="lHh Lpr lFf">
    <div class="appointment-list-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="appointment-count">
          <span class="count-text">{{ filteredAppointments.length }} Appointment Found</span>
        </div>
        <div class="create-button">
          <q-btn
            push
            no-caps
            color="pink"
            icon="add"
            label="Create Appointment"
            @click="openAppointmentDialog()"
          />
        </div>
      </div>
      <!----->

      <!-- Loading State for Appointments -->
      <div v-if="appointmentsLoading" class="appointments-loading-container">
        <div class="loading-header">
          <q-skeleton type="text" width="200px" height="24px" class="q-mb-md" />
          <q-skeleton type="text" width="150px" height="16px" />
        </div>
        <div class="loading-cards">
          <div v-for="n in 6" :key="n" class="appointment-card-skeleton">
            <div class="skeleton-section">
              <q-skeleton type="circle" size="40px" />
              <div class="skeleton-text">
                <q-skeleton type="text" width="120px" height="16px" />
                <q-skeleton type="text" width="100px" height="14px" />
              </div>
            </div>
            <div class="skeleton-section">
              <q-skeleton type="rect" width="80px" height="40px" />
              <q-skeleton type="text" width="60px" height="12px" />
            </div>
            <div class="skeleton-section">
              <q-skeleton type="text" width="140px" height="16px" />
              <q-skeleton type="text" width="100px" height="14px" />
            </div>
            <div class="skeleton-section">
              <div class="skeleton-avatars">
                <q-skeleton type="circle" size="32px" />
                <q-skeleton type="circle" size="32px" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Appointment Cards -->
      <div v-else class="appointment-cards">
        <div
          v-for="appointment in paginatedData"
          :key="appointment.id"
          class="appointment-card cursor-pointer"
          @click="openDialog(appointment)"
        >
          <!-- Contact Information Section -->
          <div class="contact-section">
            <div class="contact-icons">
              <q-icon name="person" class="contact-icon" />
              <q-icon name="email" class="contact-icon" />
              <q-icon name="phone" class="contact-icon" />
            </div>
            <div class="contact-details">
              <div class="contact-name">{{ getContactName(appointment) }}</div>
              <div class="contact-email">
                {{ getContactEmail(appointment) }}
              </div>
              <div class="contact-phone">
                {{ getContactPhone(appointment) }}
              </div>
            </div>
          </div>

          <!-- Address Section -->
          <div class="address-section">
            <q-icon name="home" class="address-icon" />
            <div class="address-details">
              <div class="address-street">
                {{ appointment.fields.appointment_address || '-' }}
              </div>
            </div>
          </div>

          <!-- Status Section -->
          <div class="status-section">
            <div class="status-pill">
              <div class="status-indicator">
                <div class="status-text" :class="getStatusTextClass(appointment)">
                  {{ getStatusText(appointment) }}
                </div>
                <div
                  v-if="
                    !appointment.fields.is_cancelled &&
                    !appointment.fields.is_completed &&
                    getTimeRemaining(appointment.fields.appointment_date) &&
                    !getTimeRemaining(appointment.fields.appointment_date).includes('PAST')
                  "
                  class="time-remaining"
                >
                  {{ getTimeRemaining(appointment.fields.appointment_date) }}
                </div>
              </div>
              <div class="date-time-section">
                <div class="date-time-info">
                  <div class="date-time-row">
                    <q-icon name="schedule" class="clock-icon" />
                    <span class="appointment-date-text">{{
                      formatDate(appointment.fields.appointment_date)
                    }}</span>

                    <span class="appointment-time-text">{{
                      formatTime(appointment.fields.appointment_date)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Agent Section -->
          <div class="staff-section">
            <div
              v-if="getAgentNames(appointment) && getAgentNames(appointment).length > 0"
              class="agent-avatars"
            >
              <q-avatar
                v-for="(agentName, index) in getAgentNames(appointment).slice(0, 3)"
                :key="index"
                :style="{ backgroundColor: getAgentColor(appointment, index) }"
                size="40px"
                class="text-white agent-avatar"
              >
                {{ getAgentInitials(agentName, getAgentSurname(appointment, index)) }}
              </q-avatar>

              <q-avatar
                v-if="getAgentNames(appointment).length > 3"
                color="grey-6"
                size="40px"
                class="text-white agent-avatar additional-staff"
              >
                +{{ getAgentNames(appointment).length - 3 }}
              </q-avatar>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <div class="pagination-info">
          <span class="pagination-text">
            Showing {{ startItem }} to {{ endItem }} of
            {{ filteredAppointments.length }} appointments
          </span>
          <div class="rows-per-page-selector">
            <span class="rows-label">Rows per page:</span>
            <q-select
              v-model="rowsPerPage"
              :options="[5, 10, 15, 20, 25, 50]"
              dense
              outlined
              @update:model-value="updateRowsPerPage"
              style="width: 80px; margin-left: 8px"
              class="rows-select"
            />
          </div>
        </div>
        <div class="pagination-controls">
          <q-pagination
            v-model="currentPage"
            :max="totalPages"
            :max-pages="7"
            direction-links
            boundary-links
            color="primary"
            text-color="grey-7"
            active-design="unelevated"
            active-color="primary"
            active-text-color="white"
            class="custom-pagination"
          />
        </div>
      </div>
    </div>
    <!-- Add and Edit Appointment Dialog -->
    <AppoinmentDialog
      v-model="appoinmentDialog.show"
      :operation="appoinmentDialog.operation"
      :appointment-data="appoinmentDialog.data"
      @appointment-created="onAppointmentCreated"
      @appointment-updated="onAppointmentUpdated"
    ></AppoinmentDialog>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import AppoinmentDialog from 'src/components/AppointmentDialog.vue'
import { DEFAULT_PAGINATION, STATUS } from '../constants' // Defualt Pagination Constants and status constants
import { useAgentService } from '../stores/useAgentService' // agent operations methods

export default defineComponent({
  name: 'AppointmentList',

  props: {
    // Get filters data from parent component(MainLayout <- from FilterComponent)
    filters: {
      type: Object,
      default: () => ({}),
    },
  },
  components: { AppoinmentDialog },
  setup() {
    // Use the agent service for agent operations methods
    const agentService = useAgentService()
    return {
      agentService,
    }
  },
  data: function () {
    return {
      /**  API Configuration TODO: Move to a separate file */
      apiUrl: process.env.VUE_APP_API_BASE_URL || '',
      baseId: process.env.VUE_APP_API_BASE_ID || '',
      appoinmentTableId: process.env.VUE_APP_API_APPOINTMENT_TABLE_ID || '',
      apiKey: process.env.VUE_APP_API_KEY || '',

      paginatedAppointments: [],
      filteredAppointments: [],

      // Pagination properties using DEFAULT_PAGINATION constants - TODO: Move to a separate file
      currentPage: DEFAULT_PAGINATION.page,
      rowsPerPage: DEFAULT_PAGINATION.rowsPerPage,
      sortBy: DEFAULT_PAGINATION.sortBy,
      descending: DEFAULT_PAGINATION.descending,

      appointmentsLoading: false, // Separate loading state for appointments data

      // Appointment Dialog properties
      appoinmentDialog: {
        show: false,
        oparation: 'ADD',
        data: null,
      },
    }
  },
  computed: {
    // Pagination computed properties
    totalPages() {
      return Math.ceil(this.filteredAppointments.length / this.rowsPerPage)
    },
    paginatedData() {
      let sortedData = [...this.filteredAppointments]

      // Apply sorting based on sortBy and descending properties
      if (this.sortBy) {
        sortedData.sort((a, b) => {
          let aValue = this.getNestedValue(a, this.sortBy)
          let bValue = this.getNestedValue(b, this.sortBy)

          // Handle date sorting
          if (this.sortBy.includes('date')) {
            aValue = new Date(aValue || 0)
            bValue = new Date(bValue || 0)
          }

          // Handle string comparison
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
          }

          if (aValue < bValue) return this.descending ? 1 : -1
          if (aValue > bValue) return this.descending ? -1 : 1
          return 0
        })
      }

      // Apply pagination
      const start = (this.currentPage - 1) * this.rowsPerPage
      const end = start + this.rowsPerPage
      return sortedData.slice(start, end)
    },
    startItem() {
      return this.filteredAppointments.length === 0
        ? 0
        : (this.currentPage - 1) * this.rowsPerPage + 1
    },
    endItem() {
      const end = this.currentPage * this.rowsPerPage
      return Math.min(end, this.filteredAppointments.length)
    },
  },
  watch: {
    // Filters watcher - Changing filters will trigger this watcher
    filters: {
      handler(newFilters) {
        this.applyFilters(newFilters)
      },
      deep: true,
      immediate: false,
    },
  },
  mounted() {
    this.init() //IMPORTANT: APPOINTMENTS ARE ONLY CALLED ONCE
  },
  methods: {
    // Fetch Call API for appointments
    async init() {
      try {
        this.appointmentsLoading = true
        const axios = (await import('axios')).default // dynamically import axios

        // Check if all required variables are set
        if (!this.apiUrl || !this.baseId || !this.appoinmentTableId || !this.apiKey) {
          console.error('Please control .env file')
          return
        }

        const endpoint = `${this.apiUrl}/${this.baseId}/${this.appoinmentTableId}`

        // We will add the API key as a header
        const config = {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }

        const response = await axios.get(endpoint, config) // Make API call
        const { records } = response.data // Extract records - destructuring assignment

        let filteredRecords = records
        filteredRecords = this.filterRecords(records, this.filters) // Apply filters

        this.paginatedAppointments = records // Keep original data
        this.filteredAppointments = filteredRecords // Keep filtered data
        this.currentPage = DEFAULT_PAGINATION.page // Reset to first page using constant

        await this.fetchAgentDetailsForAppointments(records) // Fetch agent details
      } catch (error) {
        console.error('An error occurred while fetching appointments:', error)
      } finally {
        this.appointmentsLoading = false // Completed fetch operations and loading is completed
      }
    },

    // Agent details for appoinment records
    async fetchAgentDetailsForAppointments(appointments) {
      // Extract unique agent IDs from all appointments
      const uniqueAgentIds = new Set()

      appointments.forEach((appointment) => {
        if (appointment.fields.agent_id && Array.isArray(appointment.fields.agent_id)) {
          appointment.fields.agent_id.forEach((agentId) => {
            if (agentId) uniqueAgentIds.add(agentId)
          })
        }
      })
      ////////////////

      // Fetch agent details using the centralized service
      if (uniqueAgentIds.size > 0) {
        // Async call to getAgentsByIds method with agent ID array
        await this.agentService.getAgentsByIds([...uniqueAgentIds])
      }
    },

    // Contact Name-Surname for appoinment record
    getContactName(appointment) {
      const contactName = appointment.fields.contact_name
      const contactSurname = appointment.fields.contact_surname

      // Handle different data types
      if (Array.isArray(contactName)) {
        if (Array.isArray(contactSurname)) {
          let surname = contactSurname[0]

          if (typeof contactSurname === 'string') {
            surname = contactSurname
          }

          if (surname) {
            return `${contactName[0]} ${surname}`
          }
        }
        return contactName[0]
      }

      if (typeof contactName === 'string') {
        return contactName
      }

      return 'Unknown Contact'
    },

    // Contact Email for appoinment record
    getContactEmail(appointment) {
      const contactEmail = appointment.fields.contact_email

      if (Array.isArray(contactEmail)) {
        return contactEmail[0] || '-'
      }

      if (typeof contactEmail === 'string') {
        return contactEmail || '-'
      }

      return '-'
    },

    // Contact Phone for appoinment record
    getContactPhone(appointment) {
      const contactPhone = appointment.fields.contact_phone

      if (Array.isArray(contactPhone)) {
        return contactPhone[0] || '-'
      }

      if (typeof contactPhone === 'string') {
        return contactPhone || '-'
      }

      return '-'
    },

    // Agent Name for appoinment record
    getAgentNames(appointment) {
      const agentName = appointment.fields.agent_name

      if (Array.isArray(agentName)) {
        return agentName.filter((name) => name && name.trim())
      }

      if (typeof agentName === 'string' && agentName.trim()) {
        return [agentName.trim()]
      }

      return []
    },

    // Agent Surname for appoinment record
    getAgentSurname(appointment, index) {
      const agentSurname = appointment.fields.agent_surname

      if (Array.isArray(agentSurname)) {
        return agentSurname[index] || ''
      }

      if (typeof agentSurname === 'string' && index === 0) {
        return agentSurname || ''
      }

      return ''
    },

    // Get initials from agent name and surname and combined (For avatar)
    getAgentInitials(name, surname) {
      // Handle array elements
      let initials = ''
      if (name && name.trim()) {
        initials += name.trim().charAt(0)
      }
      if (surname && surname.trim()) {
        initials += surname.trim().charAt(0)
      }
      return initials.toUpperCase() || '?'
    },

    // Using centralized service(agent service), get agent color
    getAgentColor(appointment, index) {
      // First try to get color from agent_id lookup
      if (appointment.fields.agent_id && appointment.fields.agent_id[index]) {
        const agentId = appointment.fields.agent_id[index]
        const agentDetails = this.agentService.agentDetails[agentId]
        if (agentDetails && agentDetails.color) {
          return agentDetails.color
        }
      }

      // Use centralized service for default colors with comprehensive palette
      return this.agentService.getAgentColor(null, index)
    },

    // Get status text for appoinment record
    getStatusText(appointment) {
      // If cancelled
      if (appointment.fields.is_cancelled) {
        return STATUS.find((s) => s.value === 'CANCELLED')?.label || 'Cancelled'
      }

      // Dynamic text by date for UPCOMING status
      if (appointment.fields.appointment_date) {
        const timeRemaining = this.getTimeRemaining(appointment.fields.appointment_date) // Calculate remaining time

        // If past, appoinment is completed
        if (timeRemaining === 'PAST') {
          return 'Completed'
        }

        // If appoinment is not 'cancelled' and 'past', appoinment is 'Upcoming' status
        if (timeRemaining.includes('minute') || timeRemaining.includes('hour')) return 'Upcoming'
        if (timeRemaining === '1 day') return 'Upcoming'
        if (timeRemaining.includes('day') && !timeRemaining.includes('week')) return 'Upcoming'
        if (timeRemaining.includes('week') || timeRemaining.includes('month')) return 'Upcoming'
      }

      // Default status -> UPCOMING
      return STATUS.find((s) => s.value === 'UPCOMING')?.label || 'Upcoming'
    },

    // Return dynamic color class based on appointment status
    getStatusTextClass(appointment) {
      // If cancelled
      if (appointment.fields.is_cancelled) {
        return 'status-text-cancelled'
      }

      if (appointment.fields.appointment_date) {
        const timeRemaining = this.getTimeRemaining(appointment.fields.appointment_date) // Calculate remaining time

        if (timeRemaining.includes('PAST')) return 'status-text-completed' // If past
        if (timeRemaining.includes('minute') || timeRemaining.includes('hour'))
          return 'status-text-upcoming'
        if (timeRemaining === '1 day') return 'status-text-tomorrow'
        if (timeRemaining.includes('day') && !timeRemaining.includes('week'))
          return 'status-text-upcoming'
        if (timeRemaining.includes('week') || timeRemaining.includes('month'))
          return 'status-text-upcoming'
      }

      return 'status-text-upcoming' // Default
    },

    // Get time remaining for appoinment record
    getTimeRemaining(appointmentDate) {
      if (!appointmentDate) return ''

      const now = new Date()
      const appointment = new Date(appointmentDate)

      // Calculate the exact time difference in milliseconds
      const diffTime = appointment.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      // If appointment is in the past
      if (diffTime < 0) {
        return 'PAST'
      }

      // If appointment is within the next 24 hours
      if (diffHours < 24) {
        if (diffHours === 0) {
          return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`
      }

      // If appointment is more than 24 hours away
      if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
      }

      // If appointment is more than 7 days away or 7 day + less one mounth (Calculated by weeks)
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return `${weeks} week${weeks !== 1 ? 's' : ''}`
      }

      // If appointment is more than 30 days away or 30 day (Calculated by months)
      const months = Math.floor(diffDays / 30)
      return `${months} month${months !== 1 ? 's' : ''}`
    },

    // Format date - Using Locale format date
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    },

    // Format time - Using Locale format time
    formatTime(dateTimeString) {
      if (!dateTimeString) return '-'

      const date = new Date(dateTimeString)
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    },

    /*
     * Check if appoinment status
     * return {boolean}
     */
    isAppointmentStatus(appointment, status) {
      // Important: Cancelled appointments should never be considered completed

      // If cancelled
      if (appointment.fields.is_cancelled) {
        return false
      }

      // If no date
      if (!appointment.fields.appointment_date) {
        return false
      }

      const timeRemaining = this.getTimeRemaining(appointment.fields.appointment_date) // Calculate remaining time

      // COMPLETED -> PAST must be
      // UPCOMING -> PAST must not be

      if (status === 'COMPLETED') {
        return timeRemaining === 'PAST'
      }

      if (status === 'UPCOMING') {
        return timeRemaining !== 'PAST'
      }
    },

    // Undo formatting to compare by date filtering - Switch to system format
    parseFilterDate(dateString) {
      // Parse date string in format: DD-MM-YYYY HH:mm
      if (!dateString) return null

      try {
        // Split date and time parts
        const [datePart, timePart] = dateString.split(' ')
        const [day, month, year] = datePart.split('-')
        const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00']

        // Create Date object (month is 0-indexed)
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
        )

        // Validate the date
        if (isNaN(date.getTime())) {
          return null
        }

        return date
      } catch (error) {
        console.warn('Error parsing filter date:', dateString, error)
        return null
      }
    },

    // Filter the list of records according to the filters in the filters object
    filterRecords(records, filters) {
      // No filters, return all records
      if (!filters || Object.keys(filters).length === 0) {
        return records
      }

      // Apply filters
      return records.filter((record) => {
        // Check each filter
        for (const key in filters) {
          const filterValue = filters[key]

          // If the filter value is empty or null, skip it.
          if (filterValue === null || filterValue === '' || filterValue === undefined) continue

          // Agent Filter - ID-based filtering only
          if (key === 'selectedAgents') {
            if (filterValue && filterValue.length > 0) {
              const appointmentAgentIds = record.fields.agent_id || [] // Get agent IDs from the appointment

              // Ensure appointmentAgentIds is an array
              const agentIds = Array.isArray(appointmentAgentIds)
                ? appointmentAgentIds
                : [appointmentAgentIds]

              // Check if any of the selected agent IDs match the appointment's agent IDs
              const hasMatchingAgent = filterValue.some((selectedAgentId) => {
                return agentIds.includes(selectedAgentId)
              })

              if (!hasMatchingAgent) {
                return false
              }
            }
          }

          // If the filtered field is “status”
          if (key === 'status') {
            // isAppointmentStatus is common method for UPCOMING and COMPLETED
            if (filterValue === 'UPCOMING' || filterValue === 'COMPLETED') {
              // Upcoming: not cancelled and not completed (not in the past)
              // Completed: appointment date is in the past
              if (!this.isAppointmentStatus(record, filterValue)) {
                return false
              }
            } else if (filterValue === 'CANCELLED') {
              // Cancelled: has is_cancelled flag
              if (!record.fields.is_cancelled) {
                return false
              }
            }
            // Diğer status değerleri için ek kontroller eklenebilir
            continue
          }

          // Search by text (Contact name,address,phone,email)
          if (key === 'search') {
            if (filterValue) {
              const { appointment_address } = record.fields

              // Create a combined search string from all relevant fields using helper methods
              const searchFields = [
                appointment_address || '',
                this.getContactName(record),
                this.getContactEmail(record),
                this.getContactPhone(record),
              ]
                .join(' ')
                .toLowerCase()

              // Check if the search term is found in any of the fields
              if (!searchFields.includes(filterValue.toLowerCase())) {
                return false
              }
            }
          }

          // Date range filtering
          if (key === 'dateFrom' || key === 'dateTo') {
            if (!record.fields.appointment_date) {
              continue // Skip records without appointment date
            }

            const appointmentDate = new Date(record.fields.appointment_date)

            if (key === 'dateFrom' && filterValue) {
              // Parse dateFrom (format: DD-MM-YYYY HH:mm) - INCLUSIVE
              const fromDate = this.parseFilterDate(filterValue)
              if (fromDate && appointmentDate < fromDate) {
                return false
              }
            }

            if (key === 'dateTo' && filterValue) {
              // Parse dateTo (format: DD-MM-YYYY HH:mm) - INCLUSIVE
              const toDate = this.parseFilterDate(filterValue)
              if (toDate && appointmentDate > toDate) {
                return false
              }
            }
          }
        }
        return true
      })
    },

    // Apply filters to the list of records
    applyFilters(filters = this.filters) {
      const filteredRecords = this.filterRecords(this.paginatedAppointments, filters)
      this.filteredAppointments = filteredRecords
      this.currentPage = DEFAULT_PAGINATION.page // Reset to first page when filters change using constant
    },

    // Preparing column name for sort operations
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null
      }, obj)
    },

    // Update rows per page
    updateRowsPerPage(newRowsPerPage) {
      this.rowsPerPage = newRowsPerPage
      this.currentPage = DEFAULT_PAGINATION.page // Reset to first page using constant
    },

    // Open dialog for Add new appointment
    openAppointmentDialog() {
      this.appoinmentDialog.show = true
      this.appoinmentDialog.operation = 'ADD'
    },

    // Handle appointment creation
    onAppointmentCreated() {
      this.appoinmentDialog.show = false
      this.init() // Refresh the appointment list
    },

    // Handle appointment update
    onAppointmentUpdated() {
      this.appoinmentDialog.show = false
      this.init() // Refresh the appointment list
    },

    // Open dialog for editing an appointment
    openDialog(appointment) {
      this.appoinmentDialog.show = true
      this.appoinmentDialog.operation = 'EDIT'
      this.appoinmentDialog.data = appointment
    },
  },
})
</script>

<style scoped>
.appointment-list-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.appointment-count .count-text {
  font-size: 12px;
  font-weight: 400;
  color: #2c3e50;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-text {
  margin-top: 16px;
  color: #6c757d;
  font-size: 16px;
}

/* Appointment Cards */
.appointment-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  display: grid;
  grid-template-columns: 2.5fr 2fr 2.5fr 1.5fr;
  gap: 24px;
  align-items: center;
  transition: all 0.2s ease;
  min-height: 120px;
  justify-items: center;
}

.appointment-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Contact Section */
.contact-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 80px;
}

.contact-icons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  min-width: 20px;
}

.contact-icon {
  font-size: 16px;
  color: #6c757d;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.contact-name {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
  line-height: 1.4;
}

.contact-email,
.contact-phone {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.3;
}

/* Address Section */
.address-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 80px;
}

.address-icon {
  font-size: 18px;
  color: #6c757d;
  min-width: 20px;
}

.address-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.address-street {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
  line-height: 1.3;
}

.address-city {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.3;
}

/* Status Section */
.status-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 280px;
}

.status-pill-container {
  width: 100%;
  max-width: 280px;
}

.status-pill {
  border-radius: 20px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  min-height: 60px;
  max-height: 80px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #e91e63, #f06292);
  box-shadow: 0 3px 10px rgba(233, 30, 99, 0.3);
  width: 100%;
}

.status-pill-today {
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.status-pill-overdue {
  background: linear-gradient(135deg, #f44336, #ef5350);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.status-pill-tomorrow {
  background: linear-gradient(135deg, #ffc107, #ffd54f);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.status-pill-completed {
  background: linear-gradient(135deg, #4caf50, #81c784);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.status-pill-canceled {
  background: linear-gradient(135deg, #9e9e9e, #bdbdbd);
  box-shadow: 0 4px 12px rgba(158, 158, 158, 0.3);
  opacity: 0.7;
  filter: grayscale(0.3);
}

.status-indicator {
  background: white;
  border-radius: 14px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  max-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.status-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
}

.status-text {
  font-weight: 700;
  font-size: 11px;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

/* Dynamic status text colors */
.status-text-overdue {
  color: #f44336; /* Red for overdue */
}

.status-text-today {
  color: #ff9800; /* Orange for today */
}

.status-text-tomorrow {
  color: #ffc107; /* Amber for tomorrow */
}

.status-text-upcoming {
  color: #ffc107; /* Amber for tomorrow */
}

.status-text-completed {
  color: #4caf50; /* Green for completed */
}

.status-text-cancelled {
  color: #f44336; /* Red for cancelled */
}

.time-remaining {
  font-weight: 500;
  font-size: 9px;
  color: #666;
  line-height: 1.2;
  text-transform: lowercase;
  letter-spacing: 0.2px;
  text-align: center;
  margin-top: 2px;
}

.date-time-section {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-weight: 600;
  justify-content: flex-start;
  flex: 1;
  min-width: 0;
  padding: 4px 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.clock-icon {
  font-size: 18px;
  color: white;
  opacity: 0.95;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.date-time-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.date-time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.appointment-date-text {
  font-size: 13px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.appointment-time-text {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.2;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.time-separator {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-size: 12px;
  margin: 0 2px;
}

/* Date/Time Section */
.datetime-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.datetime-icon {
  font-size: 16px;
  color: #6c757d;
}

.datetime-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.appointment-date {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 600;
  line-height: 1.3;
}

.appointment-time {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.3;
}

/* Staff Section */
.staff-section {
  display: flex;
  justify-content: flex-end;
}

.agent-avatars {
  display: flex;
  align-items: center;
  gap: -8px; /* Negative gap for overlapping effect */
}

.agent-avatar {
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.agent-avatar:hover {
  transform: translateY(-2px) scale(1.05);
  z-index: 2;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.agent-avatar:not(:first-child) {
  margin-left: -8px;
}

.additional-staff {
  background-color: #6c757d !important;
  color: white;
  font-size: 11px;
  font-weight: 600;
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding: 24px 0;
  border-top: 1px solid #e9ecef;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.pagination-text {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.rows-per-page-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rows-label {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.rows-select {
  min-width: 80px;
}

.pagination-controls {
  display: flex;
  justify-content: flex-end;
  flex: 1;
}

.custom-pagination {
  background: transparent;
}

/* Custom pagination button styling */
.custom-pagination :deep(.q-btn) {
  min-width: 40px;
  height: 40px;
  margin: 0 2px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.custom-pagination :deep(.q-btn--unelevated) {
  background: var(--q-color-primary) !important;
  color: black !important;
  box-shadow: 0 2px 8px #e91e63;
}

.custom-pagination :deep(.q-btn:not(.q-btn--unelevated)) {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e9ecef;
}

.custom-pagination :deep(.q-btn:not(.q-btn--unelevated):hover) {
  background: #e9ecef;
  color: #495057;
  border-color: #dee2e6;
  transform: translateY(-1px);
}

.custom-pagination :deep(.q-btn--unelevated:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--q-color-primary-rgb), 0.4);
  box-shadow: 0 2px 8px #e91e63;
}

/* Responsive pagination */
@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .pagination-controls {
    justify-content: center;
  }

  .custom-pagination :deep(.q-btn) {
    min-width: 36px;
    height: 36px;
    margin: 0 1px;
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .appointment-card {
    grid-template-columns: 2fr 1.5fr 2fr 1fr;
    gap: 20px;
  }

  .staff-section {
    justify-content: flex-start;
    margin-top: 12px;
  }
}

/* Tablet responsive */
@media (max-width: 1024px) {
  .status-pill {
    padding: 12px 16px;
  }

  .status-indicator {
    min-width: 100px;
    padding: 10px 16px;
  }

  .status-main {
    gap: 6px;
    flex-direction: column;
  }

  .status-text {
    font-size: 12px;
  }

  .time-remaining {
    font-size: 10px;
  }

  .date-time-section {
    padding: 3px 6px;
    gap: 10px;
  }

  .clock-icon {
    font-size: 16px;
  }

  .appointment-date-text {
    font-size: 12px;
  }

  .appointment-time-text {
    font-size: 11px;
    padding: 1px 6px;
  }

  .date-time-row {
    gap: 6px;
  }
}

@media (max-width: 768px) {
  .appointment-card {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .contact-section,
  .address-section,
  .datetime-section {
    flex-direction: row;
    align-items: center;
  }

  .status-section {
    justify-content: flex-start;
  }

  .status-pill-container {
    max-width: 100%;
  }

  .status-pill {
    padding: 14px 18px;
  }

  .status-indicator {
    min-width: 110px;
    padding: 10px 18px;
  }

  .date-time-section {
    gap: 10px;
    padding: 4px 8px;
  }

  .date-time-row {
    gap: 6px;
    flex-wrap: nowrap;
  }

  .staff-section {
    justify-content: flex-start;
    margin-top: 0;
  }
}

@media (max-width: 480px) {
  .status-pill {
    gap: 12px;
    padding: 16px 20px;
  }

  .status-indicator {
    min-width: auto;
    width: 100%;
    padding: 16px 24px;
  }

  .status-main {
    flex-direction: column;
    gap: 6px;
  }

  .status-text {
    font-size: 14px;
  }

  .time-remaining {
    font-size: 12px;
  }

  .date-time-section {
    justify-content: center;
    gap: 12px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.15);
  }

  .clock-icon {
    font-size: 20px;
  }

  .appointment-date-text {
    font-size: 14px;
  }

  .appointment-time-text {
    font-size: 13px;
    padding: 3px 10px;
  }

  .date-time-row {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .time-separator {
    font-size: 14px;
  }
}

/* Dialog Styles */
.q-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

/* Appointments Loading Skeleton Styles */
.appointments-loading-container {
  padding: 20px;
}

.loading-header {
  margin-bottom: 24px;
  text-align: center;
}

.loading-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-card-skeleton {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

.skeleton-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.skeleton-avatars {
  display: flex;
  gap: 8px;
}

@keyframes skeletonPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 1024px) {
  .appointment-card-skeleton {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .skeleton-section {
    align-items: center;
    text-align: center;
  }
}
</style>
