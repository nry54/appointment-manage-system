<template>
  <div class="filter-container">
    <div class="row items-center no-wrap q-col-gutter-md">
      <div class="col-grow row q-col-gutter-sm items-center no-wrap filter-group-left">
        <div class="col-auto">
          <!-- Agent Loading State -->
          <div v-if="agentsLoading" class="agent-selection-area loading-state">
            <q-skeleton v-for="n in 5" :key="n" type="QAvatar" size="40px" class="agent-skeleton" />
            <div class="loading-text">Loading agents...</div>
          </div>

          <!-- Agent Selection Area -->
          <div v-else-if="allAgents && allAgents.length > 0" class="agent-selection-area">
            <q-avatar
              v-for="agent in allAgents.slice(0, 5)"
              :key="agent.id"
              :style="{ backgroundColor: agent.fields.color }"
              :class="{ 'selected-agent': isSelected(agent.id) }"
              @click="selectAgent(agent.id)"
              size="40px"
              class="cursor-pointer text-white agent-avatar"
            >
              {{ agentAvatarLetters(agent) }}
            </q-avatar>

            <q-avatar
              v-if="allAgents.length > 5"
              color="white"
              size="35px"
              class="agent-avatar cursor-pointer more-avatars-indicator"
              @click="agentSelectDialog = true"
            >
              +{{ allAgents.length - 5 }}
            </q-avatar>
          </div>
        </div>

        <div class="col-auto">
          <q-select
            v-model="filters.status"
            :options="statusOptions"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="applyFilters"
            style="min-width: 150px"
          />
        </div>

        <div class="col-auto">
          <div class="row q-gutter-md no-wrap date-filter-group">
            <q-input
              :model-value="filters.dateFrom"
              @update:model-value="(val) => (filters.dateFrom = val)"
              label="From"
              outlined
              dense
              placeholder="DD-MM-YYYY HH:mm"
              style="width: 180px"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    ref="dateFromDatePopup"
                    anchor="bottom left"
                    self="top left"
                    :offset="[0, 10]"
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-card style="width: 680px">
                      <q-card-section class="bg-primary text-white">
                        <div class="text-h6">
                          <q-icon name="event_note" size="sm" color="grey-8" /> Select Date & Time
                        </div>
                      </q-card-section>
                      <q-card-section class="row q-gutter-md q-pa-md">
                        <div class="col-auto">
                          <q-date
                            v-model="filters.dateFromDate"
                            mask="YYYY-MM-DD"
                            color="primary"
                            flat
                            bordered
                            @update:model-value="updateDateFrom"
                            class="shadow-1"
                          />
                        </div>
                        <div class="col-auto">
                          <q-time
                            v-model="filters.dateFromTime"
                            mask="HH:mm"
                            color="primary"
                            format24h
                            flat
                            @update:model-value="updateDateFrom"
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

            <q-input
              :model-value="filters.dateTo"
              @update:model-value="(val) => (filters.dateTo = val)"
              label="To"
              outlined
              dense
              placeholder="DD-MM-YYYY HH:mm"
              style="width: 180px"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    ref="dateToDatePopup"
                    anchor="bottom left"
                    self="top left"
                    :offset="[0, 10]"
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-card style="width: 680px">
                      <q-card-section class="bg-primary text-white">
                        <div class="text-h6">
                          <q-icon name="event_note" size="sm" color="grey-8" /> Select Date & Time
                        </div>
                      </q-card-section>
                      <q-card-section class="row q-gutter-md q-pa-md">
                        <div class="col-auto">
                          <q-date
                            v-model="filters.dateToDate"
                            mask="YYYY-MM-DD"
                            color="primary"
                            flat
                            bordered
                            @update:model-value="updateDateTo"
                            class="shadow-1"
                          />
                        </div>
                        <div class="col-auto">
                          <q-time
                            v-model="filters.dateToTime"
                            mask="HH:mm"
                            color="primary"
                            format24h
                            flat
                            @update:model-value="updateDateTo"
                            class="shadow-1"
                            style="border: 1px solid #e0e0e0; border-radius: 8px"
                          />
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <div class="col-auto search-input-container">
        <q-input
          v-model="filters.search"
          label="Search"
          outlined
          dense
          clearable
          debounce="300"
          @update:model-value="applyFilters"
          class="search-input primary-border"
          style="min-width: 250px"
        >
          <template v-slot:append>
            <div class="search-icon-container">
              <q-icon name="search" class="cursor-pointer search-icon" />
            </div>
          </template>
        </q-input>
      </div>
    </div>
  </div>
</template>

<script>
import { STATUS } from '../constants/index'
// import FilterAgentDialog from 'src/components/FilterAgentDialog.vue'

export default {
  name: 'FilterComponent',

  emits: ['filter-changed'],
  components: {
    // FilterAgentDialog,
  },
  data() {
    return {
      filters: {
        selectedAgents: [],
        dateFrom: '',
        dateFromDate: '',
        dateFromTime: '',
        dateTo: '',
        dateToDate: '',
        dateToTime: '',
        status: STATUS.ALL,
        search: '',
      },
      allAgents: [],
      apiUrl: process.env.VUE_APP_API_BASE_URL || '',
      baseId: process.env.VUE_APP_API_BASE_ID || '',
      agentTableId: process.env.VUE_APP_API_AGENT_TABLE_ID || '',
      apiKey: process.env.VUE_APP_API_KEY || '',
      agentSelectDialog: false,
      agentsLoading: false, // Loading state for agents
    }
  },

  computed: {
    statusOptions() {
      return STATUS
    },

    activeFilters() {
      const active = {}

      if (this.filters.dateFrom) {
        active.dateFrom = {
          label: 'Başlangıç',
          value: this.filters.dateFrom,
        }
      }

      if (this.filters.dateTo) {
        active.dateTo = {
          label: 'Bitiş',
          value: this.filters.dateTo,
        }
      }

      if (this.filters.status) {
        const status = this.statusOptions.find((s) => s.value === this.filters.status)
        active.status = {
          label: 'Durum',
          value: status ? status.label : this.filters.status,
        }
      }

      if (this.filters.search) {
        active.search = {
          label: 'Arama',
          value: this.filters.search,
        }
      }

      return active
    },

    activeFiltersCount() {
      return Object.keys(this.activeFilters).length
    },
  },

  mounted() {
    this.getAllAgents()
    this.filters.status = (STATUS.find((s) => s.value === 'ALL') || {}).value

    // Set From date to today at 09:00
    const now = new Date()
    now.setHours(9, 0, 0, 0)
    this.filters.dateFromDate = now.toISOString().slice(0, 10)
    this.filters.dateFromTime = '09:00'

    // Set To date to one month later at 18:00
    const oneMonthLater = new Date()
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
    oneMonthLater.setHours(18, 0, 0, 0)
    this.filters.dateToDate = oneMonthLater.toISOString().slice(0, 10)
    this.filters.dateToTime = '18:00'

    // Use nextTick to ensure Vue has processed the data changes
    this.$nextTick(() => {
      this.updateDateFrom()
      this.updateDateTo()
    })
  },

  methods: {
    async getAllAgents() {
      try {
        this.agentsLoading = true
        const axios = (await import('axios')).default
        if (!this.apiUrl || !this.baseId || !this.agentTableId || !this.apiKey) {
          console.error('Please control .env file')
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
        this.allAgents = records
        console.log('Filter agents loaded:', records.length)
      } catch (error) {
        console.error('Error while getting agent list:', error)
      } finally {
        this.agentsLoading = false
      }
    },
    agentAvatarLetters(agent) {
      let initials = ''
      const { agent_name, agent_surname } = agent.fields
      if (agent_name) {
        initials += agent_name.charAt(0)
      }
      if (agent_surname) {
        initials += agent_surname.charAt(0)
      }
      return initials.toUpperCase()
    },
    selectAgent(agentId) {
      const index = this.filters.selectedAgents.indexOf(agentId)
      if (index > -1) {
        this.filters.selectedAgents.splice(index, 1)
      } else {
        this.filters.selectedAgents.push(agentId)
      }

      this.applyFilters()
    },
    isSelected(agentId) {
      return this.filters.selectedAgents.includes(agentId)
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
    applyFilters() {
      const processedFilters = {
        ...this.filters,
        search: this.filters.search ? this.filters.search.toLowerCase().trim() : '',
      }
      this.$emit('filter-changed', processedFilters)
    },
    updateDateFrom() {
      if (this.filters.dateFromDate && this.filters.dateFromTime) {
        const combinedDate = this.combineDateTime(
          this.filters.dateFromDate,
          this.filters.dateFromTime,
        )
        if (combinedDate) {
          this.filters.dateFrom = combinedDate

          this.applyFilters()
        }
      }
    },
    updateDateTo() {
      if (this.filters.dateToDate && this.filters.dateToTime) {
        const combinedDate = this.combineDateTime(this.filters.dateToDate, this.filters.dateToTime)
        if (combinedDate) {
          this.filters.dateTo = combinedDate
          this.applyFilters()
        }
      }
    },
    removeFilter(key) {
      this.filters[key] = ''
      this.applyFilters()
    },
  },
}
</script>

<style lang="scss" scoped>
.filter-container {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
}

.agent-selection-area {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  padding-left: 8px;
  min-height: 40px;
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

  &:first-child {
    margin-left: 0;
  }

  &:hover {
    z-index: 10;
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

.selected-agent {
  border: 3px solid #e91e63 !important;
  z-index: 5;
  transform: scale(1.05);
  box-shadow: 0 4px 12px #e91e63;

  &::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background-color: var(--q-color-primary);
    border-radius: 50%;
    border: 2px solid #ffffff;
  }
}

.more-avatars-indicator {
  background-color: #f5f5f5 !important;
  color: #666 !important;
  margin-left: -8px;
  border: 1px solid #000000;
  transition: all 0.3s ease;
  z-index: 1;

  &.black-border {
    border: 3px solid #000000 !important;
  }
}

/* Search input styling */
.search-input-container {
  flex-grow: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-input {
  .q-field__append {
    padding-right: 0;
  }

  &.primary-border {
    .q-field__control {
      border-color: var(--q-color-primary) !important;
      border-width: 2px !important;
    }

    &.q-field--focused .q-field__control {
      border-color: var(--q-color-primary) !important;
      box-shadow: 0 0 0 1px rgba(var(--q-color-primary-rgb), 0.2) !important;
    }
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

/* Responsive design improvements */
@media (max-width: 1024px) {
  .filter-container {
    padding: 16px;
  }

  .row.q-col-gutter-md {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px;
  }

  .filter-group-left {
    flex-wrap: wrap;
    width: 100%;
    gap: 12px;
  }

  .col-auto {
    width: auto;
    margin-bottom: 8px;
  }

  .date-filter-group {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }

  .q-input,
  .q-select {
    width: 100% !important;
    min-width: 200px;
  }

  .search-input-container {
    width: 100% !important;
    min-width: unset !important;
    max-width: unset !important;
  }

  .agent-selection-area {
    justify-content: center;
    padding: 8px 0;
  }
}

@media (min-width: 1025px) {
  .filter-group-left {
    flex-grow: 1;
    min-width: 60%;
    align-items: center;
  }

  .search-input-container {
    flex-grow: 1;
    min-width: 30%;
    max-width: 400px;
  }

  .date-filter-group {
    align-items: center;
  }
}

/* Additional improvements */
.q-select,
.q-input {
  .q-field__label {
    font-weight: 500;
  }

  &.q-field--outlined {
    .q-field__control {
      border-radius: 8px;
    }
  }
}

.date-filter-group {
  .q-input {
    .q-field__append .q-icon {
      color: #666;
      transition: color 0.2s ease;

      &:hover {
        color: var(--q-color-primary);
      }
    }
  }
}

/* Agent Loading State Styles */
.agent-selection-area.loading-state {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.agent-skeleton {
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.loading-text {
  font-size: 11px;
  color: #999;
  font-style: italic;
  margin-left: 8px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
