<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-pa-md">
        <!-- Filtre bölümü için component -->
        <FilterComponent @filter-changed="filterChanged" />

        <!-- Randevu listesi için component-->
        <AppointmentList
          :appointments="filteredAppointments"
          :loading="loading"
          :filters="currentFilters"
          @appointment-saved="handleAppointmentSaved"
          @appointment-updated="handleAppointmentUpdated"
          @appointment-deleted="handleAppointmentDeleted"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import FilterComponent from 'components/FilterComponent.vue'
import AppointmentList from 'components/AppointmentList.vue'

export default defineComponent({
  name: 'MainLayout',

  components: {
    FilterComponent,
    AppointmentList,
  },

  data() {
    return {
      loading: false,
      appointments: [],
      currentFilters: {},
    }
  },

  computed: {
    filteredAppointments() {
      return this.appointments
    },
  },

  mounted() {
    this.init()
  },

  methods: {
    async init() {
      console.log('Uygulama başlatılıyor...')
    },

    handleAppointmentSaved(appointment) {
      const newAppointment = {
        ...appointment,
        id: this.appointments.length + 1,
      }
      this.appointments.push(newAppointment)
      console.log('Yeni randevu eklendi:', newAppointment)
    },

    handleAppointmentUpdated(updatedAppointment) {
      const index = this.appointments.findIndex((apt) => apt.id === updatedAppointment.id)
      if (index !== -1) {
        this.appointments.splice(index, 1, updatedAppointment)
        console.log('Randevu güncellendi:', updatedAppointment)
      }
    },

    handleAppointmentDeleted(appointmentId) {
      const index = this.appointments.findIndex((apt) => apt.id === appointmentId)
      if (index !== -1) {
        this.appointments.splice(index, 1)
        console.log('Randevu silindi:', appointmentId)
      }
    },
    filterChanged(processedFilters) {
      // Filtre değerlerini state'e kaydet
      this.currentFilters = processedFilters
    },
  },
})
</script>
