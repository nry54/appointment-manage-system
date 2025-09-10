<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pa-md">
      <!-- Main Filter Container using Quasar Grid -->
      <div class="row q-col-gutter-md items-center">
        <!-- Left Section: Agents, Status, Date Filters -->
        <div class="col-12 col-md-9">
          <div class="row q-col-gutter-sm items-center">
            <!-- Agent Selection -->
            <div class="col-12 col-sm-auto">
              <!-- Agent Loading State -->
              <div v-if="agentsLoading" class="row q-gutter-xs items-center">
                <q-skeleton v-for="n in 5" :key="n" type="QAvatar" size="40px" class="col-auto" />
                <q-skeleton type="text" width="80px" class="col-auto" />
              </div>

              <!-- Agent Avatars -->
              <div
                v-else-if="allAgents && allAgents.length > 0"
                class="row q-gutter-xs items-center no-wrap"
              >
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
                  <q-badge
                    v-if="isSelected(agent.id)"
                    color="primary"
                    rounded
                    class="absolute-top-right"
                    style="top: -4px; right: -4px"
                  >
                    <q-icon name="check" size="10px" />
                  </q-badge>
                </q-avatar>

                <q-avatar
                  v-if="allAgents.length > 5"
                  color="grey-4"
                  text-color="grey-8"
                  size="40px"
                  class="cursor-pointer agent-avatar"
                  @click="agentSelectDialog = true"
                >
                  <span class="text-caption text-weight-medium">+{{ allAgents.length - 5 }}</span>
                </q-avatar>
              </div>
            </div>

            <!-- Status Filter -->
            <div class="col-12 col-sm-auto">
              <q-select
                v-model="filters.status"
                :options="statusOptions"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="applyFilters"
                style="min-width: 120px"
              />
            </div>

            <!-- Date Range Filters -->
            <div class="col-12 col-sm-auto">
              <div class="row q-gutter-xs">
                <!-- From Date -->
                <div class="col-auto">
                  <q-input
                    :model-value="filters.dateFrom"
                    @update:model-value="(val) => (filters.dateFrom = val)"
                    label="From"
                    outlined
                    dense
                    readonly
                    class="cursor-pointer"
                    style="min-width: 160px"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer" color="primary">
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
                              <div class="text-h6 row items-center q-gutter-sm">
                                <q-icon name="event_note" size="sm" />
                                <span>Select Date & Time</span>
                              </div>
                            </q-card-section>
                            <q-card-section>
                              <div class="row q-gutter-md">
                                <div class="col-auto">
                                  <q-date
                                    v-model="filters.dateFromDate"
                                    mask="YYYY-MM-DD"
                                    color="primary"
                                    flat
                                    @update:model-value="updateDateFrom"
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
                                  />
                                </div>
                              </div>
                            </q-card-section>
                          </q-card>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>

                <!-- To Date -->
                <div class="col-auto">
                  <q-input
                    :model-value="filters.dateTo"
                    @update:model-value="(val) => (filters.dateTo = val)"
                    label="To"
                    outlined
                    dense
                    readonly
                    class="cursor-pointer"
                    style="min-width: 160px"
                  >
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer" color="primary">
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
                              <div class="text-h6 row items-center q-gutter-sm">
                                <q-icon name="event_note" size="sm" />
                                <span>Select Date & Time</span>
                              </div>
                            </q-card-section>
                            <q-card-section>
                              <div class="row q-gutter-md">
                                <div class="col-auto">
                                  <q-date
                                    v-model="filters.dateToDate"
                                    mask="YYYY-MM-DD"
                                    color="primary"
                                    flat
                                    @update:model-value="updateDateTo"
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
                                  />
                                </div>
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
          </div>
        </div>

        <!-- Right Section: Search -->
        <div class="col-12 col-md-3">
          <q-input
            v-model="filters.search"
            label="Search"
            outlined
            dense
            clearable
            debounce="300"
            @update:model-value="applyFilters"
            class="full-width"
          >
            <template v-slot:append>
              <div class="search-icon-container">
                <q-icon name="search" class="cursor-pointer" />
              </div>
            </template>
          </q-input>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { STATUS } from '../constants/index'
import { useAirtableStore } from '../stores/airtableClient.store.js' // New Pinia store

export default {
  name: 'FilterComponent',
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
      allAgents: [], // All agents variable

      agentSelectDialog: false, // Dialog for agent selection
      agentsLoading: false, // Loading state for agents
    }
  },
  computed: {
    // Get Status options from constants
    statusOptions() {
      return STATUS
    },
    airtableStore() {
      return useAirtableStore()
    },
  },

  mounted() {
    this.getAllAgents() // Load agents

    // Default status to ALL
    this.filters.status = (this.statusOptions.find((s) => s.value === 'ALL') || {}).value

    // Use nextTick to ensure Vue has processed the data changes
    this.$nextTick(() => {
      this.updateDateFrom()
      this.updateDateTo()
    })
  },

  methods: {
    async getAllAgents() {
      try {
        this.agentsLoading = true // Show the user a loading screen until the data fetch

        // Use the new Pinia store to fetch agents
        await this.airtableStore.fetchAllAgents()

        // Get agents from the store
        this.allAgents = this.airtableStore.getAllAgents
      } catch (error) {
        console.error('Error while getting agent list:', error)
      } finally {
        this.agentsLoading = false
      }
    },
    // Get agent name-surname first letter (To display within the avatar)
    agentAvatarLetters(agent) {
      let initials = ''
      const { agent_name, agent_surname } = agent.fields // destructuring assignment for agent name and surname
      if (agent_name) {
        initials += agent_name.charAt(0) //first letter
      }
      if (agent_surname) {
        initials += agent_surname.charAt(0) //first letter
      }
      return initials.toUpperCase() // first letters will be uppercase
    },

    // Select agent for filter - One or more
    selectAgent(agentId) {
      const index = this.filters.selectedAgents.indexOf(agentId) // check if agent is already selected or not selected

      if (index > -1) {
        this.filters.selectedAgents.splice(index, 1) // agent is selected, remove
      } else {
        this.filters.selectedAgents.push(agentId) // agent is not selected, add
      }

      this.applyFilters() // apply filters
    },

    // check if agent is selected
    isSelected(agentId) {
      return this.filters.selectedAgents.includes(agentId)
    },

    // Combine date and time
    combineDateTime(dateString, timeString) {
      if (!dateString || !timeString) return '' // If date or time is missing, return empty string
      try {
        const combinedDateTime = new Date(`${dateString}T${timeString}`)

        if (!combinedDateTime || isNaN(combinedDateTime.getTime())) {
          console.warn('Invalid date created:', dateString, timeString)
          return ''
        }

        const day = String(combinedDateTime.getDate()).padStart(2, '0') // Day - two digits
        const month = String(combinedDateTime.getMonth() + 1).padStart(2, '0') // Month - two digits
        const year = combinedDateTime.getFullYear()
        const hours = String(combinedDateTime.getHours()).padStart(2, '0') // Hours - two digits
        const minutes = String(combinedDateTime.getMinutes()).padStart(2, '0') // Minutes - two digits

        return `${day}-${month}-${year} ${hours}:${minutes}`
      } catch (error) {
        console.error('Error combining date and time:', error)
        return ''
      }
    },

    applyFilters() {
      // Keeps all filters on a new object without affecting existing filters
      const processedFilters = {
        ...this.filters,
        search: this.filters.search ? this.filters.search.toLowerCase().trim() : '', // Searches should be possible by address, customer name, email address, or phone number. - Case Insensitive
      }
      this.$emit('filter-changed', processedFilters) // The change is reported to the MainLayout page, which then transfers this information to the AppointmentList page.
    },

    // Apply filter with from date filter
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

    // Apply filter with from date filter
    updateDateTo() {
      if (this.filters.dateToDate && this.filters.dateToTime) {
        const combinedDate = this.combineDateTime(this.filters.dateToDate, this.filters.dateToTime)
        if (combinedDate) {
          this.filters.dateTo = combinedDate
          this.applyFilters()
        }
      }
    },
  },
}
</script>

<style lang="scss" scoped>
/* Minimal custom CSS - using mostly Quasar built-in classes */

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
  transform: scale(1.1);
  box-shadow: 0 0 0 2px rgba(var(--q-primary-rgb), 0.3);
}

.search-icon-container {
  // background-color: #e91e63;
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

/* Loading animation for skeletons */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Custom scrollbar for date/time popup on mobile */
@media (max-width: 768px) {
  .q-card {
    max-height: 80vh;
    overflow-y: auto;
  }
}
</style>
