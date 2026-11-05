<template>
  <!-- SALE DETAIL: opened from a row of the Sales Report. Moved here from SalesReport.vue unchanged. -->
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(10,61,98,0.7)] backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="w-full max-w-lg bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-600 shrink-0">
        <h2 class="text-xl font-bold text-maurealty-blue dark:text-white">Sale Details</h2>
        <button class="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none cursor-pointer" @click="$emit('close')">✕</button>
      </div>

      <div class="overflow-y-auto custom-scrollbar p-6">
        <!-- ORIGINAL SALE DETAILS -->
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt class="text-gray-500 dark:text-gray-400">Client</dt><dd class="font-medium text-maurealty-blue dark:text-white">{{ sale.client_name }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Developer</dt><dd class="font-medium dark:text-white">{{ sale.developer_name || '—' }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Project</dt><dd class="font-medium dark:text-white">{{ sale.listing_title }}</dd></div>
          <div v-if="isAdmin"><dt class="text-gray-500 dark:text-gray-400">Agent</dt><dd class="dark:text-white">{{ sale.agent_name || '—' }}</dd></div>
          <div v-if="isAdmin" class="col-span-1 sm:col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Upline</dt>
            <dd>
              <span v-if="uplineLoading" class="text-gray-400 dark:text-gray-600">Loading…</span>
              <span v-else-if="upline.length === 0" class="dark:text-white">—</span>
              <span v-else>
                <template v-for="(u, i) in upline" :key="u.agent_ID"
                  ><span class="font-medium dark:text-white">{{ u.first_name }} {{ u.last_name }}</span
                  ><span v-if="uplinePosition(u)" class="text-gray-500 dark:text-gray-400"> ({{ uplinePosition(u) }})</span
                  ><span v-if="i < upline.length - 1" class="text-gray-400 dark:text-gray-600"> → </span
                ></template>
              </span>
            </dd>
          </div>
          <div><dt class="text-gray-500 dark:text-gray-400">Reservation Date</dt><dd class="dark:text-white">{{ formatDate(sale.reservation_date) }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Contract Price</dt><dd class="dark:text-white">{{ formatPeso(sale.total_contract_price) }}</dd></div>
          <div v-if="sale.commissionable_amount != null"><dt class="text-gray-500 dark:text-gray-400">Commissionable Amount</dt><dd class="dark:text-white">{{ formatPeso(sale.commissionable_amount) }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Financing</dt><dd class="dark:text-white">{{ sale.financing || '—' }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Payment Scheme</dt><dd class="dark:text-white">{{ sale.payment_scheme === 'Deferred-Cash' ? 'Deferred Cash (12 monthly installments)' : (sale.payment_scheme || '—') }}</dd></div>
          <div v-if="sale.commission_rate != null"><dt class="text-gray-500 dark:text-gray-400">Commission Rate</dt><dd class="dark:text-white">{{ sale.commission_rate }}%</dd></div>
          <template v-if="sale.payment_scheme === 'DP'">
            <div><dt class="text-gray-500 dark:text-gray-400">DP ({{ sale.dp_rate }}%)</dt><dd class="dark:text-white">{{ formatPeso(sale.dp_amount ?? 0) }}</dd></div>
            <div><dt class="text-gray-500 dark:text-gray-400">Remaining Balance</dt><dd class="dark:text-white">{{ formatPeso(sale.remaining_balance ?? 0) }}</dd></div>
            <div class="col-span-1 sm:col-span-2">
              <dt class="text-gray-500 dark:text-gray-400">DP Divisions</dt>
              <dd class="dark:text-white">
                <span v-if="saleDivisions.length === 0">—</span>
                <ul v-else class="mt-1 flex flex-col gap-1">
                  <li v-for="(d, i) in saleDivisions" :key="i">
                    Division {{ i + 1 }}: {{ d.divisionRate }}% over {{ d.count }} {{ d.count === 1 ? d.unit.slice(0, -1) : d.unit }}
                    ({{ formatDate(d.startDate ?? '') }} – {{ formatDate(d.endDate ?? '') }})
                  </li>
                </ul>
              </dd>
            </div>
          </template>
          <div><dt class="text-gray-500 dark:text-gray-400">Sale</dt><dd class="dark:text-white">{{ sale.agent_sale_seq ?? '—' }}</dd></div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Status</dt>
            <dd>
              <span :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border', saleStatusClass(sale.status)]">
                {{ sale.status }}
              </span>
            </dd>
          </div>
          <div><dt class="text-gray-500 dark:text-gray-400">Gross Commission</dt><dd class="dark:text-white">{{ sale.gross_commission != null ? formatPeso(sale.gross_commission) : '—' }}</dd></div>
          <div><dt class="text-gray-500 dark:text-gray-400">Net Commission</dt><dd class="dark:text-white">{{ sale.net_commission != null ? formatPeso(sale.net_commission) : '—' }}</dd></div>
          <!-- Voucher series (the voucher/receipt number of the sale) is hidden for now. Not removed:
               sales.voucher_series still exists and is still searched and exported.
          <div><dt class="text-gray-500 dark:text-gray-400">Voucher</dt><dd class="dark:text-white">{{ sale.voucher_series || '—' }}</dd></div>
          -->
          <div class="col-span-1 sm:col-span-2"><dt class="text-gray-500 dark:text-gray-400">Remarks</dt><dd class="dark:text-white">{{ sale.remarks || '—' }}</dd></div>
          <div class="col-span-1 sm:col-span-2"><dt class="text-gray-500 dark:text-gray-400">Agent Incentive</dt><dd class="dark:text-white whitespace-pre-line">{{ sale.agent_incentive || '—' }}</dd></div>
          <div class="col-span-1 sm:col-span-2"><dt class="text-gray-500 dark:text-gray-400">Realty Incentive</dt><dd class="dark:text-white whitespace-pre-line">{{ sale.realty_incentive || '—' }}</dd></div>
        </dl>

        <!-- PROPERTY DETAILS SECTION -->
        <div class="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-3 mb-3">
            <h3 class="text-lg font-bold text-maurealty-blue dark:text-maurealty-light-blue leading-none">Property Details</h3>
            <span
              v-if="selectedPropertyType"
              :class="[
                'text-[10px] sm:text-xs font-light text-white px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-full tracking-wider shadow-md leading-none',
                propertyTypeColor(selectedPropertyType)
              ]"
            >
              {{ formattedPropertyType(selectedPropertyType) }}
            </span>
          </div>

          <div v-if="detailsLoading" class="text-gray-500 dark:text-gray-400 text-sm">Loading property details...</div>
          <div v-else-if="!selectedListingDetails" class="text-gray-500 dark:text-gray-400 text-sm">No additional property details available.</div>

          <dl v-else class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <!-- HOUSE AND LOT -->
            <template v-if="['House And Lot', 'House and Lot', 'house_and_lot'].includes(selectedPropertyType)">
              <div><dt class="text-gray-500 dark:text-gray-400">Block No.</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.block_number ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Lot No.</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.lot_number ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Phase No.</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.phase_number ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Lot Area</dt><dd class="font-medium dark:text-white">{{ formatArea(selectedListingDetails.area || selectedListingDetails.lot_area) }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Floor Area</dt><dd class="font-medium dark:text-white">{{ formatArea(selectedListingDetails.floor_area) }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Rooms</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.room_count ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Toilets</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.toilet_count ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Master BR Area</dt><dd class="font-medium dark:text-white">{{ formatArea(selectedListingDetails.master_bedroom_area) }}</dd></div>
              <div v-if="selectedListingDetails.helper_rooms_count >= 0"><dt class="text-gray-500 dark:text-gray-400">Helper Rooms</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.helper_rooms_count }}</dd></div>
              <div v-if="selectedListingDetails.driver_rooms_count >= 0"><dt class="text-gray-500 dark:text-gray-400">Driver Rooms</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.driver_rooms_count }}</dd></div>
              <div v-if="selectedListingDetails.carpark_count >= 0"><dt class="text-gray-500 dark:text-gray-400">Carpark</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.carpark_count }}</dd></div>
              <div class="col-span-1 sm:col-span-2"><dt class="text-gray-500 dark:text-gray-400">Features</dt><dd class="font-medium dark:text-white">{{ getHouseFeatures(selectedListingDetails) }}</dd></div>
            </template>

            <!-- LOT ONLY -->
            <template v-else-if="['Lot Only', 'Lot only', 'lot_only'].includes(selectedPropertyType)">
              <div><dt class="text-gray-500 dark:text-gray-400">Block No.</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.block_number ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Lot No.</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.lot_number ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Phase No.</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.phase_number ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Area</dt><dd class="font-medium dark:text-white">{{ formatArea(selectedListingDetails.area) }}</dd></div>
              <div class="col-span-1 sm:col-span-2"><dt class="text-gray-500 dark:text-gray-400">Class</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.class || '—' }}</dd></div>
            </template>

            <!-- CONDOMINIUM -->
            <template v-else-if="['Condominium', 'condominium'].includes(selectedPropertyType)">
              <div><dt class="text-gray-500 dark:text-gray-400">Unit No.</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.unit_number ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Floor</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.floor ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Bedrooms</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.bedroom_count ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Balconies</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.balcony_count ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Carpark</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.carpark_count ?? '—' }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Master BR Area</dt><dd class="font-medium dark:text-white">{{ formatArea(selectedListingDetails.master_bedroom_area) }}</dd></div>
              <div><dt class="text-gray-500 dark:text-gray-400">Class</dt><dd class="font-medium dark:text-white">{{ selectedListingDetails.class || '—' }}</dd></div>
              <div class="col-span-1 sm:col-span-2"><dt class="text-gray-500 dark:text-gray-400">Type</dt><dd class="font-medium dark:text-white">{{ getCondoType(selectedListingDetails) }}</dd></div>
            </template>

            <!-- MEMORIAL -->
            <template v-else-if="['Memorial', 'memorial'].includes(selectedPropertyType)">
              <div class="col-span-1 sm:col-span-2"><dt class="text-gray-500 dark:text-gray-400">Type</dt><dd class="font-medium dark:text-white">{{ getMemorialType(selectedListingDetails) }}</dd></div>
            </template>
          </dl>
        </div>
      </div>

      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-600 shrink-0" v-if="canEdit">
        <button @click="$emit('delete', sale)" class="px-4 py-2 rounded-lg border border-red-300 dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/80 cursor-pointer">Delete</button>
        <button @click="$emit('edit', sale)" class="px-4 py-2 rounded-lg bg-maurealty-blue text-white hover:opacity-80 transition cursor-pointer">Edit</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// The Sale Details popup of the Sales Report (moved out of SalesReport.vue, same look and
// behaviour). The page decides who may edit or delete (canEdit) and handles those actions; this
// component loads what the popup shows: the upline (admins), the DP divisions and the unit details.
import { ref, watch } from 'vue'
import { salesService, type Sale } from '@/services/salesService'
import type { DpDivision } from '@/assets/classes/commission'
import { listingsService } from '@/services/listingsServices'
import { genealogyService, type GenealogyAgent } from '@/services/genealogyService'
import { formatArea } from '@/utils/conversion.ts'
import { saleStatusClass } from '@/utils/saleStatus'
import { positionMap } from '@/assets/classes/agent'
import { formattedPropertyType } from '@/assets/classes/listings'

const props = defineProps<{
  sale: Sale
  isAdmin: boolean
  canEdit: boolean   // admin, or the sale is still pending approval
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'edit', sale: Sale): void
  (e: 'delete', sale: Sale): void
}>()

const detailsLoading = ref(false)
const selectedListingDetails = ref<any>(null)
const selectedPropertyType = ref<string>('')

const lotClassesMap: Record<number, string> = {
  1: 'Residential', 2: 'Commercial', 3: 'Industrial', 4: 'Farm Lot'
}

const condoClassesMap: Record<number, string> = {
  1: 'Residential', 2: 'Commercial', 3: 'Industrial', 4: 'Condotel', 5: 'Timeshare'
}

function getCondoType(details: any) {
  if (!details) return 'N/A'
  if (details.is_studio_type) return 'Studio'
  if (details.is_BR_unit) return 'BR Unit'
  if (details.is_villa) return 'Villa'
  if (details.is_garden_villa) return 'Garden Villa'
  if (details.is_penthouse) return 'Penthouse'
  return 'N/A'
}

// Upline of the selected sale's agent (admin only — hierarchy is sensitive).
// Two levels = supervisor + manager, per the Commission Releasing doc.
const upline = ref<GenealogyAgent[]>([])
const uplineLoading = ref(false)

// DP divisions of the selected sale (only DP sales have any).
const saleDivisions = ref<DpDivision[]>([])

watch(() => props.sale, async (sale) => {
  saleDivisions.value = []
  if (sale?.payment_scheme !== 'DP') return
  try {
    saleDivisions.value = await salesService.getDpDivisions(sale.sale_ID)
  } catch (e) {
    console.error('Failed to load DP divisions:', e)
  }
}, { immediate: true })

function uplinePosition(u: GenealogyAgent): string {
  if (u.position) return u.position
  if (u.position_ID != null) return positionMap[u.position_ID] ?? ''
  return ''
}

watch(() => props.sale, async (sale) => {
  upline.value = [];
  selectedListingDetails.value = null;
  selectedPropertyType.value = '';

  if (!sale) return;

  // 1. Fetch Upline (Admin Only)
  if (props.isAdmin) {
    uplineLoading.value = true;
    try {
      upline.value = await genealogyService.getUplineChain(sale.agent_ID, 2);
    } catch (e) {
      console.error('Failed to load upline:', e);
    } finally {
      uplineLoading.value = false;
    }
  }

  // 2. Fetch Property Details (Everyone)
  detailsLoading.value = true;
  try {
    const typeInfo = await listingsService.getListingPropertyType(sale.listing_ID);
    if (typeInfo) {
      selectedPropertyType.value = typeInfo.typeName;

      // If bulk sale, details are saved directly on the sale record
      if (sale.unit_details && Object.keys(sale.unit_details).length > 0) {
        selectedListingDetails.value = sale.unit_details;
      } else {
        // If single sale, fetch from main_listings
        const fullData = await listingsService.getListingById(sale.listing_ID, typeInfo.typeId);
        if (fullData) {
          const subTableName = [null, 'house_and_lot', 'lot_only', 'condominium', 'memorial'][typeInfo.typeId];
          const rawSubData = subTableName ? (fullData as any)[subTableName as string] : null;
          const dbDetails = Array.isArray(rawSubData) ? rawSubData[0] : (rawSubData || {});

          // Normalize to match expected format
          const normalized = { ...dbDetails };
          normalized.room_count = dbDetails.rooms_count ?? null;
          normalized.toilet_count = dbDetails.toilets_count ?? null;
          normalized.one_storey = dbDetails['1_storey'] ?? false;
          normalized.two_storey = dbDetails['2_storey'] ?? false;
          normalized.townhome = dbDetails.townhomes ?? false;
          normalized.area = dbDetails.lot_area ?? dbDetails.area ?? null;

          if (typeInfo.typeId === 2 && dbDetails.lot_class_ID) {
            normalized.class = lotClassesMap[dbDetails.lot_class_ID] || 'N/A';
          } else if (typeInfo.typeId === 3 && dbDetails.condo_class_ID) {
            normalized.class = condoClassesMap[dbDetails.condo_class_ID] || 'N/A';
          }

          selectedListingDetails.value = normalized;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load property details", e);
  } finally {
    detailsLoading.value = false;
  }
}, { immediate: true })

// Formatting helpers
const pesoFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const formatPeso = (n: number) => pesoFmt.format(n || 0)
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })

// -- This Block is purely for display purposes of Sales Report --
function getMemorialType(details: any) {
  if (!details) return 'N/A';
  if (details.is_urn) return 'Urn'
  if (details.is_vault) return 'Vault'
  if (details.is_garden) return 'Garden'
  if (details.is_estate) return 'Estate'
  if (details.is_family_estate) return 'Family Estate'
  if (details.is_pet_memorial) return 'Pet Memorial'
  return 'N/A'
}

function getHouseFeatures(details: any) {
  if (!details) return '—';
  const features = [];
  if (details.one_storey) features.push('One Storey');
  if (details.two_storey) features.push('Two Storey');
  if (details.with_loft) features.push('With Loft');
  if (details.townhome) features.push('Townhome');
  if (details.rowhouse) features.push('Rowhouse');
  return features.length ? features.join(', ') : '—';
}
  // for property type badges
function propertyTypeColor(type?: string) {
  if (!type) return 'bg-gray-400'

  switch (type.toLowerCase()) {
    case 'house_and_lot':
    case 'house and lot':
      return 'bg-[#1b5c2d]'
    case 'lot_only':
    case 'lot only':
      return 'bg-yellow-500'
    case 'condominium':
      return 'bg-[#336db0]'
    case 'memorial':
      return 'bg-gray-500'
    case 'clubshare':
      return 'bg-purple-600'
    case 'golfshare':
      return 'bg-emerald-700'
    default:
      return 'bg-gray-400'
  }
}
// -- End of Block --
</script>
