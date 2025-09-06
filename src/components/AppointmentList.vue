<template>
  <div class="appointment-list-container">
    <!-- Header Section -->
    <div class="header-section">
      <div class="appointment-count">
        <span class="count-text">{{ appointments.length }} Randevu Bulundu</span>
      </div>
      <div class="create-button">
        <q-btn
          push
          no-caps
          color="pink"
          icon="add"
          label="Create Appointment"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner size="40px" color="primary" />
      <div class="loading-text">Randevular yükleniyor...</div>
    </div>

    <!-- Appointment Cards -->
    <div v-else class="appointment-cards">
      <div
        v-for="appointment in paginatedAppointments"
        :key="appointment.id"
        class="appointment-card"
      >
        <!-- Client Information Section -->
        <div class="client-section">
          <div class="client-icons">
            <q-icon name="person" class="client-icon" />
            <q-icon name="email" class="client-icon" />
            <q-icon name="phone" class="client-icon" />
          </div>
          <div class="client-details">
            <div class="client-name">{{ appointment.fields.contact_name[0] }}</div>
            <div class="client-email">
              {{ appointment.fields.contact_email[0] || '-' }}
            </div>
            <div class="client-phone">
              {{ appointment.fields.contact_phone[0] || '-' }}
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
          <div class="status-pill-container">
            <div class="status-pill" :class="getStatusPillClass(appointment)">
              <div class="status-indicator">
                <div class="status-text">
                  {{ getStatusText(appointment) }}
                </div>
                <div
                  v-if="!(appointment.fields.is_cancelled || appointment.fields.is_completed)"
                  class="time-remaining"
                >
                  {{ getTimeRemaining(appointment.fields.appointment_date) }}
                </div>
              </div>
              <div class="date-section">
                <q-icon name="schedule" class="clock-icon" />
                <span class="appointment-date-text">{{
                  formatDate(appointment.fields.appointment_date)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Staff Section -->
        <div class="staff-section">
          <!--
          <div class="staff-avatars">
            <div
              v-for="(staff, index) in getStaffMembers(appointment)"
              :key="index"
              class="staff-avatar"
              :style="{ backgroundColor: getStaffColor(index) }"
            >
              {{ staff.initials }}
            </div>
            <div v-if="getAdditionalStaffCount(appointment) > 0" class="additional-staff">
              +{{ getAdditionalStaffCount(appointment) }}
            </div>
          </div>
          -->
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-section">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="5"
        direction-links
        boundary-links
        color="primary"
        @update:model-value="onPageChange"
      />
    </div>

    <!-- Randevu Ekleme/Düzenleme Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section>
          <div class="text-h6">
            <q-icon name="event" class="q-mr-sm" />
            {{ editingAppointment ? 'Randevu Düzenle' : 'Yeni Randevu' }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveAppointment" class="q-gutter-md">
            <div class="row q-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="appointmentForm.patientName"
                  label="Hasta Adı"
                  :rules="[(val) => !!val || 'Hasta adı gerekli']"
                  outlined
                  dense
                >
                  <template v-slot:prepend>
                    <q-icon name="person" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="appointmentForm.doctorName"
                  label="Doktor Adı"
                  :rules="[(val) => !!val || 'Doktor adı gerekli']"
                  outlined
                  dense
                >
                  <template v-slot:prepend>
                    <q-icon name="medical_services" />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="appointmentForm.date"
                  label="Tarih"
                  type="date"
                  :rules="[(val) => !!val || 'Tarih gerekli']"
                  outlined
                  dense
                >
                  <template v-slot:prepend>
                    <q-icon name="event" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="appointmentForm.time"
                  label="Saat"
                  type="time"
                  :rules="[(val) => !!val || 'Saat gerekli']"
                  outlined
                  dense
                >
                  <template v-slot:prepend>
                    <q-icon name="schedule" />
                  </template>
                </q-input>
              </div>
            </div>

            <q-input
              v-model="appointmentForm.notes"
              label="Notlar"
              type="textarea"
              rows="3"
              outlined
              dense
            >
              <template v-slot:prepend>
                <q-icon name="notes" />
              </template>
            </q-input>

            <q-select
              v-model="appointmentForm.status"
              :options="statusOptions"
              label="Durum"
              emit-value
              map-options
              outlined
              dense
            >
              <template v-slot:prepend>
                <q-icon name="flag" />
              </template>
            </q-select>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="İptal" @click="cancelEdit" />
          <q-btn
            color="primary"
            :label="editingAppointment ? 'Güncelle' : 'Kaydet'"
            @click="saveAppointment"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { DEFAULT_PAGINATION, STATUS } from '../constants'

export default defineComponent({
  name: 'AppointmentList',

  props: {
    appointments: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    filters: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: [
    'appointment-listed',
    'appointment-saved',
    'appointment-deleted',
    'appointment-updated',
    'updated-filter',
  ],
  data: function () {
    return {
      apiUrl: process.env.VUE_APP_API_BASE_URL || '',
      baseId: process.env.VUE_APP_API_BASE_ID || '',
      appoinmentTableId: process.env.VUE_APP_API_APPOINMENT_TABLE_ID || '',
      apiKey: process.env.VUE_APP_API_KEY || '',
      paginatedAppointments: [],
      // Pagination properties using DEFAULT_PAGINATION constants
      currentPage: DEFAULT_PAGINATION.page,
      rowsPerPage: DEFAULT_PAGINATION.rowsPerPage,
      sortBy: DEFAULT_PAGINATION.sortBy,
      descending: DEFAULT_PAGINATION.descending,

      showAddDialog: false,
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.paginatedAppointments.length / this.rowsPerPage)
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.rowsPerPage
      const end = start + this.rowsPerPage
      return this.paginatedAppointments.slice(start, end)
    },
  },

  watch: {
    filters: {
      handler() {
        this.init()
      },
      deep: true,
    },
  },

  mounted() {
    this.init()
  },
  methods: {
    async init() {
      // Randevuların listelendiği endpointi axios ile çağır
      try {
        const axios = (await import('axios')).default

        if (!this.apiUrl || !this.baseId || !this.appoinmentTableId || !this.apiKey) {
          console.error(
            'API URL, Base ID, Appointment Table ID veya API KEY eksik. Lütfen .env dosyanızı kontrol edin.',
          )
          return
        }
        // Gerekirse endpoint'i logla
        const endpoint = `${this.apiUrl}/${this.baseId}/${this.appoinmentTableId}`

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
        // filters.status varsa, status'a göre filtrele
        let filteredRecords = records
        console.log(this.filters)
        filteredRecords = this.filterRecords(records, this.filters)
        this.paginatedAppointments = filteredRecords
      } catch (error) {
        // Hata durumunda konsola yazdır
        console.error('Randevular alınırken hata oluştu:', error)
      }
    },
    onPageChange(page) {
      this.currentPage = page
    },
    getStatusText(appointment) {
      // Eğer iptal edilmişse
      if (appointment.fields.is_cancelled) {
        return STATUS.find((s) => s.value === 'CANCELLED')?.label || 'Cancelled'
      }

      // Eğer tamamlanmışsa
      if (appointment.fields.is_completed) {
        return STATUS.find((s) => s.value === 'COMPLETED')?.label || 'Completed'
      }

      // UPCOMING durumunda tarihe göre dinamik metin
      if (appointment.fields.appointment_date) {
        const timeRemaining = this.getTimeRemaining(appointment.fields.appointment_date)

        if (timeRemaining === 'Past') return 'Overdue'
        if (timeRemaining === 'Today') return 'Today'
        if (timeRemaining === '1 day') return 'Tomorrow'
        if (timeRemaining.includes('days')) return 'Upcoming'
        if (timeRemaining.includes('weeks')) return 'Upcoming'
        if (timeRemaining.includes('months')) return 'Upcoming'
      }

      // Varsayılan olarak UPCOMING
      return STATUS.find((s) => s.value === 'UPCOMING')?.label || 'Upcoming'
    },
    getStatusPillClass(appointment) {
      // Eğer iptal edilmişse
      if (appointment.fields.is_cancelled) {
        return 'status-pill-canceled'
      }

      // Eğer tamamlanmışsa
      if (appointment.fields.is_completed) {
        return 'status-pill-completed'
      }

      // UPCOMING durumunda tarihe göre dinamik sınıf
      if (appointment.fields.appointment_date) {
        const timeRemaining = this.getTimeRemaining(appointment.fields.appointment_date)

        if (timeRemaining === 'Past') return 'status-pill-overdue'
        if (timeRemaining === 'Today') return 'status-pill-today'
        if (timeRemaining === '1 day') return 'status-pill-tomorrow'
        if (timeRemaining.includes('days')) return 'status-pill-upcoming'
        if (timeRemaining.includes('weeks')) return 'status-pill-upcoming'
        if (timeRemaining.includes('months')) return 'status-pill-upcoming'
      }

      // Varsayılan olarak UPCOMING
      return 'status-pill-upcoming'
    },
    getTimeRemaining(appointmentDate) {
      if (!appointmentDate) return ''
      // Tarih fonksiyonlarının kalan (difference) fonksiyonunu kullanalım
      const now = new Date()
      const appointment = new Date(appointmentDate)

      // Sadece tarih kısmını karşılaştırmak için saatleri sıfırla
      now.setHours(0, 0, 0, 0)
      appointment.setHours(0, 0, 0, 0)

      // Kalan gün sayısını hesapla
      const diffTime = appointment.getTime() - now.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return 'Past'
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return '1 day'
      if (diffDays < 7) return `${diffDays} days`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`
      return `${Math.floor(diffDays / 30)} months`
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    },
    formatTime(timeString) {
      if (!timeString) return '-'
      // Eğer timeString sadece saat:dakika formatındaysa
      if (timeString.includes(':')) {
        return timeString
      }
      // Eğer tam datetime ise, sadece saat kısmını al
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    },
    filterRecords(records, filters) {
      // filters objesindeki filtrelere göre records listesini filtrele
      if (!filters || Object.keys(filters).length === 0) {
        return records
      }

      return records.filter((record) => {
        // Her bir filtre için kontrol et
        for (const key in filters) {
          const filterValue = filters[key]
          // Eğer filtre değeri boşsa veya null ise atla
          if (filterValue === null || filterValue === '' || filterValue === undefined) continue

          // Eğer filtrelenen alan "status" ise, özel bir kontrol uygula
          if (key === 'status') {
            // status değeri "upcoming", "completed", "cancelled" gibi olabilir
            if (filterValue === 'UPCOMING') {
              // Ne tamamlanmış ne de iptal edilmiş
              if (record.fields.is_completed || record.fields.is_cancelled) {
                return false
              }
            } else if (filterValue === 'COMPLETED') {
              if (!record.fields.is_completed) {
                return false
              }
            } else if (filterValue === 'CANCELLED') {
              if (!record.fields.is_cancelled) {
                return false
              }
            }
            // Diğer status değerleri için ek kontroller eklenebilir
            continue
          }
        }
        return true
      })
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
  font-size: 18px;
  font-weight: 600;
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
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr;
  gap: 20px;
  align-items: center;
  transition: all 0.2s ease;
}

.appointment-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Client Section */
.client-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.client-icons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.client-icon {
  font-size: 16px;
  color: #6c757d;
}

.client-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-name {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
  line-height: 1.4;
}

.client-email,
.client-phone {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.3;
}

/* Address Section */
.address-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.address-icon {
  font-size: 18px;
  color: #6c757d;
}

.address-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
}

.status-pill-container {
  width: 100%;
  max-width: 280px;
}

.status-pill {
  border-radius: 25px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  min-height: 50px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #e91e63, #f06292);
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
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
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-text {
  font-weight: 700;
  font-size: 12px;
  color: #ff9800;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-remaining {
  font-weight: 600;
  font-size: 11px;
  color: #333;
  line-height: 1.2;
  margin-top: 2px;
}

.date-section {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
}

.clock-icon {
  font-size: 16px;
  color: white;
}

.appointment-date-text {
  font-size: 14px;
  font-weight: 600;
  color: white;
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

.staff-avatars {
  display: flex;
  align-items: center;
  gap: 8px;
}

.staff-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.additional-staff {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 11px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 20px 0;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .appointment-card {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 16px;
  }

  .staff-section {
    grid-column: 1 / -1;
    justify-content: flex-start;
    margin-top: 12px;
  }
}

@media (max-width: 768px) {
  .appointment-card {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .client-section,
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

  .staff-section {
    justify-content: flex-start;
    margin-top: 0;
  }
}

@media (max-width: 480px) {
  .status-pill {
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
  }

  .status-indicator {
    min-width: auto;
    width: 100%;
  }

  .date-section {
    justify-content: center;
  }
}

/* Dialog Styles */
.q-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
</style>
