<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-pa-md">
        <FilterComponent @filter-changed="filterChanged" />
        <!-- Filter Section Component -->

        <!-- Appoinment List Component-->
        <AppointmentList :filters="currentFilters" />
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
      currentFilters: {},
    }
  },
  methods: {
    // Keep data sent that the filter component (To filter appointment records in the Appointment List component)
    filterChanged(processedFilters) {
      this.currentFilters = processedFilters
    },
  },
})
</script>
