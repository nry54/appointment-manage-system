<template>
  <q-card class="q-mb-md">
    <q-card-section>
      <div class="row q-gutter-md items-center">
        <!-- TODO: Kullanıcı(agent) filtresi olacak -->

        <!-- Durum Filtresi -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filters.status"
            :options="statusOptions"
            label="Durum"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="applyFilters"
          />
        </div>

        <!-- Tarih Filtresi - From -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-input filled dense v-model="filters.dateFrom" label="From" mask="DD-MM-YYYY HH:mm">
            <template v-slot:append>
              <div class="row q-gutter-xs">
                <!-- Tarih İkonu -->
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    ref="dateFromDatePopup"
                    anchor="bottom left"
                    self="top left"
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-card>
                      <q-card-section>
                        <q-date
                          v-model="filters.dateFrom"
                          mask="DD-MM-YYYY"
                          color="primary"
                          flat
                          bordered
                          @update:model-value="confirmDateFrom"
                        />
                      </q-card-section>
                    </q-card>
                  </q-popup-proxy>
                </q-icon>

                <!-- Saat İkonu -->
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy
                    ref="dateFromTimePopup"
                    anchor="bottom right"
                    self="top right"
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-card>
                      <q-card-section>
                        <q-time
                          v-model="filters.dateFrom"
                          mask="HH:mm"
                          format24h
                          color="primary"
                          flat
                          bordered
                          @update:model-value="confirmDateFrom"
                        />
                      </q-card-section>
                    </q-card>
                  </q-popup-proxy>
                </q-icon>
              </div>
            </template>
          </q-input>
        </div>

        <!-- Tarih Filtresi - To -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-input filled dense v-model="filters.dateTo" label="To" mask="DD-MM-YYYY HH:mm">
            <template v-slot:append>
              <div class="row q-gutter-xs">
                <!-- Tarih İkonu -->
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    ref="dateToDatePopup"
                    anchor="bottom left"
                    self="top left"
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-card>
                      <q-card-section>
                        <q-date
                          v-model="filters.dateToDate"
                          mask="DD-MM-YYYY"
                          color="primary"
                          flat
                          bordered
                          @update:model-value="confirmDateToDate"
                        />
                      </q-card-section>
                    </q-card>
                  </q-popup-proxy>
                </q-icon>

                <!-- Saat İkonu -->
                <q-icon name="schedule" class="cursor-pointer">
                  <q-popup-proxy
                    ref="dateToTimePopup"
                    anchor="bottom right"
                    self="top right"
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-card>
                      <q-card-section>
                        <q-time
                          v-model="filters.dateToTime"
                          mask="HH:mm"
                          format24h
                          color="primary"
                          flat
                          bordered
                          @update:model-value="confirmDateToTime"
                        />
                      </q-card-section>
                    </q-card>
                  </q-popup-proxy>
                </q-icon>
              </div>
            </template>
          </q-input>
        </div>

        <!-- Search Filtresi - Sağa dayalı -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-input
            v-model="filters.search"
            label="Search"
            outlined
            dense
            clearable
            debounce="300"
            @update:model-value="applyFilters"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { STATUS } from '../constants/index'

export default {
  name: 'FilterComponent',

  emits: ['filter-changed'],

  data() {
    return {
      filters: {
        dateFrom: '',
        dateFromDate: '',
        dateFromTime: '',
        dateTo: '',
        dateToDate: '',
        dateToTime: '',
        status: STATUS.ALL,
        search: '',
      },
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

  watch: {
    filters: {
      handler() {
        this.applyFilters()
      },
      deep: true,
    },
  },

  mounted() {
    // console.log(this.filters.status)
    //TODO: Varsayılan dateFrom ataması: bugünün tarihi saat 09:00

    // Varsayılan olarak status'u ALL olarak ayarlandı
    this.filters.status = (STATUS.find((s) => s.value === 'ALL') || {}).value

    // Varsayılan olarak dateFrom'u bugünün tarihi saat 09:00 olarak ayarla (mask: DD-MM-YYYY HH:mm)
    const now = new Date()
    now.setHours(9, 0, 0, 0)
    this.filters.dateFrom = now
      .toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-')
    this.filters.dateFromDate = now.toISOString().slice(0, 10) // YYYY-MM-DD
    this.filters.dateFromTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  },

  methods: {
    /**
     * Tarih ve saati birleştirerek DD-MM-YYYY HH:mm formatında string döndürür
     * @param {string} dateString - Tarih string'i (YYYY-MM-DD formatında)
     * @param {string} timeString - Saat string'i (HH:mm formatında)
     * @returns {string} - Birleştirilmiş tarih-saat string'i
     */
    combineDateTime(dateString, timeString) {
      // En az bir değer olmalı
      if (!dateString && !timeString) return ''

      try {
        let combinedDateTime = new Date(`${dateString}${timeString}`)

        // Geçersiz tarih kontrolü
        if (!combinedDateTime || isNaN(combinedDateTime.getTime())) {
          console.warn('Invalid date created:', dateString, timeString)
          return ''
        }

        // DD-MM-YYYY HH:mm formatında döndür (en-GB locale kullanarak)
        return combinedDateTime
          .toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          .replace(/\//g, '-')
      } catch (error) {
        console.error('Error combining date and time:', error)
        return ''
      }
    },

    applyFilters() {
      // Search filtresini case-insensitive yap
      const processedFilters = {
        ...this.filters,
        search: this.filters.search ? this.filters.search.toLowerCase().trim() : '',
      }

      this.$emit('filter-changed', processedFilters)
    },

    confirmTimeSelection(field) {
      // Popup'ı kapat
      this.$refs[field + 'TimePopup']?.hide()
      this.applyFilters()
    },

    confirmDateFrom() {
      // Popup'ı kapat
      this.$refs.dateFromDatePopup.hide()
      this.updateDateFrom()
    },

    updateDateFrom() {
      console.log('date', this.filters.dateFrom)

      // Tarih ve saati birleştir
      const combinedDate = this.combineDateTime(
        this.filters.dateFromDate,
        this.filters.dateFromTime,
      )

      if (combinedDate) {
        this.filters.dateFrom = combinedDate
        console.log('Date From updated to:', this.filters.dateFrom)
      }

      // this.applyFilters()
    },

    confirmDateToDate() {
      // Popup'ı kapat
      this.$refs.dateToDatePopup.hide()
      this.updateDateTo()
    },

    confirmDateToTime() {
      // Popup'ı kapat
      this.$refs.dateToTimePopup.hide()
      this.updateDateTo()
    },

    updateDateTo() {
      // Tarih ve saati birleştir
      const combinedDate = this.combineDateTime(this.filters.dateToDate, this.filters.dateToTime)

      if (combinedDate) {
        this.filters.dateTo = combinedDate
        console.log('Date To updated to:', this.filters.dateTo)
      }

      this.applyFilters()
    },

    setQuickFilter(value) {
      if (this.filters.quick === value) {
        this.filters.quick = ''
      } else {
        this.filters.quick = value

        // Hızlı filtreye göre tarih aralığını ayarla
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        switch (value) {
          case 'today': {
            this.filters.dateFrom = todayStr
            this.filters.dateTo = todayStr
            break
          }
          case 'week': {
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            this.filters.dateFrom = weekStart.toISOString().split('T')[0]
            this.filters.dateTo = weekEnd.toISOString().split('T')[0]
            break
          }
          case 'month': {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            this.filters.dateFrom = monthStart.toISOString().split('T')[0]
            this.filters.dateTo = monthEnd.toISOString().split('T')[0]
            break
          }
          case 'upcoming': {
            this.filters.dateFrom = todayStr
            this.filters.dateTo = ''
            break
          }
          case 'past': {
            this.filters.dateFrom = ''
            this.filters.dateTo = todayStr
            break
          }
        }
      }

      this.applyFilters()
    },

    clearFilters() {
      this.filters = {
        dateFrom: '',
        dateFromDate: '',
        dateFromTime: '',
        dateTo: '',
        dateToDate: '',
        dateToTime: '',
        status: STATUS.ALL,
        search: '',
        quick: '',
      }
      this.applyFilters()
    },

    removeFilter(key) {
      this.filters[key] = ''
      this.applyFilters()
    },
  },
}
</script>
