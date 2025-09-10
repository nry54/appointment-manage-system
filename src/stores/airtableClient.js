import axios from 'axios'
import { reactive } from 'vue'

// Shared reactive store for agents
const agentStore = reactive({
  agentDetails: {}, // Cache for individual agent details by ID
  allAgents: {},
})

// Airtable Info
const AIRTABLE_BASE_ID = 'appkTtnhXACqj0kag'

// API anahtarınızı güvenli bir yerde saklayın (örn: .env dosyası)
const AIRTABLE_API_KEY = process.env.VUE_APP_API_KEY

// Temel Axios İstemcisi
const airtableClient = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    // 'Content-Type': 'application/json', // Genellikle JSON kullanılır
  },
})

export function useAirtableService() {
  // --- Endpoint Fonksiyonları ---

  /**
   * Fetch all agents from API
   * @returns {Promise<Array>} Array of agent records
   */
  const getAllAgents = async (params = {}) => {
    try {
      const response = await airtableClient.get(`/agents`, { params })
      return response.data.records
    } catch (error) {
      console.error(
        'Airtable listRecords hatası:',
        error.response ? error.response.data : error.message,
      )
      throw error // Hatayı bileşenlere iletmek için throw edin
    }
  }

  const getAgentsByIds = async (agentIds) => {
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return {}
    }

    const results = {}
    const uniqueIds = [...new Set(agentIds.filter(Boolean))]

    // Use Promise.all for concurrent fetching
    await Promise.all(
      uniqueIds.map(async (agentId) => {
        const agentDetails = await getAgentById(agentId)
        if (agentDetails) {
          results[agentId] = agentDetails
        }
      }),
    )

    return results
  }

  const getAgentById = async (agentId) => {
    if (!agentId) return null

    // Return cached data if available
    if (agentStore.agentDetails[agentId]) {
      return agentStore.agentDetails[agentId]
    }

    try {
      const response = await airtableClient.get(`/agents/${agentId}`)

      agentStore.agentDetails[agentId] = response.data.fields
      return response.data.fields
    } catch (error) {
      console.error(
        'Airtable listRecords hatası:',
        error.response ? error.response.data : error.message,
      )
      throw error // Hatayı bileşenlere iletmek için throw edin
    }
  }

  const contactList = async (params = {}) => {
    try {
      const response = await airtableClient.get('/contacts', { params })
      return response.data.records
    } catch (error) {
      console.error(
        'Airtable contacts hatası:',
        error.response ? error.response.data : error.message,
      )
      throw error // Hatayı bileşenlere iletmek için throw edin
    }
  }
  /**
   * Tablodaki tüm kayıtları listeler.
   * @param {object} [params] - Airtable API'ye gönderilecek query parametreleri (örn: { view: 'Grid view', maxRecords: 10 })
   * @returns {Promise<Array>} - Kayıtların listesini içeren bir Promise.
   */
  const appointmentList = async (params = {}) => {
    try {
      const response = await airtableClient.get('/appointments', { params })
      return response.data.records
    } catch (error) {
      console.error(
        'Airtable appointments hatası:',
        error.response ? error.response.data : error.message,
      )
      throw error // Hatayı bileşenlere iletmek için throw edin
    }
  }

  /**
   * Yeni bir kayıt oluşturur.
   * @param {object} recordData - Oluşturulacak kaydın verileri. Airtable'daki alan isimleriyle eşleşmeli.
   * @returns {Promise<object>} - Oluşturulan kaydın verilerini içeren bir Promise.
   */
  const createRecord = async (recordData) => {
    try {
      const response = await airtableClient.post('', {
        fields: recordData,
      })
      return response.data // Yeni oluşturulan kaydın tüm bilgisi
    } catch (error) {
      console.error(
        'Airtable createRecord hatası:',
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  }

  /**
   * Belirli bir kaydı günceller.
   * @param {string} recordId - Güncellenecek kaydın ID'si.
   * @param {object} recordData - Güncellenecek alanlar ve yeni değerleri.
   * @returns {Promise<object>} - Güncellenen kaydın verilerini içeren bir Promise.
   */
  const updateRecord = async (recordId, recordData) => {
    try {
      const response = await airtableClient.patch(`/${recordId}`, {
        fields: recordData,
      })
      return response.data
    } catch (error) {
      console.error(
        `Airtable updateRecord (ID: ${recordId}) hatası:`,
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  }

  /**
   * Belirli bir kaydı siler.
   * @param {string} recordId - Silinecek kaydın ID'si.
   * @returns {Promise<object>} - Silme işleminin sonucunu içeren bir Promise.
   */
  const deleteRecord = async (recordId) => {
    try {
      const response = await airtableClient.delete(`/${recordId}`)
      return response.data
    } catch (error) {
      console.error(
        `Airtable deleteRecord (ID: ${recordId}) hatası:`,
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  }

  /**
   * Get agent color from agent data
   * @param {Object} agent - Agent object
   * @param {number} fallbackIndex - Fallback color index for default colors
   * @returns {string} Color hex code
   */
  const getAgentColor = (agent, fallbackIndex = 0) => {
    if (agent) {
      const agentData = agent.fields || agent

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
    }
  }

  return {
    agentDetails: agentStore.agentDetails,

    getAllAgents,
    getAgentsByIds,
    getAgentById,
    getAgentColor,

    appointmentList,
    createRecord,
    updateRecord,
    deleteRecord,

    contactList,
  }
}
