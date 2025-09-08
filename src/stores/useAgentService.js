import { reactive } from 'vue'

// Shared reactive store for agents
const agentStore = reactive({
  agents: [], // All agents list
  agentDetails: {}, // Cache for individual agent details by ID
  loading: false,
  error: null,
})

// API configuration
const getAPIConfig = () => {
  const apiUrl = process.env.VUE_APP_API_BASE_URL || ''
  const baseId = process.env.VUE_APP_API_BASE_ID || ''
  const agentTableId = process.env.VUE_APP_API_AGENT_TABLE_ID || ''
  const apiKey = process.env.VUE_APP_API_KEY || ''

  if (!apiUrl || !baseId || !agentTableId || !apiKey) {
    throw new Error('API configuration missing. Please check your .env file.')
  }

  return { apiUrl, baseId, agentTableId, apiKey }
}

// HTTP headers configuration
const getHeaders = (apiKey) => ({
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
})

export function useAgentService() {
  /**
   * Fetch all agents from API
   * @returns {Promise<Array>} Array of agent records
   */
  const getAllAgents = async () => {
    // Return cached data if available
    if (agentStore.agents.length > 0) {
      return agentStore.agents
    }

    try {
      agentStore.loading = true
      agentStore.error = null

      const axios = (await import('axios')).default
      const { apiUrl, baseId, agentTableId, apiKey } = getAPIConfig()

      const endpoint = `${apiUrl}/${baseId}/${agentTableId}`
      const config = getHeaders(apiKey)

      const response = await axios.get(endpoint, config)
      const { records } = response.data

      // Cache the agents
      agentStore.agents = records

      return records
    } catch (error) {
      agentStore.error = error.message || 'Error fetching agents'
      console.error('Error while getting agent list:', error)
      throw error
    } finally {
      agentStore.loading = false
    }
  }

  /**
   * Fetch agent by ID from API
   * @param {string} agentId - The agent ID to fetch
   * @returns {Promise<Object|null>} Agent details or null if not found
   */
  const getAgentById = async (agentId) => {
    if (!agentId) return null

    // Return cached data if available
    if (agentStore.agentDetails[agentId]) {
      return agentStore.agentDetails[agentId]
    }

    try {
      const axios = (await import('axios')).default
      const { apiUrl, baseId, agentTableId, apiKey } = getAPIConfig()

      const endpoint = `${apiUrl}/${baseId}/${agentTableId}/${agentId}`
      const config = getHeaders(apiKey)

      const response = await axios.get(endpoint, config)
      const agentData = response.data

      // Cache the agent details
      agentStore.agentDetails[agentId] = agentData.fields

      return agentData.fields
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error)
      return null
    }
  }

  /**
   * Fetch multiple agents by IDs
   * @param {Array<string>} agentIds - Array of agent IDs
   * @returns {Promise<Object>} Object with agentId as key and agent details as value
   */
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

  /**
   * Get agent initials from name and surname
   * @param {Object} agent - Agent object with fields
   * @returns {string} Agent initials in uppercase
   */
  const getAgentInitials = (agent) => {
    let initials = ''
    const { agent_name, agent_surname } = agent.fields || agent

    if (agent_name) {
      initials += agent_name.charAt(0)
    }
    if (agent_surname) {
      initials += agent_surname.charAt(0)
    }

    return initials.toUpperCase() || '?'
  }

  /**
   * Get agent initials from name and surname strings
   * @param {string} name - Agent name
   * @param {string} surname - Agent surname
   * @returns {string} Agent initials in uppercase
   */
  const getInitialsFromStrings = (name, surname) => {
    let initials = ''

    if (name && name.trim()) {
      initials += name.trim().charAt(0)
    }
    if (surname && surname.trim()) {
      initials += surname.trim().charAt(0)
    }

    return initials.toUpperCase() || '?'
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

  /**
   * Clear agent cache
   */
  const clearCache = () => {
    agentStore.agents = []
    agentStore.agentDetails = {}
    agentStore.error = null
  }

  /**
   * Refresh agents data
   */
  const refreshAgents = async () => {
    clearCache()
    return await getAllAgents()
  }

  return {
    // Direct access to reactive store (no ref wrappers)
    agents: agentStore.agents,
    agentDetails: agentStore.agentDetails,
    loading: agentStore.loading,
    error: agentStore.error,

    // Methods
    getAllAgents,
    getAgentById,
    getAgentsByIds,
    getAgentInitials,
    getInitialsFromStrings,
    getAgentColor,
    clearCache,
    refreshAgents,
  }
}
