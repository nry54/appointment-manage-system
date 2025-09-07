<template>
  <q-page class="flex flex-center q-pa-md">
    <q-dialog v-model="showForm" persistent>
      <q-card class="appointment-form-card">
        <q-card-section class="flex flex-center q-py-md">
          <q-icon name="event_note" size="xl" color="grey-8" />
          <div class="text-h6 q-ml-sm text-grey-8">
            {{ operation === 'ADD' ? 'Create an Appointment' : 'Edit the Appointment' }}
          </div>
        </q-card-section>

        <q-card-section class="q-py-md q-px-lg q-gutter-y-lg">
          <q-select
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
              <q-icon
                name="search"
                class="bg-black text-white q-pa-sm"
                style="border-radius: 4px"
              />
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
            filled
            dense
            v-model="formData.address"
            label="Address"
            placeholder="Enter appointment address"
          >
            <template v-slot:append>
              <q-icon name="home" />
            </template>
          </q-input>

          <q-select
            filled
            dense
            v-model="formData.agent"
            :options="agentOptions"
            label="Agent"
            emit-value
            map-options
          />

          <q-input
            filled
            dense
            v-model="formData.appointmentDate"
            label="Appointment Date"
            mask="####-##-## ##:##"
            :rules="['date']"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="formData.appointmentDate" mask="YYYY-MM-DD HH:mm">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="formData.appointmentDate" mask="YYYY-MM-DD HH:mm" format24h>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="q-pt-none q-pb-md q-px-lg">
          <q-btn flat label="Cancel" color="dark" @click="showForm = false" />
          <q-btn label="Create" color="pink-6" @click="createAppointment" />
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
  data() {
    return {
      showForm: true,
      formData: {
        selectedCustomer: null,
        address: '',
        agent: null,
        appointmentDate: '',
      },
      // bu bilgileri ortak yerden çekmeyi planlıyorum
      apiUrl: process.env.VUE_APP_API_BASE_URL || '',
      baseId: process.env.VUE_APP_API_BASE_ID || '',
      contactTableId: process.env.VUE_APP_API_CONTACT_TABLE_ID || '',
      apiKey: process.env.VUE_APP_API_KEY || '',

      contacts: [],
      contactList: [],
      filteredContacts: [],
      agentOptions: [
        { label: 'Agent John Doe', value: 'agent-john' },
        { label: 'Agent Jane Smith', value: 'agent-jane' },
        { label: 'Agent Peter Jones', value: 'agent-peter' },
      ],
    }
  },
  methods: {
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
      this.$q.notify({
        type: 'positive',
        message: 'Randevu başarıyla oluşturuldu!',
      })
      this.showForm = false
      // Formu sıfırlamak isterseniz:
      // this.formData = { selectedCustomer: null, address: '', agent: null, appointmentDate: date.formatDate(Date.now(), 'YYYY-MM-DD HH:mm') };
    },
  },
  mounted() {
    this.fetchAllContacts()
  },
}
</script>

<style scoped>
.appointment-form-card {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.q-card-section.q-py-md,
.q-card-actions.q-py-md {
  padding-left: 24px;
  padding-right: 24px;
}
.q-card-section.q-px-lg {
  padding-left: 32px;
  padding-right: 32px;
}
/* Contact Section */
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
</style>
