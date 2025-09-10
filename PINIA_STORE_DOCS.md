# Pinia Airtable Store Documentation

## Overview
The Airtable store has been redesigned using Pinia for better state management, type safety, and developer experience.

## Store Location
`/src/stores/airtableClient.store.js`

## Setup
Pinia is automatically initialized via the boot file: `/src/boot/pinia.js`

## How to Use

### Import the Store
```javascript
import { useAirtableStore } from '../stores/airtableClient.store.js'
```

### In Vue Components

#### Composition API (Recommended)
```javascript
<script setup>
import { useAirtableStore } from '../stores/airtableClient.store.js'
import { computed, onMounted } from 'vue'

const airtableStore = useAirtableStore()

// Reactive data
const agents = computed(() => airtableStore.getAllAgents)
const agentOptions = computed(() => airtableStore.getAgentOptions) 
const isLoading = computed(() => airtableStore.agentsLoading)

// Load data
onMounted(async () => {
  await airtableStore.fetchAllAgents()
})
</script>
```

#### Options API
```javascript
export default {
  computed: {
    airtableStore() {
      return useAirtableStore()
    },
    agents() {
      return this.airtableStore.getAllAgents
    },
    agentOptions() {
      return this.airtableStore.getAgentOptions
    }
  },
  
  async mounted() {
    await this.airtableStore.fetchAllAgents()
  }
}
```

## Available Methods

### Agents
- `fetchAllAgents()` - Load all agents
- `fetchAgentById(id)` - Load specific agent
- `fetchAgentsByIds([ids])` - Load multiple agents
- `getAllAgents` - Get all agents (getter)
- `getAgentOptions` - Get formatted agent options for dropdowns (getter)

### Contacts  
- `fetchAllContacts()` - Load all contacts
- `getAllContacts` - Get all contacts (getter)

### Appointments
- `fetchAllAppointments()` - Load all appointments  
- `getAllAppointments` - Get all appointments (getter)

### CRUD Operations
- `createRecord(tableName, data)` - Create new record
- `updateRecord(tableName, id, data)` - Update existing record
- `deleteRecord(tableName, id)` - Delete record

### Utilities
- `getAgentColor(agent, index)` - Get agent color
- `clearAgentsCache()` - Clear agents cache
- `clearAllCache()` - Clear all caches

## Loading States
- `agentsLoading` - Agents loading state
- `contactsLoading` - Contacts loading state  
- `appointmentsLoading` - Appointments loading state

## Error Handling
- `agentsError` - Agents error message
- `contactsError` - Contacts error message
- `appointmentsError` - Appointments error message

## Migration from Old Service

| Old Way | New Way |
|---------|---------|
| `useAirtableService()` | `useAirtableStore()` |
| `airtableService.getAllAgents()` | `airtableStore.fetchAllAgents()` |
| `airtableService.allAgents` | `airtableStore.getAllAgents` |
| `airtableService.agentDetails` | `airtableStore.agentDetails` |

## Benefits of Pinia Store

✅ **Centralized State** - All data in one place  
✅ **Reactive Updates** - Automatic UI updates when data changes  
✅ **Better DevTools** - Vue DevTools integration  
✅ **Type Safety** - Better TypeScript support  
✅ **Caching** - Automatic caching and state persistence  
✅ **Error Handling** - Built-in error states  
✅ **Loading States** - Built-in loading indicators