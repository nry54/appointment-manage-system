<template>
  <q-dialog v-model="showForm" persistent>
    <q-card class="appointment-form-card">
      <!-- DIALOG TITLE SECTION -->
      <q-card-section class="dialog-header q-py-lg q-px-lg">
        <div class="header-content">
          <div class="header-left">
            <div class="header-icon-wrapper">
              <q-icon name="event_note" size="28px" class="header-icon" />
            </div>
            <div class="header-text">
              <div class="text-h5 header-title">
                {{ operation === 'ADD' ? 'Create Appointment' : 'Edit Appointment' }}
              </div>
              <div class="header-subtitle">
                {{
                  operation === 'ADD' ? 'Schedule a new appointment' : 'Update appointment details'
                }}
              </div>
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            class="close-btn"
            @click="$emit('update:modelValue', false)"
            size="md"
          />
        </div>
      </q-card-section>
      <!--------------------->

      <!-- APPOINTMENT RECORD SECTION FORM -->
      <q-card-section class="q-py-md q-px-lg q-gutter-y-lg">
        <q-form @submit="createAppointment" class="q-gutter-md">
          <div v-if="formData.selectedContact" class="selected-contact-wrapper">
            <div class="contact-label">
              <q-icon name="person" class="label-icon" color="primary" />
              <span class="label-text">Selected Contact</span>
            </div>
            <q-card flat class="selected-contact-card">
              <q-card-section class="contact-card-section">
                <div class="contact-info-section">
                  <div class="contact-details">
                    <div class="contact-detail-item">
                      <q-icon name="person" class="detail-icon" />
                      {{ formData.selectedContact.contact_name }}
                      {{ formData.selectedContact.contact_surname }}
                    </div>
                  </div>
                  <div class="contact-details">
                    <div class="contact-detail-item">
                      <q-icon name="email" size="14px" class="detail-icon" />
                      <span class="detail-text">{{
                        formData.selectedContact.contact_email || 'No email provided'
                      }}</span>
                    </div>
                    <div class="contact-detail-item">
                      <q-icon name="phone" size="14px" class="detail-icon" />
                      <span class="detail-text">{{
                        formData.selectedContact.contact_phone || 'No phone provided'
                      }}</span>
                    </div>
                  </div>
                </div>
                <div class="contact-actions">
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    color="grey-6"
                    class="remove-contact-btn"
                    @click="formData.selectedContact = null"
                    size="sm"
                  >
                    <q-tooltip>Remove contact</q-tooltip>
                  </q-btn>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <q-select
            v-else
            filled
            v-model="formData.selectedContact"
            :options="filteredContacts"
            use-input
            dense
            hide-selected
            hide-dropdown-icon=""
            fill-input
            input-debounce="0"
            label="Search"
            @filter="filterRecords"
            option-value="id"
            option-label="contact_name"
            emit-value
            map-options
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
            <template v-slot:append>
              <div class="search-icon-container">
                <q-icon name="search" class="cursor-pointer search-icon" />
              </div>
            </template>

            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <div class="contact-section">
                    <div class="contact-icons">
                      <q-icon name="person" class="contact-icon" />
                      <q-icon name="email" class="contact-icon" />
                      <q-icon name="phone" class="contact-icon" />
                    </div>
                    <div class="contact-details">
                      <div class="contact-name">
                        {{ scope.opt.contact_name }} {{ scope.opt.contact_surname }}
                      </div>
                      <div class="contact-email">
                        {{ scope.opt.contact_email || '-' }}
                      </div>
                      <div class="contact-phone">
                        {{ scope.opt.contact_phone || '-' }}
                      </div>
                    </div>
                  </div>
                </q-item-section>
              </q-item>
              <q-separator v-if="scope.index < filteredContacts.length - 1" inset />
            </template>
          </q-select>

          <q-input
            outlined
            dense
            v-model="formData.address"
            label="Address"
            placeholder="Enter the address for this appointment"
            clearable
            color="primary"
          >
            <template v-slot:prepend>
              <q-icon name="location_on" color="primary" />
            </template>
          </q-input>

          <!-- Enhanced Selected Agent Display - Outside Select -->
          <q-select
            outlined
            dense
            v-model="selectedAgentTemp"
            :options="availableAgentOptions"
            label="Agent"
            placeholder="Choose an agent for this appointment"
            emit-value
            map-options
            color="primary"
            clearable
            @update:model-value="addAgent"
          >
            <template v-slot:prepend>
              <q-icon name="support_agent" color="primary" />
            </template>

            <!-- Agent Options in Dropdown -->
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps" class="agent-option-item">
                <q-item-section avatar>
                  <q-avatar
                    :style="{ backgroundColor: getAgentColor(scope.opt) }"
                    text-color="white"
                    size="40px"
                    class="agent-avatar"
                  >
                    {{ getAgentInitials(scope.opt) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="agent-option-name">{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption class="agent-option-role">Real Estate Agent</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="person" color="grey-5" size="18px" />
                </q-item-section>
              </q-item>
            </template>

            <!-- No Options State -->
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-center text-grey-5">
                  <div class="no-agents-state">
                    <q-icon name="group_off" size="32px" class="q-mb-sm" />
                    <div>No agents available</div>
                    <div class="text-caption">Please check your connection</div>
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <!-- Enhanced Selected Agents Display - Multiple Selection -->
          <div v-if="formData.selectedAgents.length > 0" class="selected-agents-wrapper">
            <div class="agent-label">
              <q-icon name="support_agent" class="label-icon" color="primary" />
              <span class="label-text">Selected Agents ({{ formData.selectedAgents.length }})</span>
            </div>
            <div class="selected-agents-container">
              <div
                v-for="(agent, index) in formData.selectedAgents"
                :key="agent.id || index"
                class="selected-agent-display-enhanced"
              >
                <div class="agent-avatar-container">
                  <q-avatar
                    :style="{ backgroundColor: getAgentColor(agent, index) }"
                    text-color="white"
                    size="40px"
                    class="agent-avatar"
                  >
                    {{ getAgentInitials(agent) }}
                  </q-avatar>
                  <div class="agent-status-indicator"></div>
                </div>
                <div class="agent-info-container">
                  <span class="agent-name-selected">{{ getAgentLabel(agent) }}</span>
                  <span class="agent-role-selected">Real Estate Agent</span>
                </div>
                <div class="agent-remove-btn">
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    color="grey-6"
                    class="remove-agent-btn"
                    @click="removeAgent(index)"
                    size="sm"
                  >
                    <q-tooltip>Remove agent</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>

          <q-input
            dense
            v-model="formData.appointmentDate"
            label="Appointment Date"
            readonly
            outlined
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer" color="primary">
                <q-popup-proxy
                  anchor="bottom left"
                  self="top left"
                  :offset="[0, 10]"
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-card style="width: 680px">
                    <q-card-section class="bg-primary text-white">
                      <div class="text-h6">
                        <q-icon name="event_note" size="sm" /> Select Date & Time
                      </div>
                    </q-card-section>
                    <q-card-section class="row q-gutter-md q-pa-md">
                      <div class="col-auto">
                        <q-date
                          v-model="dateValue"
                          mask="YYYY-MM-DD"
                          color="primary"
                          flat
                          bordered
                          @update:model-value="updateDateTime"
                          class="shadow-1"
                        />
                      </div>
                      <div class="col-auto">
                        <q-time
                          v-model="timeValue"
                          mask="HH:mm"
                          color="primary"
                          format24h
                          flat
                          @update:model-value="updateDateTime"
                          class="shadow-1"
                          style="border: 1px solid #e0e0e0; border-radius: 8px"
                        />
                      </div>
                    </q-card-section>
                    <q-separator />
                  </q-card>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-form>
      </q-card-section>
      <!--------------------->

      <!-- DIALOG ACTION -->
      <q-card-actions class="q-px-lg q-pb-lg q-pt-md">
        <q-space />

        <q-btn
          flat
          label="Cancel"
          color="grey-7"
          @click="$emit('update:modelValue', false)"
          class="q-mr-sm"
        />
        <q-btn
          unelevated
          :label="operation === 'ADD' ? 'Create' : 'Update'"
          color="primary"
          @click="createAppointment"
          :loading="loading"
        />
      </q-card-actions>
      <!--------------------->
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import { useAirtableStore } from '../stores/airtableClient.store.js'

export default defineComponent({
  name: 'AppointmentPage',

  props: {
    operation: {
      type: String,
      default: 'ADD',
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
    appointmentData: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:modelValue', 'appointment-created', 'appointment-updated'], // For sending data to parent component
  computed: {
    airtableStore() {
      return useAirtableStore()
    },
    // Dialog visibility status information
    showForm: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },

    // Get agents from the Pinia store
    agents() {
      return this.airtableStore.getAllAgents || []
    },

    // Create content item for Agent select items
    agentOptions() {
      if (!this.agents || this.agents.length === 0) {
        return []
      }

      const options = this.agents.map((agent, index) => {
        const option = {
          label:
            `${agent.fields.agent_name || ''} ${agent.fields.agent_surname || ''}`.trim() ||
            `Agent ${index + 1}`,
          value: agent.fields,
          color: agent.fields.color,
          agentData: agent.fields,
        }
        return option
      })

      return options
    },

    // To prevent the selected agent item from reappearing on the select
    availableAgentOptions() {
      // Filter out already selected agents
      const selectedAgentIds = this.formData.selectedAgents.map(
        (agent) => agent.agent_id || agent.id || JSON.stringify(agent),
      )

      return this.agentOptions.filter((option) => {
        const agentId = option.value.agent_id || option.value.id || JSON.stringify(option.value)
        return !selectedAgentIds.includes(agentId)
      })
    },
  },
  data() {
    return {
      loading: false,
      dateValue: '',
      timeValue: '',
      selectedAgentTemp: null, // Temporary variable for agent selection
      formData: {
        appointmentId: null, // For edit operations
        selectedContact: null,
        selectedCustomer: null,
        selectedAgents: [], // Changed to array for multiple agents
        address: '',
        appointmentDate: '',
        useStaticData: false, // Sabit verilerle create işlemi için
      },

      // Data arrays
      contacts: [],
      contactList: [],
      filteredContacts: [],
      agentLoading: false,
      contactRecords: [],
    }
  },
  watch: {
    modelValue(newVal) {
      if (newVal) {
        // Reset form when dialog opens
        this.resetForm()
        // Load appointment data if editing
        if (this.operation === 'EDIT' && this.appointmentData) {
          this.loadAppointmentData()
        }
      }
    },
    // This triggers when the appointment list item is clicked.
    appointmentData: {
      handler(newVal) {
        if (newVal && this.operation === 'EDIT') {
          this.loadAppointmentData()
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    await this.fetchAllAgents() //Fetching agents
    await this.fetchAllContacts() // Fetching contacts
  },
  methods: {
    //Fetching agents
    async fetchAllAgents() {
      try {
        // Use the Pinia store to fetch agents
        await this.airtableStore.fetchAllAgents()
      } catch (error) {
        console.error('Error loading agents:', error)

        // Show error notification
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load agents',
          position: 'top',
          icon: 'error',
        })
      }
    },

    // Fetching contacts - Fetching data from the Contacts table in one operation from the API
    async fetchAllContacts() {
      try {
        const records = await this.airtableStore.fetchAllContacts() // Fetch API call
        this.contactRecords = records

        this.contactList = records.map((contact) => ({
          ...contact.fields,
          id: contact.id, // id'yi de ekleyelim
          number: contact.fields?.number, // number'ı da ekleyelim
        })) // Get only fields
      } catch (error) {
        console.error('Error:', error)
      }
    },

    // Search contact with text - Name or surname
    filterRecords(val, update) {
      // If the search box is empty, show the entire list
      if (val === '') {
        update(() => {
          this.filteredContacts = this.contactList
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase() // The text entered by the user - By lower case transform
        this.filteredContacts = this.contactList.filter(
          (contact) =>
            contact.contact_name.toLowerCase().includes(needle) ||
            contact.contact_surname.toLowerCase().includes(needle),
        )
      })
    },

    // Create Appointment using Pinia store
    async createAppointment() {
      if (
        !this.formData.selectedContact ||
        !this.formData.address ||
        this.formData.selectedAgents.length === 0 ||
        !this.formData.appointmentDate
      ) {
        // Enhanced validation error notification
        this.$q.notify({
          type: 'negative',
          message: 'Please fill in all required fields',
          position: 'top',
          icon: 'error',
          caption: 'Contact, Address, Agent, and Date are required',
          timeout: 4000,
        })
        return
      }

      // Show processing notification
      const processingNotif = this.$q.notify({
        type: 'ongoing',
        message: `${this.operation === 'ADD' ? 'Creating' : 'Updating'} appointment...`,
        position: 'top',
        icon: 'schedule',
        caption: 'Please wait while we process your request',
        timeout: 0,
        spinner: true,
      })

      this.loading = true

      try {
        // Daha önce çalışan sabit verilerle create işlemi için geçici çözüm
        // Eğer formData'da sabit veriler varsa, doğrudan onları kullan
        if (this.formData.useStaticData) {
          // Önceki çalışan sabit veriler
          const staticAppointmentData = {
            records: [
              {
                fields: {
                  // 1. Contact Alanı (Tekli Bağlantı)
                  Contact: ['rec0BntvpdVDQS2DT'],

                  // 2. Agents Alanı (Çoklu Bağlantı)
                  Agents: ['recbuYVenj0I5s96z', 'recev3wtQD2ZpsXty'],

                  // 3. Appointment Address Alanı (Metin Alanı)
                  appointment_address: this.formData.address || 'Sakarya',

                  // 4. Appointment Date Alanı (Tarih Alanı)
                  appointment_date: '2025-09-19T20:35:00.000Z',
                },
              },
            ],
          }

          const response = await this.airtableStore.createRecord(
            'appointments',
            staticAppointmentData,
          )
          this.loading = false
          processingNotif()

          // Show success notification
          this.$q.notify({
            type: 'positive',
            message: 'Appointment created successfully with static data!',
            position: 'top',
            icon: 'check_circle',
            timeout: 5000,
          })

          this.resetForm()
          this.$emit('update:modelValue', false)
          this.$emit('appointment-created', response)
          return
        }

        // Gelen verilerle çalışacak şekilde güncellenmiş kod
        // Find the full contact record to get the Airtable record ID
        let contactRecord = null
        let contactId = null

        // Önce formData.selectedContact'tan contactId'yi çıkaralım
        if (this.formData.selectedContact) {
          contactId =
            this.formData.selectedContact.id ||
            this.formData.selectedContact.contact_id ||
            this.formData.selectedContact.number
        }

        // Eğer contactId "rec" ile başlamıyorsa, contactRecords'ta arayalım
        if (contactId && !contactId.startsWith('rec')) {
          contactRecord = this.contactRecords.find((record) => record.fields?.number === contactId)
          if (contactRecord) {
            contactId = contactRecord.id
          }
        } else if (contactId && contactId.startsWith('rec')) {
          // contactId zaten "rec" ile başlıyorsa, contactRecord'u bulalım
          contactRecord = this.contactRecords.find((record) => record.id === contactId)
        } else {
          // Eğer contactId yoksa veya geçerli değilse, contactRecords'ta arayalım
          contactRecord = this.contactRecords.find(
            (record) =>
              record.id === this.formData.selectedContact.id ||
              record.id === this.formData.selectedContact.contact_id ||
              record.fields?.number === this.formData.selectedContact.number,
          )
          if (contactRecord) {
            contactId = contactRecord.id
          }
        }

        // Contact ID'nin "rec" ile başladığından emin olalım
        if (!contactId || !contactId.startsWith('rec')) {
          throw new Error('Valid contact ID starting with "rec" is required')
        }

        // Prepare agent IDs - extract Airtable record IDs from selected agents
        const agentIds = this.formData.selectedAgents
          .map((agent) => {
            // Try to find the agent in our agents list to get the real Airtable record ID
            const fullAgent = this.agents.find(
              (a) =>
                a.id === agent.id ||
                a.id === agent.agent_id ||
                a.fields?.number === agent.number ||
                (a.fields?.agent_name === agent.agent_name &&
                  a.fields?.agent_surname === agent.agent_surname),
            )

            // Return the actual Airtable record ID if found, otherwise try to use what we have
            const agentId = fullAgent ? fullAgent.id : agent.agent_id || agent.id || agent.number

            // Agent ID'nin "rec" ile başladığından emin olalım
            if (agentId && typeof agentId === 'string' && agentId.startsWith('rec')) {
              return agentId
            }

            console.warn('Invalid agent ID found:', agentId, 'for agent:', agent)
            return null
          })
          .filter((id) => id !== null)

        // Validate that we have at least one agent
        if (agentIds.length === 0) {
          // If we couldn't find valid agent IDs, try to use the agent data directly
          const directAgentIds = this.formData.selectedAgents
            .map((agent) => agent.id || agent.agent_id || agent.number)
            .filter((id) => id && typeof id === 'string' && id.startsWith('rec'))

          if (directAgentIds.length > 0) {
            agentIds.push(...directAgentIds)
          }
        }

        // En az bir agent olduğundan emin olalım
        if (agentIds.length === 0) {
          throw new Error('At least one valid agent ID starting with "rec" is required')
        }

        // Prepare appointment data with proper Airtable format
        const appointmentData = {
          selectedContact: this.formData.selectedContact,
          selectedAgents: this.formData.selectedAgents,
          address: this.formData.address,
          appointment_date: this.formData.appointmentDate,
          agentIds: agentIds, // Ekstra olarak agentIds'i de gönderiyoruz
        }

        let response
        if (this.operation === 'ADD') {
          console.log('Appointment data being sent:', appointmentData)
          // Create new appointment using Pinia store
          response = await this.airtableStore.createAppointment(
            'appointments',
            appointmentData,
            contactRecord,
          )
        } else {
          // Update existing appointment using Pinia store
          const appointmentId = this.formData.appointmentId
          if (!appointmentId) {
            throw new Error('Appointment ID is required for update operation')
          }
          response = await this.airtableStore.updateRecord(
            'appointments',
            appointmentId,
            appointmentData,
          )
        }

        this.loading = false
        processingNotif() // Dismiss processing notification

        // Show success notification
        this.$q.notify({
          type: 'positive',
          message: `Appointment ${this.operation === 'ADD' ? 'created' : 'updated'} successfully!`,
          position: 'top',
          icon: 'check_circle',
          timeout: 5000,
          caption: `Contact: ${this.formData.selectedContact.contact_name} | Date: ${this.formData.appointmentDate}`,
        })

        this.resetForm()
        this.$emit('update:modelValue', false)
        this.$emit(
          this.operation === 'ADD' ? 'appointment-created' : 'appointment-updated',
          response,
        )
      } catch (error) {
        this.loading = false
        processingNotif() // Dismiss processing notification

        console.error('Error creating/updating appointment:', error)

        // Show error notification
        this.$q.notify({
          type: 'negative',
          message: `Failed to ${this.operation === 'ADD' ? 'create' : 'update'} appointment`,
          position: 'top',
          icon: 'error',
          caption: error.message || 'Please try again later',
          timeout: 5000,
        })
      }
    },

    // Agent avatar letter string operations
    getAgentInitials(agent) {
      let initials = ''

      // Handle different agent data structures
      if (!agent) {
        return '?'
      }

      // If agent is a string (like "John Doe"), split it
      if (typeof agent === 'string') {
        const nameParts = agent.trim().split(' ')
        if (nameParts.length >= 1 && nameParts[0]) {
          initials += nameParts[0].charAt(0)
        }
        if (nameParts.length >= 2 && nameParts[nameParts.length - 1]) {
          initials += nameParts[nameParts.length - 1].charAt(0)
        }
        return initials.toUpperCase() || '?'
      }

      // Handle object structure
      const agentData = agent.agentData || agent
      let { agent_name, agent_surname } = agentData || {}

      // Ensure agent_name and agent_surname are strings
      agent_name = String(agent_name || '')
      agent_surname = String(agent_surname || '')

      if (agent_name && agent_name.trim()) {
        initials += agent_name.charAt(0)
      }
      if (agent_surname && agent_surname.trim()) {
        initials += agent_surname.charAt(0)
      }

      return initials.toUpperCase() || '?'
    },

    // Prepared for selected agent
    getAgentLabel(agent) {
      if (!agent) return 'Agent'

      // If agent is a string, return it directly
      if (typeof agent === 'string') {
        return agent.trim() || 'Agent'
      }

      // Handle object structure
      const agentData = agent.agentData || agent
      let { agent_name, agent_surname } = agentData || {}

      // Ensure names are strings
      agent_name = String(agent_name || '')
      agent_surname = String(agent_surname || '')

      return `${agent_name} ${agent_surname}`.trim() || 'Agent'
    },

    // Select agent operations for appoinment
    // INFO: Those who have not been selected can be selected
    addAgent(selectedAgent) {
      if (selectedAgent && !this.isAgentSelected(selectedAgent)) {
        // Gelen verilerle çalışacak şekilde agent verisini zenginleştirelim
        const enrichedAgent = {
          ...selectedAgent,
          // Agent'in sahip olabileceği tüm özellikleri ekleyelim
          id: selectedAgent.id || selectedAgent.agent_id || selectedAgent.number,
          agent_id: selectedAgent.agent_id || selectedAgent.id || selectedAgent.number,
          agent_name: selectedAgent.agent_name || selectedAgent.name || selectedAgent.label,
          agent_surname: selectedAgent.agent_surname || selectedAgent.surname || '',
          number: selectedAgent.number || selectedAgent.id || selectedAgent.agent_id,
          // AgentData varsa onu da ekleyelim
          agentData: selectedAgent.agentData || selectedAgent.fields || selectedAgent,
        }

        this.formData.selectedAgents.push(enrichedAgent)
        this.selectedAgentTemp = null // Clear the select

        // Info message
        this.$q.notify({
          type: 'positive',
          message: `Agent ${this.getAgentLabel(enrichedAgent)} added successfully!`,
          position: 'top',
        })
      }
    },

    // Deletes the selected agents from the list
    removeAgent(index) {
      if (index >= 0 && index < this.formData.selectedAgents.length) {
        const removedAgent = this.formData.selectedAgents[index]
        this.formData.selectedAgents.splice(index, 1) // Remove item from array
        console.log('Agent removed:', removedAgent)
      }
    },

    // Check selected for agent
    isAgentSelected(agent) {
      return this.formData.selectedAgents.some((selectedAgent) => {
        const selectedId =
          selectedAgent.agent_id || selectedAgent.id || JSON.stringify(selectedAgent)
        const agentId = agent.agent_id || agent.id || JSON.stringify(agent)
        return selectedId === agentId
      })
    },

    // Default values are assigned to formData
    resetForm() {
      this.formData = {
        appointmentId: null,
        selectedContact: null,
        selectedCustomer: null,
        selectedAgents: [],
        address: '',
        appointmentDate: '',
        useStaticData: false, // Sabit verilerle create işlemi için
      }
      this.selectedAgentTemp = null
      this.dateValue = ''
      this.timeValue = ''
      this.filteredContacts = []
    },

    // If an agent color is specified, that color is assigned; otherwise, the default colors are used.
    getAgentColor(agent, fallbackIndex = 0) {
      const agentData = agent.agentData || agent

      if (agentData && agentData.color) {
        return agentData.color
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

    // Date-time operations
    updateDateTime() {
      if (this.dateValue && this.timeValue) {
        const day = this.dateValue.split('-')[2]
        const month = this.dateValue.split('-')[1]
        const year = this.dateValue.split('-')[0]
        this.formData.appointmentDate = `${day}-${month}-${year} ${this.timeValue}`
      }
    },

    // Test method for static data
    testWithStaticData() {
      this.formData.useStaticData = true
      this.formData.address = 'Test Address'
      this.createAppointment()
    },

    // The selected appointment data is assigned to the FormData values
    loadAppointmentData() {
      if (this.appointmentData) {
        const { appointment_id, contact_id, contact_name, appointment_address, appointment_date } =
          this.appointmentData.fields
        this.formData.appointmentId = appointment_id
        this.formData.address = appointment_address || ''
        this.formData.appointmentDate = appointment_date || ''

        // Load contact data
        if (contact_id || contact_name) {
          // Contact ID'nin "rec" ile başladığından emin olalım
          if (contact_id && contact_id.startsWith('rec')) {
            this.formData.selectedContact = {
              id: contact_id,
              contact_name: contact_name,
              contact_email: this.appointmentData.fields.contact_email,
              contact_phone: this.appointmentData.fields.contact_phone,
            }
          } else {
            // Eğer contact_id "rec" ile başlamıyorsa, contactRecords'ta arayalım
            const contactRecord = this.contactRecords.find(
              (record) => record.fields?.number === contact_id,
            )
            if (contactRecord) {
              this.formData.selectedContact = {
                id: contactRecord.id,
                contact_name: contact_name,
                contact_email: this.appointmentData.fields.contact_email,
                contact_phone: this.appointmentData.fields.contact_phone,
              }
            } else {
              // Eğer bulamazsak, olduğu gibi kullanalım
              this.formData.selectedContact = {
                id: contact_id,
                contact_name: contact_name,
                contact_email: this.appointmentData.fields.contact_email,
                contact_phone: this.appointmentData.fields.contact_phone,
              }
            }
          }
        }

        // Load agents data - Enhanced to handle different formats
        if (this.appointmentData.fields?.Agents) {
          const agentsData = this.appointmentData.fields.Agents

          // Reset selected agents
          this.formData.selectedAgents = []

          // Handle array of agents from Airtable
          if (Array.isArray(agentsData)) {
            agentsData.forEach((agentRecord) => {
              // Each agentRecord should have an id and fields
              if (agentRecord && agentRecord.id && agentRecord.fields) {
                // Agent ID'nin "rec" ile başladığından emin olalım
                if (agentRecord.id.startsWith('rec')) {
                  this.formData.selectedAgents.push({
                    id: agentRecord.id,
                    ...agentRecord.fields,
                  })
                }
              } else if (typeof agentRecord === 'string' && agentRecord.startsWith('rec')) {
                // If it's just an ID string, create a minimal object
                this.formData.selectedAgents.push({
                  id: agentRecord,
                })
              } else if (typeof agentRecord === 'object' && agentRecord !== null) {
                // If it's an object, use it directly but id'nin "rec" ile başladığından emin olalım
                if (agentRecord.id && agentRecord.id.startsWith('rec')) {
                  this.formData.selectedAgents.push(agentRecord)
                }
              }
            })
          }
        }

        // Parse date and time for date/time inputs
        if (appointment_date) {
          try {
            // Convert ISO date to our format for the date/time pickers
            const dateObj = new Date(appointment_date)
            this.dateValue = dateObj.toISOString().split('T')[0] // YYYY-MM-DD
            this.timeValue = dateObj.toTimeString().substring(0, 5) // HH:mm
            this.formData.appointmentDate = appointment_date
          } catch (error) {
            console.warn('Error parsing appointment date:', error)
          }
        }
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.appointment-form-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* Enhanced Header */
.dialog-header {
  background: linear-gradient(135deg, var(--q-primary) 0%, #1976d2 100%);
  color: white;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.header-icon-wrapper {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon {
  color: white;
}

.header-text {
  flex: 1;
}

.header-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: white;
  font-size: 20px;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.4;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* Form Content */
.form-content {
  background: #fafafa;
}

/* Selected Contact Design */
.selected-contact-wrapper {
  margin-bottom: 20px;
}

.contact-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.label-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.label-icon {
  font-size: 18px;
}

.selected-contact-card {
  border: 2px solid var(--q-primary);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.02) 0%, rgba(25, 118, 210, 0.05) 100%);
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease-out;
}

.selected-contact-card:hover {
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.15);
  transform: translateY(-1px);
}

.contact-card-section {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.contact-avatar-section {
  flex-shrink: 0;
}

.contact-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.contact-info-section {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-weight: 700;
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 8px;
  line-height: 1.2;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  color: var(--q-primary);
  flex-shrink: 0;
}

.detail-text {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.3;
}

.contact-actions {
  flex-shrink: 0;
}

.remove-contact-btn {
  background: rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.remove-contact-btn:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  transform: scale(1.1);
}

/* Enhanced Inputs */
.q-field--outlined .q-field__control {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.q-field--outlined.q-field--focused .q-field__control {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

/* Enhanced Agent Selection Styles */
.selected-agent-wrapper,
.selected-agents-wrapper {
  margin-bottom: 20px;
}

.selected-agents-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.selected-agent-display-enhanced {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%);
  border-radius: 12px;
  border: 2px solid var(--q-primary);
  transition: all 0.3s ease;
  min-height: 60px;
  animation: slideIn 0.3s ease-out;
}

.selected-agent-display-enhanced:hover {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.04) 100%);
  border-color: rgba(25, 118, 210, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.2);
}

.agent-avatar-container {
  position: relative;
  flex-shrink: 0;
}

.agent-status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.agent-info-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.agent-name-selected {
  font-weight: 700;
  font-size: 16px;
  color: #2c3e50;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-role-selected {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-remove-btn {
  flex-shrink: 0;
}

.remove-agent-btn {
  background: rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease {

  }
}

.remove-agent-btn:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  transform: scale(1.1);
}

.selected-agent-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name {
  font-weight: 500;
  color: #2c3e50;
}

.agent-option-item {
  padding: 16px;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 4px 8px;
}

.agent-option-item:hover {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.04) 100%);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
}

.agent-avatar {
  margin-left: -8px;
  border: 3px solid #ffffff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.agent-option-item:hover .agent-avatar {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.agent-option-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 15px;
}

.agent-option-role {
  color: #6c757d;
  font-size: 12px;
  font-weight: 500;
}

.no-agents-state {
  padding: 20px;
  text-align: center;
}

.no-agents-state .q-icon {
  color: #bdbdbd;
}

.no-agents-state div {
  color: #9e9e9e;
  margin-bottom: 4px;
}

/* Contact Section Styles */
.contact-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.contact-icons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.contact-icon {
  font-size: 16px;
  color: #6c757d;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* Responsive */
@media (max-width: 600px) {
  .appointment-form-card {
    max-width: 95vw;
    margin: 8px;
    border-radius: 12px;
  }

  .header-left {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .header-text {
    text-align: center;
  }

  .contact-card-section {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .contact-info-section {
    text-align: center;
  }
}

/* Animation */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-icon-container {
  background-color: #e91e63;
  border: 2px solid #e91e63;
  border-radius: 4px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin-right: -12px;
}

.search-icon {
  color: #ffffff;
  font-size: 20px;
  transition: color 0.2s ease;

  &:hover {
    color: #f0f0f0;
  }
}
</style>
