<template>
  <q-page class="flex flex-center q-pa-md">
    <q-dialog v-model="showForm" persistent>
      <q-card class="appointment-form-card">
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
                    operation === 'ADD'
                      ? 'Schedule a new appointment'
                      : 'Update appointment details'
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
              @click="showForm = false"
              size="md"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-py-md q-px-lg q-gutter-y-lg">
          <q-form @submit="createAppointment" class="q-gutter-md">
            <div v-if="formData.selectedContact" class="selected-contact-wrapper">
              <div class="contact-label">
                <q-icon name="person" class="label-icon" color="primary" />
                <span class="label-text">Selected Contact</span>
              </div>
              <q-card flat class="selected-contact-card">
                <q-card-section class="contact-card-section">
                  <div class="contact-avatar-section">
                    <q-avatar color="primary" text-color="white" size="48px" class="contact-avatar">
                      {{ getContactInitials(formData.selectedContact) }}
                    </q-avatar>
                  </div>
                  <div class="contact-info-section">
                    <div class="contact-name">{{ formData.selectedContact.contact_name }}</div>
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
                        <div class="contact-name">{{ scope.opt.contact_name }}</div>
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
                <span class="label-text"
                  >Selected Agents ({{ formData.selectedAgents.length }})</span
                >
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
                      size="32px"
                      class="agent-avatar-selected"
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

        <q-card-actions class="q-px-lg q-pb-lg q-pt-md">
          <q-space />
          <q-btn flat label="Cancel" color="grey-7" @click="showForm = false" class="q-mr-sm" />
          <q-btn
            unelevated
            :label="operation === 'ADD' ? 'Create Appointment' : 'Update Appointment'"
            color="primary"
            @click="createAppointment"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
export default {
  name: 'AppointmentPage',

  props: {
    operation: {
      type: String,
      default: 'ADD',
    },
  },
  computed: {
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
      showForm: true,
      loading: false,
      dateValue: '',
      timeValue: '',
      selectedAgentTemp: null, // Temporary variable for agent selection
      formData: {
        selectedContact: null,
        selectedCustomer: null,
        selectedAgents: [], // Changed to array for multiple agents
        address: '',
        appointmentDate: '',
      },
      // API configuration
      apiUrl: process.env.VUE_APP_API_BASE_URL || '',
      baseId: process.env.VUE_APP_API_BASE_ID || '',
      contactTableId: process.env.VUE_APP_API_CONTACT_TABLE_ID || '',
      agentTableId: process.env.VUE_APP_API_AGENT_TABLE_ID || '',
      apiKey: process.env.VUE_APP_API_KEY || '',

      // Data arrays
      contacts: [],
      contactList: [],
      filteredContacts: [],
      agents: [],
      agentLoading: false,
    }
  },
  async mounted() {
    this.fetchAllContacts()
    await this.fetchAllAgents()
  },
  methods: {
    async fetchAllAgents() {
      try {
        this.agentLoading = true
        const axios = (await import('axios')).default

        if (!this.apiUrl || !this.baseId || !this.agentTableId || !this.apiKey) {
          console.error('Agent API configuration missing. Please check your .env file.')

          return
        }

        const endpoint = `${this.apiUrl}/${this.baseId}/${this.agentTableId}`
        const config = {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }

        const response = await axios.get(endpoint, config)
        const { records } = response.data

        this.agents = records
        console.log('Agents fetched successfully:', records.length, 'agents')

        // Show notification if no agents found
        if (records.length === 0) {
          this.$q.notify({
            type: 'warning',
            message: 'No agents found. Please check your configuration.',
            position: 'top',
          })
        }
      } catch (error) {
        console.error('Error fetching agents:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to load agents. Please try again.',
          position: 'top',
        })
      } finally {
        this.agentLoading = false
      }
    },
    async fetchAllContacts() {
      // API'den tek seferde contacts tablosundaki verileri çekme işlemi
      try {
        const axios = (await import('axios')).default

        if (!this.apiUrl || !this.baseId || !this.contactTableId || !this.apiKey) {
          console.error(
            'API URL, Base ID, Contact Table ID veya API KEY eksik. Lütfen .env dosyanızı kontrol edin.',
          )
          return
        }
        // Gerekirse endpoint'i logla
        const endpoint = `${this.apiUrl}/${this.baseId}/${this.contactTableId}`

        // API key'i header olarak ekleyeceğiz
        const config = {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            // Eğer API farklı bir header bekliyorsa örn. 'x-api-key', yukarıdaki satırı değiştirin
          },
        }
        const response = await axios.get(endpoint, config)
        // Elde edilen randevuları component'in appointments prop'una emit ile gönderiyoruz
        const { records } = response.data

        this.contactList = records.map((contact) => contact.fields)
      } catch (error) {
        // Hata durumunda konsola yazdır
        console.error('Error:', error)
      }
    },
    filterRecords(val, update) {
      if (val === '') {
        // Arama kutusu boşsa, tüm listeyi göster
        update(() => {
          this.filteredContacts = this.contactList
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase() // Kullanıcının girdiği metin
        this.filteredContacts = this.contactList.filter(
          (contact) =>
            contact.contact_name.toLowerCase().includes(needle) ||
            contact.contact_surname.toLowerCase().includes(needle),
        )
      })
    },
    createAppointment() {
      if (
        !this.formData.selectedContact ||
        !this.formData.address ||
        this.formData.selectedAgents.length === 0 ||
        !this.formData.appointmentDate
      ) {
        this.$q.notify({
          type: 'negative',
          message: 'Please fill in all required fields.',
          position: 'top',
        })
        return
      }

      this.loading = true

      // Simulate API call
      setTimeout(() => {
        this.loading = false
        this.$q.notify({
          type: 'positive',
          message: `Appointment ${this.operation === 'ADD' ? 'created' : 'updated'} successfully!`,
          position: 'top',
        })
        this.showForm = false
        // this.$emit('created')
      }, 1000)
    },

    getContactInitials(contact) {
      const name = contact.contact_name || ''
      const surname = contact.contact_surname || ''
      let initials = ''
      if (name) initials += name.charAt(0)
      if (surname) initials += surname.charAt(0)
      return initials.toUpperCase() || '?'
    },

    getAgentInitials(agent) {
      let initials = ''
      const agentData = agent.agentData || agent
      const { agent_name, agent_surname } = agentData

      if (agent_name) {
        initials += agent_name.charAt(0)
      }
      if (agent_surname) {
        initials += agent_surname.charAt(0)
      }

      return initials.toUpperCase() || '?'
    },

    getSelectedAgentLabel() {
      if (!this.formData.selectedAgent) return []
      const { agent_name, agent_surname } = this.formData.selectedAgent
      return `${agent_name || ''} ${agent_surname || ''}`.trim() || 'Agent'
    },

    getAgentLabel(agent) {
      if (!agent) return 'Agent'
      const { agent_name, agent_surname } = agent
      return `${agent_name || ''} ${agent_surname || ''}`.trim() || 'Agent'
    },

    addAgent(selectedAgent) {
      if (selectedAgent && !this.isAgentSelected(selectedAgent)) {
        this.formData.selectedAgents.push(selectedAgent)
        this.selectedAgentTemp = null // Clear the select

        this.$q.notify({
          type: 'positive',
          message: `Agent ${this.getAgentLabel(selectedAgent)} added successfully!`,
          position: 'top',
        })
      }
    },

    removeAgent(index) {
      if (index >= 0 && index < this.formData.selectedAgents.length) {
        const removedAgent = this.formData.selectedAgents[index]
        this.formData.selectedAgents.splice(index, 1)
        console.log('Agent removed:', removedAgent)
      }
    },

    isAgentSelected(agent) {
      return this.formData.selectedAgents.some((selectedAgent) => {
        const selectedId =
          selectedAgent.agent_id || selectedAgent.id || JSON.stringify(selectedAgent)
        const agentId = agent.agent_id || agent.id || JSON.stringify(agent)
        return selectedId === agentId
      })
    },

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

    updateDateTime() {
      if (this.dateValue && this.timeValue) {
        const day = this.dateValue.split('-')[2]
        const month = this.dateValue.split('-')[1]
        const year = this.dateValue.split('-')[0]
        this.formData.appointmentDate = `${day}-${month}-${year} ${this.timeValue}`
      }
    },

    combineDateTime(dateString, timeString) {
      if (!dateString || !timeString) return ''
      try {
        const combinedDateTime = new Date(`${dateString}T${timeString}`)
        if (!combinedDateTime || isNaN(combinedDateTime.getTime())) {
          console.warn('Invalid date created:', dateString, timeString)
          return ''
        }
        const day = String(combinedDateTime.getDate()).padStart(2, '0')
        const month = String(combinedDateTime.getMonth() + 1).padStart(2, '0')
        const year = combinedDateTime.getFullYear()
        const hours = String(combinedDateTime.getHours()).padStart(2, '0')
        const minutes = String(combinedDateTime.getMinutes()).padStart(2, '0')

        return `${day}-${month}-${year} ${hours}:${minutes}`
      } catch (error) {
        console.error('Error combining date and time:', error)
        return ''
      }
    },
  },
}
</script>

<style lang="scss" scoped>
/* Enhanced Card */
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

.agent-avatar-selected {
  border: 3px solid white;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  font-size: 14px;
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
  transition: all 0.3s ease;
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
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
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
