<template>
  <div class="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(10,61,98,0.7)] dark:bg-[rgba(17,38,53,0.7)] backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black rounded-2xl shadow-2xl">

      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-900 sticky top-0 bg-white dark:bg-black rounded-t-2xl z-10">
        <h2 class="text-xl font-bold text-maurealty-blue dark:text-maurealty-light-blue">{{ editSale ? 'Edit Sale' : lockedListing ? 'Confirm Sale' : 'Upload Sale' }}</h2>
        <button type="button" class="text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none cursor-pointer" @click="$emit('close')">✕</button>
      </div>

      <form class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="submit">

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Developer</label>
          <input
            v-if="propertyLocked"
            type="text"
            :value="developerName || '—'"
            readonly
            :class="[inputClass, 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed']"
          />
          <select v-else v-model="developerName" :class="inputClass">
            <option value="">All developers</option>
            <option v-for="d in developerNames" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Project <span class="text-red-500">*</span></label>
          <input
            v-if="propertyLocked"
            type="text"
            :value="lockedTitle"
            readonly
            :class="[inputClass, 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed']"
          />
          <select v-else v-model="form.listing_ID" required :class="inputClass">
            <option :value="null" disabled>Select a project…</option>
            <option v-for="l in projectOptions" :key="l.listing_id" :value="l.listing_id">{{ l.listing_title }}</option>
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
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Payment Scheme <span class="text-red-500">*</span></label>
          <select v-model="form.payment_scheme" required :class="inputClass">
            <option value="" disabled>Select scheme…</option>
            <option value="DP">DP (Down Payment)</option>
            <option value="Spot-Cash">Spot-Cash</option>
            <option value="Deferred-Cash">Deferred Cash (12 monthly installments)</option>
          </select>
        </div>

        <!-- Financing only applies to a Down Payment scheme (hidden for Spot-Cash and Deferred Cash) -->
        <div v-if="form.payment_scheme === 'DP'" class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Financing <span class="text-red-500">*</span></label>
          <select v-model="form.financing" required :class="inputClass">
            <option value="" disabled>Select financing…</option>
            <option v-for="f in financingOptions" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>

        <!-- Spot-Cash: the whole Total Contract Price is due, no divisions -->
        <div v-if="isSpotCash"
             class="sm:col-span-2 rounded-lg border border-maurealty-blue/20 bg-blue-50/40 dark:bg-maurealty-light-blue/10 p-3 text-sm text-gray-700 dark:text-gray-200">
          Spot-Cash: full payment of <span class="font-semibold">₱{{ formatMoney(form.total_contract_price) }}</span> (Total Contract Price)
          <template v-if="firstDueLabel">, due on <span class="font-semibold">{{ firstDueLabel }}</span> (one month after the reservation)</template>. No DP divisions, no financing.
        </div>

        <!-- Deferred Cash: the Total Contract Price paid in 12 equal monthly installments -->
        <div v-if="form.payment_scheme === 'Deferred-Cash'"
             class="sm:col-span-2 rounded-lg border border-maurealty-blue/20 bg-blue-50/40 dark:bg-maurealty-light-blue/10 p-3 text-sm text-gray-700 dark:text-gray-200">
          Deferred Cash: <span class="font-semibold">₱{{ formatMoney(form.total_contract_price) }}</span> paid in 12 monthly installments of
          <span class="font-semibold">₱{{ formatMoney((form.total_contract_price || 0) / 12) }}</span><template v-if="firstDueLabel">, the first due on <span class="font-semibold">{{ firstDueLabel }}</span></template>.
          One commission tab per installment.
        </div>

        <!-- DP: rate, computed amounts, and the divisions -->
        <div v-if="form.payment_scheme === 'DP'"
             class="sm:col-span-2 flex flex-col gap-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-500 uppercase">DP Rate (%) <span class="text-red-500">*</span></label>
              <input v-model.number="form.dp_rate" type="number" min="0" max="100" step="0.01" :class="inputClass" placeholder="e.g. 20" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-500 uppercase">DP Amount (₱)</label>
              <input type="text" :value="formatMoney(dpMetrics.dp_amount)" readonly :class="[inputClass, readonlyClass]" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-500 uppercase">Remaining Balance (₱)</label>
              <input type="text" :value="formatMoney(dpMetrics.remaining_balance)" readonly :class="[inputClass, readonlyClass]" />
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-maurealty-blue dark:text-maurealty-light-blue">DP Divisions</span>
              <span :class="['text-xs font-semibold', rateStatusClass]">{{ rateStatusText }}</span>
            </div>

            <!-- Division tabs -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="(d, i) in divisions" :key="i" type="button"
                :class="['px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition',
                  i === activeDivision
                    ? 'bg-maurealty-blue text-white border-maurealty-blue'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800']"
                @click="activeDivision = i"
              >Division {{ i + 1 }}</button>
              <button type="button"
                class="px-3 py-1.5 rounded-lg text-sm border border-dashed border-maurealty-blue text-maurealty-blue dark:text-maurealty-light-blue dark:border-maurealty-light-blue hover:bg-blue-50 dark:hover:bg-maurealty-light-blue/10 cursor-pointer"
                @click="addDivision">+ Add division</button>
            </div>

            <!-- Active division -->
            <div v-if="current" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Rate (%)</label>
                <input v-model.number="current.divisionRate" type="number" min="0" max="100" step="0.01" :class="inputClass" placeholder="e.g. 10" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Payable in</label>
                <div class="flex gap-2">
                  <input v-model.number="current.count" type="number" min="1" step="1" :class="[inputClass, 'w-24']" placeholder="e.g. 12" @change="updateEndDate(current)" />
                  <select v-model="current.unit" :class="[inputClass, 'flex-1']" @change="updateEndDate(current)">
                    <option value="months">Months</option>
                    <option value="quarters">Quarters</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                <span class="text-xs text-gray-500">{{ current.count || 0 }} payment(s), one commission tab each</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Due Date Start</label>
                <input v-model="current.startDate" type="date" :class="inputClass" @change="updateEndDate(current)" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-500 uppercase">Due Date End</label>
                <input v-model="current.endDate" type="date" :min="current.startDate || undefined" :class="inputClass" />
              </div>
              <div class="sm:col-span-2 flex justify-end">
                <button v-if="divisions.length > 1" type="button"
                  class="text-sm text-red-600 hover:underline cursor-pointer"
                  @click="removeDivision(activeDivision)">Remove Division {{ activeDivision + 1 }}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Commissionable Amount (₱) <span v-if="!editSale" class="text-red-500">*</span></label>
          <input
            v-model.number="form.commissionable_amount"
            type="number" min="0" step="0.01" :required="!editSale"
            :class="inputClass" placeholder="0.00"
            @input="commissionableTouched = true"
          />
          <span class="text-xs text-gray-500">Can differ from the contract price (taxes and policies). Starts as the contract price.</span>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Commission Rate (%) <span v-if="!editSale" class="text-red-500">*</span></label>
          <input
            v-model.number="form.commission_rate"
            type="number" min="0" max="100" step="0.01" :required="!editSale"
            :class="inputClass" placeholder="e.g. 5"
          />
          <span class="text-xs text-gray-500">Prefilled from the listing's commission when it has one.</span>
        </div>

        <div class="flex flex-col gap-1 sm:col-span-2">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Gross Commission (₱)</label>
          <input type="text" :value="formatMoney(form.gross_commission)" readonly :class="[inputClass, readonlyClass]" />
          <span class="text-xs text-gray-500">Commissionable Amount × Commission Rate. This is what the commission tabs are calculated from.</span>
        </div>

        <!-- Net Commission input commented out for now (not removed).
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Net Commission (₱)</label>
          <input 
            v-model.number="form.net_commission" 
            type="number" min="0" step="0.01" 
            :class="[
              inputClass, 
              !isAdmin ? 'bg-gray-200! dark:bg-gray-800/80! text-gray-400! dark:text-gray-500!  border-gray-300! dark:border-gray-700! cursor-not-allowed shadow-inner' : ''
            ]" 
            placeholder="0.00" 
            :disabled="!isAdmin" 
          />
        </div>
        -->

        <!-- Sale Status Block -->
        <div class="sm:col-span-2 flex flex-col gap-1" v-if="editSale">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Sale Status</label>
          <select 
            v-model="form.status" 
            :class="[
              inputClass, 
              !isAdmin ? 'bg-gray-200! dark:bg-gray-800/80! text-gray-400! dark:text-gray-500! border-gray-300! dark:border-gray-700! cursor-not-allowed shadow-inner' : ''
            ]" 
            :disabled="!isAdmin"
          >
            <option value="pending approval">Pending Approval</option>
            <option value="awaiting payment">Awaiting Payment</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Voucher Series (the voucher/receipt number of the sale, e.g. VCH-0001) is hidden for now.
             Not removed: sales.voucher_series still exists, an edited sale keeps its value, and the
             Sales Report still searches and exports it. Restore by un-commenting this block.
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Voucher Series</label>
          <input v-model.trim="form.voucher_series" type="text" :class="inputClass" placeholder="VCH-0001" />
        </div>
        -->

        <div class="sm:col-span-2 flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-300">Remarks</label>
          <input v-model.trim="form.remarks" type="text" :class="inputClass" :placeholder="remarksPlaceholder" />
        </div>

        <!-- Incentives read from the selected listing (set in Property Management). Read-only here. -->
        <div v-if="selectedListing?.agent_incentive || selectedListing?.realty_incentive"
             class="sm:col-span-2 flex flex-col gap-2 rounded-lg border border-maurealty-blue/20 bg-blue-50/40 dark:bg-maurealty-light-blue/10 p-3">
          <span class="text-xs font-bold uppercase tracking-wider text-maurealty-blue dark:text-maurealty-light-blue">Listing Incentives</span>
          <div v-if="selectedListing?.agent_incentive" class="text-sm">
            <span class="font-semibold text-gray-600 dark:text-gray-300">Agent: </span>
            <span class="text-gray-700 dark:text-gray-200 whitespace-pre-line">{{ selectedListing.agent_incentive }}</span>
          </div>
          <div v-if="selectedListing?.realty_incentive" class="text-sm">
            <span class="font-semibold text-gray-600 dark:text-gray-300">Realty: </span>
            <span class="text-gray-700 dark:text-gray-200 whitespace-pre-line">{{ selectedListing.realty_incentive }}</span>
          </div>
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
                <label class="text-xs font-bold text-gray-500 uppercase">Floor</label>
                <input type="number" v-model="form.unit_details.floor" :class="inputClass">
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
import { salesService, type Sale, type Financing } from '@/services/salesService'
import { listingsService } from '@/services/listingsServices'
import { developerService } from '@/services/developerService'
import { commissionService } from '@/services/commissionService'
import type { PayUnit } from '@/assets/classes/commission'
import { lastDueDate, addMonthsClamped } from '@/utils/paySchedule'
import { authService } from '@/services/authService'
import type { Property } from '@/assets/classes/listings'

// Sold flow passes a fixed listing (id + title + price) so the property is
// locked and the contract price is prefilled. Omit it for the manual flow.
const props = defineProps<{
  lockedListing?: { id: number; title: string; price?: number; commission?: number | null }
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
const readonlyClass = 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'

const financingOptions: Financing[] = ['Pag-ibig', 'Banking', 'In-House with Interest']

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
  commissionable_amount: e?.commissionable_amount ?? null as number | null,
  commission_rate: e?.commission_rate ?? props.lockedListing?.commission ?? null as number | null,
  gross_commission: e?.gross_commission ?? null as number | null,
  net_commission: e?.net_commission ?? null as number | null,
  voucher_series: e?.voucher_series ?? '',
  remarks: e?.remarks ?? '',
  status: e?.status ?? 'pending approval',
  unit_details: e?.unit_details ?? {} as Record<string, any>,
  financing: (e?.financing ?? '') as Financing | '',
  payment_scheme: (e?.payment_scheme ?? '') as 'DP' | 'Spot-Cash' | 'Deferred-Cash' | '',
  dp_rate: e?.dp_rate ?? null as number | null
})

// --- Developer / Project ---
// Developer narrows the project list. Picking a project sets its developer.
const developerNames = ref<string[]>([])
const developerName = ref(e?.developer_name ?? '')

const projectOptions = computed(() =>
  developerName.value
    ? listings.value.filter(l => l.developer_name === developerName.value)
    : listings.value
)

// --- DP divisions ---
// Same shape as DpDivision, but fields can be empty while the user is typing.
interface DivisionForm { divisionRate: number | null; count: number | null; unit: PayUnit; startDate: string; endDate: string }
const divisions = ref<DivisionForm[]>([])
const activeDivision = ref(0)
const current = computed(() => divisions.value[activeDivision.value]) // the tab being edited

function formatMoney(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// DP amount and remaining balance follow the contract price and DP rate.
const dpMetrics = computed(() =>
  salesService.calculateDownpaymentMetrics(form.total_contract_price || 0, form.dp_rate || 0)
)

// Rates are compared in hundredths of a percent so the match is exact.
const hundredths = (n: number | null) => Math.round((n || 0) * 100)
const allocatedHundredths = computed(() => divisions.value.reduce((sum, d) => sum + hundredths(d.divisionRate), 0))
const ratesMatch = computed(() => allocatedHundredths.value === hundredths(form.dp_rate))

const rateStatusText = computed(() => {
  const left = (hundredths(form.dp_rate) - allocatedHundredths.value) / 100
  const allocated = allocatedHundredths.value / 100
  if (left === 0) return `${allocated}% of ${form.dp_rate || 0}% allocated ✓`
  if (left > 0) return `${allocated}% of ${form.dp_rate || 0}% allocated — ${left}% left`
  return `${allocated}% of ${form.dp_rate || 0}% allocated — ${Math.abs(left)}% over`
})
const rateStatusClass = computed(() =>
  ratesMatch.value && allocatedHundredths.value > 0 ? 'text-green-600' : allocatedHundredths.value > hundredths(form.dp_rate) ? 'text-red-500' : 'text-amber-600'
)

// A new division starts with whatever rate is still unallocated.
function addDivision() {
  const left = Math.max(0, (hundredths(form.dp_rate) - allocatedHundredths.value) / 100)
  divisions.value.push({ divisionRate: left || null, count: null, unit: 'months', startDate: '', endDate: '' })
  activeDivision.value = divisions.value.length - 1
}

function removeDivision(i: number) {
  divisions.value.splice(i, 1)
  activeDivision.value = Math.max(0, Math.min(activeDivision.value, divisions.value.length - 1))
}

// The end date is the due date of the last payment, so it follows the start date,
// count and unit. It can still be edited afterwards (it must not be before the last payment).
function updateEndDate(d: DivisionForm) {
  if (!d.startDate || !d.count || d.count < 1) return
  d.endDate = lastDueDate(d.startDate, d.unit, d.count)
}

// Switching scheme: DP starts with one empty division, Spot-Cash clears them.
watch(() => form.payment_scheme, (scheme) => {
  if (scheme === 'DP' && divisions.value.length === 0) addDivision()
  if (scheme !== 'DP') { divisions.value = []; form.dp_rate = null }
  if (scheme !== 'DP') form.financing = ''   // financing only applies to a Down Payment
})

const isSpotCash = computed(() => form.payment_scheme === 'Spot-Cash')

// Spot-Cash is due, and Deferred-Cash starts, one month after the reservation.
const firstDueDate = computed(() => form.reservation_date ? addMonthsClamped(form.reservation_date, 1) : '')
const firstDueLabel = computed(() => firstDueDate.value
  ? new Date(firstDueDate.value + 'T00:00:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  : '')

// The commissionable amount starts as the contract price until the agent types their own.
const commissionableTouched = ref(!!props.editSale)
watch(() => form.total_contract_price, (price) => {
  if (!commissionableTouched.value) form.commissionable_amount = price ?? null
}, { immediate: true })

// Gross Commission = Commissionable Amount x Commission Rate.
watch([() => form.commissionable_amount, () => form.commission_rate], ([amount, rate]) => {
  if (amount != null && rate != null) form.gross_commission = Number((amount * rate / 100).toFixed(2))
}, { immediate: true })

// The Remarks hint depends on the property type: block / lot / phase, or floor / unit.
const propertyTypeName = ref('')
const remarksPlaceholder = computed(() => {
  const t = propertyTypeName.value.toLowerCase()
  if (t.includes('condo')) return 'e.g. Floor 12, Unit 1205'
  if (t.includes('house') || t.includes('lot')) return 'e.g. Block 5, Lot 12, Phase 2'
  return 'e.g. third equity'
})
watch(() => form.listing_ID, async (id) => {
  propertyTypeName.value = ''
  if (!id) return
  try { propertyTypeName.value = (await listingsService.getListingPropertyType(id))?.typeName ?? '' } catch { /* hint only */ }
}, { immediate: true })


// computed property to dynamically check the selected listing
const selectedListing = computed(() => {
  return listings.value.find(l => l.listing_id === form.listing_ID)
})

// Keep the developer in step with the chosen project.
watch(selectedListing, (l) => {
  if (l?.developer_name && l.developer_name !== 'None') developerName.value = l.developer_name
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
  form.commission_rate = listing.commission ?? null;

  // 2. Fetch and map specific property details to pre-fill the unit_details
  try {
    const typeId = propertyTypesMap[listing.property_type] || 1;
    const fullData = await listingsService.getListingById(newId, typeId);
    
    if (fullData) {
      const subTableName = [null, 'house_and_lot', 'lot_only', 'condominium', 'memorial'][typeId];
      const fd = fullData as Record<string, any>;
      const subData = (subTableName && fd[subTableName])
        ? (Array.isArray(fd[subTableName]) ? fd[subTableName][0] : fd[subTableName])
        : fd;
      
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

  // Edit: load the saved DP divisions into the tabs.
  if (props.editSale?.payment_scheme === 'DP') {
    try {
      divisions.value = (await salesService.getDpDivisions(props.editSale.sale_ID)).map(d => ({
        divisionRate: d.divisionRate, count: d.count, unit: d.unit, startDate: d.startDate ?? '', endDate: d.endDate ?? ''
      }))
    } catch (err) {
      console.error('Failed to load DP divisions:', err)
      error.value = 'Could not load DP divisions.'
    }
  }

  // Locked flow (Sold button): the project is fixed, so only its developer is needed.
  if (props.lockedListing) {
    developerName.value = (await salesService.getListingDeveloperName(props.lockedListing.id)) ?? ''
  }

  // Locked/edit flows already have their property — no dropdown needed.
  if (propertyLocked) return
  developerNames.value = await developerService.getDeveloperNames()
  try {
    listings.value = await listingsService.getListings(100)
  } catch (err) {
    console.error('Failed to load listings for sale form:', err)
    error.value = 'Could not load properties.'
  }
})

// Returns an error message, or '' when the payment scheme section is valid.
function validatePaymentScheme(): string {
  if (form.payment_scheme !== 'DP') return ''
  if (!form.financing) return 'Select a financing option.'
  if (!form.dp_rate || form.dp_rate <= 0 || form.dp_rate > 100) return 'Enter a DP rate between 0 and 100%.'
  if (divisions.value.length === 0) return 'Add at least one DP division.'
  for (const [i, d] of divisions.value.entries()) {
    const n = i + 1
    if (!d.divisionRate || d.divisionRate <= 0) return `Division ${n}: enter a rate above 0%.`
    if (!d.count || d.count < 1) return `Division ${n}: enter how many ${d.unit} it is payable in.`
    if (!d.startDate || !d.endDate) return `Division ${n}: enter both due dates.`
    if (d.endDate < d.startDate) return `Division ${n}: the end date can't be before the start date.`
    const lastPayment = lastDueDate(d.startDate, d.unit, d.count)
    if (d.endDate < lastPayment) return `Division ${n}: the last payment falls on ${lastPayment}, after the end date.`
  }
  if (!ratesMatch.value) return `Division rates must add up to exactly ${form.dp_rate}% (currently ${allocatedHundredths.value / 100}%).`
  return ''
}

async function submit() {
  error.value = ''

  const schemeError = validatePaymentScheme()
  if (schemeError) {
    error.value = schemeError
    return
  }

  const isDp = form.payment_scheme === 'DP'

  // Keys must match the DB column names exactly. Empty optional fields → null.
  const payload = {
    listing_ID: form.listing_ID,
    client_name: form.client_name,
    reservation_date: form.reservation_date,
    total_contract_price: form.total_contract_price,
    commissionable_amount: form.commissionable_amount,
    commission_rate: form.commission_rate,
    gross_commission: form.gross_commission,
    net_commission: form.net_commission,
    voucher_series: form.voucher_series || null,
    remarks: form.remarks || null,
    status: form.status,
    unit_details: selectedListing.value?.is_bulk ? form.unit_details: null,
    financing: isDp ? (form.financing || null) : null,   // financing only exists for a Down Payment
    payment_scheme: form.payment_scheme || null,
    dp_rate: isDp ? form.dp_rate : null,
    dp_amount: isDp ? dpMetrics.value.dp_amount : null,
    remaining_balance: isDp ? dpMetrics.value.remaining_balance : null
  }

  // Divisions to save: none for Spot-Cash.
  const dpDivisions = isDp ? divisions.value.map(d => ({
    divisionRate: d.divisionRate as number, count: d.count as number, unit: d.unit, startDate: d.startDate, endDate: d.endDate
  })) : []

  // Only an admin can change a sale's status; anyone else keeps what it already is.
  if (props.editSale && !isAdmin.value) delete (payload as Record<string, any>).status

  // Moving a sale to Complete stamps the date, so the Dashboard counts it as sold in that
  // month. Moving it away from Complete clears the stamp.
  if (props.editSale && isAdmin.value && form.status !== props.editSale.status) {
    (payload as Record<string, any>).completed_at = form.status === 'complete' ? new Date().toISOString() : null
  }

  saving.value = true
  try {
    if (props.editSale) {
      // Edit: agent_ID (the seller) stays as-is — don't reassign on edit.
      const res = await salesService.updateSale(props.editSale.sale_ID, payload)
      if (!res.success) {
        error.value = 'Sale was not updated — check permissions.'
        return
      }
      await salesService.saveDpDivisions(props.editSale.sale_ID, form.dp_rate || 0, dpDivisions)

      // Cancelled: the sale's commission tabs are removed.
      if (form.status === 'cancelled') {
        try {
          await commissionService.removeUnclaimedForSale(props.editSale.sale_ID)
        } catch (tabErr: any) {
          console.error('Failed to remove commission tabs:', tabErr)
          error.value = `Sale saved, but its commission tabs were not removed: ${tabErr?.message || 'unknown error'}`
          return
        }
      }

      // Approved (no longer pending): create the commission tabs. Skipped if they already exist.
      if (['awaiting payment', 'complete'].includes(form.status)) {
        try {
          await salesService.generateCommissionTabs(props.editSale.sale_ID)
        } catch (tabErr: any) {
          console.error('Failed to generate commission tabs:', tabErr)
          error.value = `Sale saved, but commission tabs were not created: ${tabErr?.message || 'unknown error'}`
          return
        }
      }
    } else {
      // Create: the seller is the current agent.
      const agent = await authService.getCurrentAgent()
      if (!agent?.agent_ID) {
        error.value = 'No authenticated agent — please log in again.'
        return
      }
      const created = await salesService.createSale({ agent_ID: agent.agent_ID, ...payload })
      await salesService.saveDpDivisions(created.data.sale_ID, form.dp_rate || 0, dpDivisions)

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
