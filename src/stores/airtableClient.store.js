import axios from 'axios'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

// Airtable Configuration
const AIRTABLE_BASE_ID = 'appkTtnhXACqj0kag'
const AIRTABLE_API_KEY = process.env.VUE_APP_API_KEY

// Axios client for Airtable API
const airtableClient = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

// Pinia Store Definition
export const useAirtableStore = defineStore('airtable', {
  state: () => ({
    // Agents data
    agents: [],
    agentDetails: {},
    agentsLoading: false,
    agentsError: null,

    // Contacts data
    contacts: [],
    contactsLoading: false,
    contactsError: null,

    // Appointments data
    appointments: [],
    appointmentsLoading: false,
    appointmentsError: null,
  }),

  getters: {
    // Agent getters
    getAllAgents: (state) => state.agents,
    getAgentById: (state) => (id) => state.agentDetails[id] || null,
    getAgentsCount: (state) => state.agents.length,

    // Contact getters
    getAllContacts: (state) => state.contacts,
    getContactsCount: (state) => state.contacts.length,

    // Appointment getters
    getAllAppointments: (state) => state.appointments,
    getAppointmentsCount: (state) => state.appointments.length,

    // Agent options for dropdowns
    getAgentOptions: (state) => {
      return state.agents.map((agent, index) => ({
        label:
          `${agent.fields?.agent_name || ''} ${agent.fields?.agent_surname || ''}`.trim() ||
          `Agent ${index + 1}`,
        value: agent.fields,
        id: agent.id,
        color: agent.fields?.color,
        agentData: agent.fields,
      }))
    },
  },

  actions: {
    // Agent Actions
    async fetchAllAgents(params = {}) {
      this.agentsLoading = true
      this.agentsError = null

      try {
        const response = await airtableClient.get('/agents', { params })
        this.agents = response.data.records

        // Cache individual agent details
        response.data.records.forEach((agent) => {
          this.agentDetails[agent.id] = agent.fields
        })

        return response.data.records
      } catch (error) {
        this.agentsError = error.response?.data?.error || error.message
        console.error('Error fetching agents:', error)
        throw error
      } finally {
        this.agentsLoading = false
      }
    },

    async fetchAgentById(agentId) {
      if (!agentId) return null

      // Return cached data if available
      if (this.agentDetails[agentId]) {
        return this.agentDetails[agentId]
      }

      try {
        const response = await airtableClient.get(`/agents/${agentId}`)
        const agentData = response.data.fields

        // Cache the agent details
        this.agentDetails[agentId] = agentData

        return agentData
      } catch (error) {
        console.error(`Error fetching agent ${agentId}:`, error)
        throw error
      }
    },

    async fetchAgentsByIds(agentIds) {
      if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
        return {}
      }

      const results = {}
      const uniqueIds = [...new Set(agentIds.filter(Boolean))]

      // Use Promise.all for concurrent fetching
      await Promise.all(
        uniqueIds.map(async (agentId) => {
          try {
            const agentData = await this.fetchAgentById(agentId)
            if (agentData) {
              results[agentId] = agentData
            }
          } catch (error) {
            console.error(`Failed to fetch agent ${agentId}:`, error)
          }
        }),
      )

      return results
    },

    // Contact Actions
    async fetchAllContacts(params = {}) {
      this.contactsLoading = true
      this.contactsError = null

      try {
        const response = await airtableClient.get('/contacts', { params })
        this.contacts = response.data.records
        return response.data.records
      } catch (error) {
        this.contactsError = error.response?.data?.error || error.message
        console.error('Error fetching contacts:', error)
        throw error
      } finally {
        this.contactsLoading = false
      }
    },

    // Appointment Actions
    async fetchAllAppointments(params = {}) {
      this.appointmentsLoading = true
      this.appointmentsError = null

      try {
        const response = await airtableClient.get('/appointments', { params })
        this.appointments = response.data.records
        return response.data.records
      } catch (error) {
        this.appointmentsError = error.response?.data?.error || error.message
        console.error('Error fetching appointments:', error)
        throw error
      } finally {
        this.appointmentsLoading = false
      }
    },

    async createAppointment(tableName, recordData, contactForAirtable) {
      console.log('recordData', recordData)

      // Daha önce çalışan sabit verilerle create işlemi için kontrol
      if (recordData.records && Array.isArray(recordData.records)) {
        // Eğer zaten doğru formatta geliyorsa, doğrudan kullan
        try {
          const response = await airtableClient.post(`/${tableName}`, recordData)
          // Update local state
          this.appointments.push(...response.data.records)
          return response.data
        } catch (error) {
          console.error('Error:', error.response || error)
          throw error
        }
      }

      // Gelen verilerle çalışacak şekilde güncellenmiş kod
      // Extract and validate agent IDs (must be valid Airtable record IDs)
      let agentIds = []

      // Önce recordData'dan gelen agentIds'i kontrol edelim
      if (recordData.agentIds && Array.isArray(recordData.agentIds)) {
        agentIds = recordData.agentIds.filter(
          (id) => id && typeof id === 'string' && id.startsWith('rec'),
        )
      }

      // Eğer agentIds yoksa, selectedAgents'tan çıkaralım
      if (agentIds.length === 0 && recordData.selectedAgents) {
        agentIds = recordData.selectedAgents
          .map((agent) => {
            // Get the agent ID from different possible sources
            const agentId = agent.id || agent.agent_id || agent.number

            // Airtable record IDs are strings that start with 'rec'
            if (agentId && typeof agentId === 'string' && agentId.startsWith('rec')) {
              return agentId
            }

            console.warn('Invalid agent ID found:', agentId, 'for agent:', agent)
            return null
          })
          .filter((id) => id !== null)
      }

      console.log('Extracted Agent IDs:', agentIds)

      // Validate that we have at least one agent
      if (!agentIds || agentIds.length === 0) {
        throw new Error('At least one valid agent ID is required')
      }

      // Validate contact ID
      let contactId = null

      // Önce contactForAirtable'tan contactId'yi çıkaralım
      if (contactForAirtable && contactForAirtable.id) {
        contactId = contactForAirtable.id
      } else if (recordData.selectedContact) {
        contactId =
          recordData.selectedContact.contact_id ||
          recordData.selectedContact.id ||
          recordData.selectedContact.number
      }

      // Contact ID'nin "rec" ile başladığından emin olalım
      if (!contactId || !contactId.startsWith('rec')) {
        throw new Error('Valid contact ID starting with "rec" is required')
      }

      console.log('Contact for Airtable:', contactForAirtable)

      // Tarih formatını düzelt
      let formattedDate = recordData.appointment_date
      if (formattedDate && typeof formattedDate === 'string') {
        // Eğer "DD-MM-YYYY HH:mm" formatındaysa, doğru formata çevir
        if (formattedDate.includes('-') && formattedDate.includes(' ')) {
          const [datePart, timePart] = formattedDate.split(' ')
          const [day, month, year] = datePart.split('-')
          formattedDate = dayjs(
            `${year}-${month}-${day} ${timePart}`,
            'YYYY-MM-DD HH:mm',
          ).toISOString()
        }
        // Eğer zaten ISO formatındaysa, olduğu gibi bırak
      }

      // Gelen verilerle çalışacak şekilde güncellenmiş payload
      const recordsToCreate = {
        records: [
          {
            fields: {
              // 1. Contact Alanı (Tekli Bağlantı)
              contact_id: [contactId],

              // 2. Agents Alanı (Çoklu Bağlantı)
              agent_id: agentIds,

              // 3. Appointment Address Alanı (Metin Alanı)
              appointment_address: recordData.address,

              // 4. Appointment Date Alanı (Tarih Alanı)
              appointment_date: formattedDate || recordData.appointment_date,
            },
          },
        ],
      }

      console.log('Final payload to Airtable:', recordsToCreate)

      try {
        const response = await airtableClient.post(`/${tableName}`, recordsToCreate)
        // Update local state
        this.appointments.push(...response.data.records)
        return response.data
      } catch (error) {
        console.error('Error:', error.response || error)
        throw error
      }
    },

    // Generic CRUD Operations
    async createRecord(tableName, recordData) {
      try {
        console.log('recordData', recordData)

        // Eğer recordData zaten doğru formatta geliyorsa (records array'i ile), doğrudan kullan
        if (recordData.records && Array.isArray(recordData.records)) {
          const response = await airtableClient.post(`/${tableName}`, recordData)

          // Update local state based on table
          if (tableName === 'appointments') {
            this.appointments.push(...response.data.records)
          } else if (tableName === 'contacts') {
            this.contacts.push(...response.data.records)
          } else if (tableName === 'agents') {
            this.agents.push(...response.data.records)
          }

          return response.data.records[0]
        }

        // Gelen verilerle çalışacak şekilde güncellenmiş kod
        // Format the data according to Airtable API requirements
        const formattedRecord = {
          fields: {},
        }

        // Process each field in the recordData
        for (const [key, value] of Object.entries(recordData)) {
          // Handle special cases for linked records (arrays of record IDs)
          if (key === 'agents' && Array.isArray(value)) {
            // For linked record fields, we need to send an array of record IDs that start with 'rec'
            formattedRecord.fields['Agents'] = value.filter(
              (id) => typeof id === 'string' && id.startsWith('rec'),
            )
          } else if (key === 'selectedAgents' && Array.isArray(value)) {
            // Handle selectedAgents array (from appointment form)
            formattedRecord.fields['Agents'] = value
              .map((agent) => agent.id || agent.agent_id || agent.number)
              .filter((id) => id && typeof id === 'string' && id.startsWith('rec'))
          } else if (key === 'contact_id' && typeof value === 'string' && value.startsWith('rec')) {
            // For single linked record, wrap in array if it starts with 'rec'
            formattedRecord.fields['Contact'] = [value]
          } else if (key === 'selectedContact' && typeof value === 'object' && value !== null) {
            // Handle selectedContact object (from appointment form)
            const contactId = value.id || value.contact_id || value.number
            if (contactId && typeof contactId === 'string' && contactId.startsWith('rec')) {
              formattedRecord.fields['Contact'] = [contactId]
            }
          } else if (key === 'agent_id' && typeof value === 'string' && value.startsWith('rec')) {
            // Handle single agent ID that starts with 'rec'
            formattedRecord.fields['Agents'] = [value]
          } else if (key === 'agent_id' && Array.isArray(value)) {
            // Handle array of agent IDs
            formattedRecord.fields['Agents'] = value.filter(
              (id) => typeof id === 'string' && id.startsWith('rec'),
            )
          } else if (key === 'agentIds' && Array.isArray(value)) {
            // Handle agentIds array (from appointment form)
            formattedRecord.fields['Agents'] = value.filter(
              (id) => typeof id === 'string' && id.startsWith('rec'),
            )
          } else if (key === 'Contact' && Array.isArray(value)) {
            // Handle Contact array directly
            formattedRecord.fields['Contact'] = value.filter(
              (id) => typeof id === 'string' && id.startsWith('rec'),
            )
          } else if (key === 'Agents' && Array.isArray(value)) {
            // Handle Agents array directly
            formattedRecord.fields['Agents'] = value.filter(
              (id) => typeof id === 'string' && id.startsWith('rec'),
            )
          } else if (key === 'appointment_date' && typeof value === 'string') {
            // Handle appointment date formatting
            if (value.includes('-') && value.includes(' ')) {
              // Eğer "DD-MM-YYYY HH:mm" formatındaysa, doğru formata çevir
              const [datePart, timePart] = value.split(' ')
              const [day, month, year] = datePart.split('-')
              formattedRecord.fields['appointment_date'] = dayjs(
                `${year}-${month}-${day} ${timePart}`,
                'YYYY-MM-DD HH:mm',
              ).toISOString()
            } else {
              // Diğer durumlarda olduğu gibi kullan
              formattedRecord.fields['appointment_date'] = value
            }
          } else {
            // For other fields, use the key as is
            formattedRecord.fields[key] = value
          }
        }

        console.log('Formatted record for Airtable:', formattedRecord)

        const response = await airtableClient.post(`/${tableName}`, {
          records: [formattedRecord],
        })

        // Update local state based on table
        if (tableName === 'appointments') {
          this.appointments.push(...response.data.records)
        } else if (tableName === 'contacts') {
          this.contacts.push(...response.data.records)
        } else if (tableName === 'agents') {
          this.agents.push(...response.data.records)
        }

        return response.data.records[0]
      } catch (error) {
        console.error(`Error creating record in ${tableName}:`, error)
        throw error
      }
    },

    async updateRecord(tableName, recordId, recordData) {
      try {
        const response = await airtableClient.patch(`/${tableName}/${recordId}`, {
          fields: recordData,
        })

        // Update local state based on table
        const updatedRecord = response.data
        if (tableName === 'appointments') {
          const index = this.appointments.findIndex((item) => item.id === recordId)
          if (index !== -1) {
            this.appointments[index] = updatedRecord
          }
        } else if (tableName === 'contacts') {
          const index = this.contacts.findIndex((item) => item.id === recordId)
          if (index !== -1) {
            this.contacts[index] = updatedRecord
          }
        } else if (tableName === 'agents') {
          const index = this.agents.findIndex((item) => item.id === recordId)
          if (index !== -1) {
            this.agents[index] = updatedRecord
          }
          // Update cache
          this.agentDetails[recordId] = updatedRecord.fields
        }

        return updatedRecord
      } catch (error) {
        console.error(`Error updating record ${recordId} in ${tableName}:`, error)
        throw error
      }
    },

    async deleteRecord(tableName, recordId) {
      try {
        const response = await airtableClient.delete(`/${tableName}/${recordId}`)

        // Update local state based on table
        if (tableName === 'appointments') {
          this.appointments = this.appointments.filter((item) => item.id !== recordId)
        } else if (tableName === 'contacts') {
          this.contacts = this.contacts.filter((item) => item.id !== recordId)
        } else if (tableName === 'agents') {
          this.agents = this.agents.filter((item) => item.id !== recordId)
          delete this.agentDetails[recordId]
        }

        return response.data
      } catch (error) {
        console.error(`Error deleting record ${recordId} from ${tableName}:`, error)
        throw error
      }
    },

    // Utility Actions
    getAgentColor(agent, fallbackIndex = 0) {
      if (agent) {
        const agentData = agent.fields || agent

        if (agentData && agentData.color) {
          return agentData.color
        }
      }

      // Default color palette
      const colors = [
        '#e91e63',
        '#9c27b0',
        '#673ab7',
        '#3f51b5',
        '#2196f3',
        '#03a9f4',
        '#00bcd4',
        '#009688',
        '#4caf50',
        '#8bc34a',
        '#cddc39',
        '#ffeb3b',
        '#ffc107',
        '#ff9800',
        '#ff5722',
        '#795548',
        '#607d8b',
      ]

      return colors[fallbackIndex % colors.length]
    },

    // Clear cache actions
    clearAgentsCache() {
      this.agents = []
      this.agentDetails = {}
      this.agentsError = null
    },

    clearContactsCache() {
      this.contacts = []
      this.contactsError = null
    },

    clearAppointmentsCache() {
      this.appointments = []
      this.appointmentsError = null
    },

    clearAllCache() {
      this.clearAgentsCache()
      this.clearContactsCache()
      this.clearAppointmentsCache()
    },
  },
})
