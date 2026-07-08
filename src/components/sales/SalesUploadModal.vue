<template>
  <div class="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] dark:bg-[rgba(17,38,53,0.7)] backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black rounded-2xl shadow-2xl">

      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-900 sticky top-0 bg-white dark:bg-black rounded-t-2xl z-10">
        <h2 class="text-xl font-bold text-maurealty-blue dark:text-maurealty-light-blue">{{ editSale ? 'Edit Sale' : lockedListing ? 'Confirm Sale' : 'Upload Sale' }}</h2>
        <button type="button" class="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none cursor-pointer" @click="$emit('close')">✕</button>
      </div>

      <form class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="submit">

        <div class="sm:col-span-2 flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Property <span class="text-red-500">*</span></label>
          <input
            v-if="propertyLocked"
            type="text"
            :value="lockedTitle"
            readonly
            :class="[inputClass, 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed']"
          />
          <select v-else v-model="form.listing_ID" required :class="inputClass">
            <option :value="null" disabled>Select a property…</option>
            <option v-for="l in listings" :key="l.listing_id" :value="l.listing_id">{{ l.listing_title }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Client (Buyer) <span class="text-red-500">*</span></label>
          <input v-model.trim="form.client_name" type="text" required :class="inputClass" placeholder="Full name" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Reservation Date <span class="text-red-500">*</span></label>
          <input v-model="form.reservation_date" type="date" required :class="inputClass" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Total Contract Price (₱) <span class="text-red-500">*</span></label>
          <input v-model.number="form.total_contract_price" type="number" min="0" step="0.01" required :class="inputClass" placeholder="0.00" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Sale # (this agent)</label>
          <input v-model.number="form.agent_sale_seq" type="number" min="0" :class="inputClass" placeholder="e.g. 3" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Gross Commission (₱)</label>
          <input v-model.number="form.gross_commission" type="number" min="0" step="0.01" :class="inputClass" placeholder="0.00" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Net Commission (₱)</label>
          <input v-model.number="form.net_commission" type="number" min="0" step="0.01" :class="inputClass" placeholder="0.00" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Voucher Series</label>
          <input v-model.trim="form.voucher_series" type="text" :class="inputClass" placeholder="VCH-0001" />
        </div>

        <div class="sm:col-span-2 flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Remarks</label>
          <input v-model.trim="form.remarks" type="text" :class="inputClass" placeholder="e.g. third equity" />
        </div>

        <div v-if="selectedListing?.is_bulk" class="sm:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-5 mt-2">
          <h3 class="text-md font-bold text-maurealty-blue dark:text-maurealty-light-blue mb-4">Specific Unit Details (Bulk Sale)</h3>
          
          <div v-if="['House And Lot', 'House and Lot', 'house_and_lot'].includes(selectedListing.property_type)">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Lot Area (sqm)</label>
                <input type="number" step="any" v-model="form.unit_details.lot_area" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Floor Area (sqm)</label>
                <input type="number" step="any" v-model="form.unit_details.floor_area" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Rooms</label>
                <input type="number" v-model="form.unit_details.room_count" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Master BR Area</label>
                <input type="number" step="any" v-model="form.unit_details.master_bedroom_area" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Toilets</label>
                <input type="number" v-model="form.unit_details.toilet_count" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Helper Rms</label>
                <input type="number" v-model="form.unit_details.helper_rooms_count" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Driver Rms</label>
                <input type="number" v-model="form.unit_details.driver_rooms_count" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Carpark Spaces</label>
                <input type="number" v-model="form.unit_details.carpark_count" :class="inputClass">
              </div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mt-4">
              <p class="text-xs font-bold text-gray-500 mb-3 uppercase">Property Features</p>
              <div class="flex flex-wrap gap-x-6 gap-y-3">
                <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" v-model="form.unit_details.one_storey" class="w-4 h-4 accent-maurealty-blue rounded"><span class="text-sm text-gray-700 dark:text-gray-300">One Storey</span></label>
                <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" v-model="form.unit_details.two_storey" class="w-4 h-4 accent-maurealty-blue rounded"><span class="text-sm text-gray-700 dark:text-gray-300">Two Storey</span></label>
                <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" v-model="form.unit_details.with_loft" class="w-4 h-4 accent-maurealty-blue rounded"><span class="text-sm text-gray-700 dark:text-gray-300">With Loft</span></label>
                <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" v-model="form.unit_details.townhome" class="w-4 h-4 accent-maurealty-blue rounded"><span class="text-sm text-gray-700 dark:text-gray-300">Townhome</span></label>
                <label class="flex items-center gap-2 cursor-pointer group"><input type="checkbox" v-model="form.unit_details.rowhouse" class="w-4 h-4 accent-maurealty-blue rounded"><span class="text-sm text-gray-700 dark:text-gray-300">Rowhouse</span></label>
              </div>
            </div>
          </div>

          <div v-if="['Lot Only', 'Lot only', 'lot_only'].includes(selectedListing.property_type)">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Block No.</label>
                <input type="number" v-model="form.unit_details.block_number" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Lot No.</label>
                <input type="number" v-model="form.unit_details.lot_number" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Phase No.</label>
                <input type="number" v-model="form.unit_details.phase_number" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Area (sqm)</label>
                <input type="number" step="any" v-model="form.unit_details.area" :class="inputClass">
              </div>
              <div class="col-span-2 md:col-span-4 flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Lot Class</label>
                <select v-model="form.unit_details.class" :class="inputClass">
                  <option v-for="lotclass in lotClasses" :key="lotclass" :value="lotclass">{{ lotclass }}</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="['Condominium', 'condominium'].includes(selectedListing.property_type)">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Unit No.</label>
                <input type="number" v-model="form.unit_details.unit_number" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Bedroom Count</label>
                <input type="number" v-model="form.unit_details.bedroom_count" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Balcony Count</label>
                <input type="number" v-model="form.unit_details.balcony_count" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Carpark Count</label>
                <input type="number" v-model="form.unit_details.carpark_count" :class="inputClass">
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Master BR Area</label>
                <input type="number" step="any" v-model="form.unit_details.master_bedroom_area" :class="inputClass">
              </div>
              <div class="col-span-2 md:col-span-3 flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Condominium Class</label>
                <select v-model="form.unit_details.class" :class="inputClass">
                  <option v-for="condoclass in condoClasses" :key="condoclass" :value="condoclass">{{ condoclass }}</option>
                </select>
              </div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mt-4">
              <p class="text-xs font-bold text-gray-500 mb-3 uppercase">Condominium Type</p>
              <div class="flex flex-wrap gap-x-6 gap-y-3">
                <label v-for="cType in [
                  { label: 'Studio', field: 'is_studio_type' },
                  { label: 'BR Unit', field: 'is_BR_unit' },
                  { label: 'Villa', field: 'is_villa' },
                  { label: 'Garden Villa', field: 'is_garden_villa' },
                  { label: 'Penthouse', field: 'is_penthouse' }
                ]" :key="cType.field" class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" :checked="!!form.unit_details[cType.field]" @change="setExclusively(['is_studio_type', 'is_BR_unit', 'is_villa', 'is_garden_villa', 'is_penthouse'], cType.field)" class="w-4 h-4 accent-maurealty-blue">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ cType.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div v-if="['Memorial', 'memorial'].includes(selectedListing.property_type)">
            <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <p class="text-xs font-bold text-gray-500 mb-3 uppercase">Memorial Type</p>
              <div class="flex flex-wrap gap-x-6 gap-y-3">
                <label v-for="mType in [
                  { label: 'Urn', field: 'is_urn' },
                  { label: 'Vault', field: 'is_vault' },
                  { label: 'Garden', field: 'is_garden' },
                  { label: 'Estate', field: 'is_estate' },
                  { label: 'Family Estate', field: 'is_family_estate' },
                  { label: 'Pet Memorial', field: 'is_pet_memorial' }
                ]" :key="mType.field" class="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" :checked="!!form.unit_details[mType.field]" @change="setExclusively(['is_urn', 'is_vault', 'is_garden', 'is_estate', 'is_family_estate', 'is_pet_memorial'], mType.field)" class="w-4 h-4 accent-maurealty-blue">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ mType.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <p v-if="error" class="sm:col-span-2 text-sm text-red-500">{{ error }}</p>

        <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" class="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" @click="$emit('close')">Cancel</button>
          <button type="submit" :disabled="saving" class="px-5 py-2 rounded-lg bg-maurealty-blue text-white hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {{ saving ? 'Saving…' : 'Save Sale' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch} from 'vue'
import { salesService, type Sale } from '@/services/salesService'
import { listingsService } from '@/services/listingsServices'
import { authService } from '@/services/authService'
import type { Property } from '@/assets/classes/listings'

// Sold flow passes a fixed listing (id + title + price) so the property is
// locked and the contract price is prefilled. Omit it for the manual flow.
const props = defineProps<{
  lockedListing?: { id: number; title: string; price?: number }
  // When provided, the modal edits this existing sale instead of creating one.
  editSale?: Sale
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const lotClasses: string[] = ['Residential', 'Commercial', 'Industrial', 'Farm Lot'];
const condoClasses: string[] = ['Residential', 'Commercial', 'Industrial', 'Condotel', 'Timeshare'];

// Helper functions for dynamic fields
const setExclusively = (group: string[], selectedField: string) => {
  group.forEach(field => {
    form.unit_details[field] = (field === selectedField);
  });
};


// Property field is read-only in both the Sold flow and edit (the listing of an
// existing sale isn't changed here). Manual create uses the dropdown.
const lockedTitle = props.lockedListing?.title ?? props.editSale?.listing_title ?? ''
const propertyLocked = !!props.lockedListing || !!props.editSale

const inputClass =
  'py-2 px-3 rounded-md border border-gray-300 bg-white dark:bg-black dark:text-white focus:outline-2 focus:outline-maurealty-blue text-sm dark:[color-scheme:dark]'

const listings = ref<Property[]>([])
const saving = ref(false)
const error = ref('')

const e = props.editSale
const form = reactive({
  // Prefill from the edited sale, else the locked listing (Sold flow), else blank.
  listing_ID: e?.listing_ID ?? props.lockedListing?.id ?? null as number | null,
  client_name: e?.client_name ?? '',
  reservation_date: e?.reservation_date ?? '',
  total_contract_price: e?.total_contract_price ?? props.lockedListing?.price ?? null as number | null,
  agent_sale_seq: e?.agent_sale_seq ?? null as number | null,
  gross_commission: e?.gross_commission ?? null as number | null,
  net_commission: e?.net_commission ?? null as number | null,
  voucher_series: e?.voucher_series ?? '',
  remarks: e?.remarks ?? '',
  status: e?.status ?? 'pending approval',
  unit_details: e?.unit_details ?? {} as Record<string, any>
})

// computed property to dynamically check the selected listing
const selectedListing = computed(() => {
  return listings.value.find(l => l.listing_id === form.listing_ID)
})

// Mapping object to safely convert string property type into integer (for getListingID() )
const propertyTypesMap: Record<string, number> = {
  'House And Lot': 1, 'house_and_lot': 1,
  'Lot Only': 2, 'lot_only': 2,
  'Condominium': 3, 'condominium': 3,
  'Memorial': 4, 'memorial': 4
};
// 

const isAdmin = ref(false); // to see if user is an admin or not and modal changes depending on it.
const prefilledListingId = ref<number | null>(null);

watch([() => form.listing_ID, selectedListing], async ([newId, listing]) => {
  if (props.editSale || !newId || !listing) return;
  
  // Prevent infinite loops or overwriting manual user edits after initial load
  if (prefilledListingId.value === newId) return;

  // 1. Auto-fill the general listing price into the Contract Price field
  form.total_contract_price = listing.price || null;

  // 2. Fetch and map specific property details to pre-fill the unit_details
  try {
    const typeId = propertyTypesMap[listing.property_type] || 1;
    const fullData = await listingsService.getListingById(newId, typeId);
    
    if (fullData) {
      const subTableName = [null, 'house_and_lot', 'lot_only', 'condominium', 'memorial'][typeId];
      const subData = (subTableName && fullData[subTableName]) 
        ? (Array.isArray(fullData[subTableName]) ? fullData[subTableName][0] : fullData[subTableName]) 
        : fullData;
      
      if (subData) {
        // Safely map all possible unit details so they pre-fill accurately
        const mappedDetails: Record<string, any> = {
          lot_area: subData.lot_area ?? subData.area ?? null,
          floor_area: subData.floor_area ?? null,
          room_count: subData.rooms_count ?? subData.room_count ?? null,
          master_bedroom_area: subData.master_bedroom_area ?? null,
          toilet_count: subData.toilets_count ?? subData.toilet_count ?? null,
          helper_rooms_count: subData.helper_rooms_count ?? null,
          driver_rooms_count: subData.driver_rooms_count ?? null,
          carpark_count: subData.carpark_count ?? null,
          one_storey: subData['1_storey'] ?? subData.one_storey ?? false,
          two_storey: subData['2_storey'] ?? subData.two_storey ?? false,
          with_loft: subData.with_loft ?? false,
          townhome: subData.townhomes ?? subData.townhome ?? false,
          rowhouse: subData.rowhouse ?? false,
          
          block_number: subData.block_number ?? null,
          lot_number: subData.lot_number ?? null,
          phase_number: subData.phase_number ?? null,
          area: subData.area ?? subData.lot_area ?? null,
          
          unit_number: subData.unit_number ?? null,
          bedroom_count: subData.bedroom_count ?? null,
          balcony_count: subData.balcony_count ?? null,
          
          is_studio_type: subData.is_studio_type ?? false,
          is_BR_unit: subData.is_BR_unit ?? false,
          is_villa: subData.is_villa ?? false,
          is_garden_villa: subData.is_garden_villa ?? false,
          is_penthouse: subData.is_penthouse ?? false,
          
          is_urn: subData.is_urn ?? false,
          is_vault: subData.is_vault ?? false,
          is_garden: subData.is_garden ?? false,
          is_estate: subData.is_estate ?? false,
          is_family_estate: subData.is_family_estate ?? false,
          is_pet_memorial: subData.is_pet_memorial ?? false,
          class: subData.class ?? null
        };

        // Resolve relational foreign keys to plain strings for the dropdowns
        if (subData.lot_class_ID) {
          mappedDetails.class = lotClasses[subData.lot_class_ID - 1] || null;
        } else if (subData.condo_class_ID) {
          mappedDetails.class = condoClasses[subData.condo_class_ID - 1] || null;
        }

        // Reassign the mapped object to trigger Vue reactivity
        form.unit_details = { ...mappedDetails };
      }
    }
  } catch (error) {
    console.error("Failed to fetch full listing details for pre-fill:", error);
  }

  prefilledListingId.value = newId; 
}, { immediate: true });

onMounted(async () => {

  // Check admin status when object mounts
  const agent = await authService.getCurrentAgent();
  isAdmin.value = !!agent?.admin_access;

  // Locked/edit flows already have their property — no dropdown needed.
  if (propertyLocked) return
  try {
    listings.value = await listingsService.getListings(100)
  } catch (err) {
    console.error('Failed to load listings for sale form:', err)
    error.value = 'Could not load properties.'
  }
})

async function submit() {
  error.value = ''

  // Keys must match the DB column names exactly. Empty optional fields → null.
  const payload = {
    listing_ID: form.listing_ID,
    client_name: form.client_name,
    reservation_date: form.reservation_date,
    total_contract_price: form.total_contract_price,
    agent_sale_seq: form.agent_sale_seq,
    gross_commission: form.gross_commission,
    net_commission: form.net_commission,
    voucher_series: form.voucher_series || null,
    remarks: form.remarks || null,
    status: form.status,
    unit_details: selectedListing.value?.is_bulk ? form.unit_details: null
  }

  saving.value = true
  try {
    if (props.editSale) {
      // Edit: agent_ID (the seller) stays as-is — don't reassign on edit.
      await salesService.updateSale(props.editSale.sale_ID, payload)
    } else {
      // Create: the seller is the current agent.
      const agent = await authService.getCurrentAgent()
      if (!agent?.agent_ID) {
        error.value = 'No authenticated agent — please log in again.'
        return
      }
      await salesService.createSale({ agent_ID: agent.agent_ID, ...payload })

      // Auto-mark single listing as sold directly in the database
      if (selectedListing.value && !selectedListing.value.is_bulk && form.listing_ID) {
        try {
          await listingsService.updateListingStatus(form.listing_ID, 'sold')
        } catch (statusErr) {
          console.error('Failed to auto-update single listing status:', statusErr)
        }
      }
    }
    emit('saved')
  } catch (err: any) {
    console.error('Failed to save sale:', err)
    error.value = err?.message || 'Failed to save sale. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>
