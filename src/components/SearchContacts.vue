<template>
  <q-input v-model="selectedCustomer" filled type="search">
    <template v-slot:prepend>
      <q-icon name="search" />
    </template>
  </q-input>

  <!--
  <q-select
    filled
    v-model="selectedCustomer"
    :options="filteredCustomers"
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    label="Search"
    @filter="filterCustomers"
    option-value="id"
    option-label="fullName"
    emit-value
    map-options
    hide-dropdown-icon
    dense
  >
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
    <template v-slot:append>
      <q-icon name="search" />
    </template>
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-avatar icon="person" color="grey-2" text-color="black" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.fullName }}</q-item-label>
          <q-item-label caption>{{ scope.opt.email }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select> -->
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SearchContacts',
  data: function () {
    return {
      selectedCustomer: null,
      filteredCustomers: [],
    }
  },
  methods: {
    async onSearch() {},
    filterCustomers() {},
  },
})
</script>
