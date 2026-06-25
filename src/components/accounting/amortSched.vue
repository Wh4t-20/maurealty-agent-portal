<template>
    <div @click.self="$emit('close')" class="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 md:p-8 ">
    
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
      
        <div class="flex items-center gap-3 p-5 border-b border-gray-100 bg-white">
        
            <h2 class="text-xl font-medium text-[#475569]">Amortization Schedule</h2>
            <button @click="$emit('close')" class="ml-auto text-gray-400 hover:text-red-500 text-3xl leading-none transition  cursor-pointer ">&times;</button>
        </div>

        <div class="p-6 pb-4 flex flex-col gap-2">
            <p class="text-[#475569] text-sm">Loan Amount: <span class="font-medium text-[#1e2a5a]">₱{{ formatCurrency(principal) }}</span></p>
            <p class="text-[#475569] text-sm">Loan Tenor (in years): <span class="font-medium text-[#1e2a5a]">{{ years }}</span></p>
            
            <div class="mt-1">
                <button 
                    @click="exportToPDF" 
                    class="text-sm text-[#DC143C] underline cursor-pointer hover:text-[#003d82] transition-colors bg-transparent border-none p-0"
                >
                    Export PDF
                </button>
            </div>

            <div class="flex justify-between items-end mt-4">
            <h3 class="text-2xl font-normal text-[#b91c1c]">Monthly Payment: ₱{{ formatCurrency(standardMonthlyPayment) }}</h3>
            
            <div class="flex flex-col items-end">
                <label class="text-xs text-gray-500 mb-1">Number of Months</label>
                <select v-model="itemsPerPage" @change="currentPage = 1" class="border border-gray-300 rounded p-1.5 text-sm outline-none cursor-pointer w-24 bg-white text-[#475569]">
                <option :value="12">12</option>
                <option :value="24">24</option>
                <option :value="36">36</option>
                <option :value="years * 12">All</option>
                </select>
            </div>
            </div>
        </div>

    <div class="overflow-y-auto flex-1 px-6 pb-6">
        <table class="w-full text-center border-collapse border border-gray-200">
            <thead class="sticky top-0 bg-white shadow-sm z-10 text-[#475569] text-sm font-semibold">
            <tr>
                <th class="border-t-2 py-4 px-3 border border-gray-200 w-1/12 whitespace-normal wrap-break-word">
                Month
                </th>
                
                <th class="border-t-2 hidden md:table-cell py-4 px-3 border border-gray-200 w-2/12 whitespace-normal wrap-break-word">
                Due Date
                </th>
                
                <th class="border-t-2 hidden md:table-cell py-4 px-3 border border-gray-200 w-2/12 whitespace-normal wrap-break-word">
                Monthly Payment
                </th>
                
                <th class="border-t-2 hidden md:table-cell py-4 px-3 border border-gray-200 w-2/12 whitespace-normal wrap-break-word">
                Interest Due
                </th>
                
                <th class="border-t-2 hidden md:table-cell py-4 px-3 border border-gray-200 w-2/12 whitespace-normal wrap-break-word">
                Principal Payment
                </th>
                
                <th class="border-t-2 hidden md:table-cell py-4 px-3 border border-gray-200 w-2/12 whitespace-normal wrap-break-word">
                Outstanding<br/>Principal Balance
                </th>
                
                <th class="border-t-2 hidden md:table-cell py-4 px-3 border border-gray-200 w-1/12 whitespace-normal wrap-break-word">
                Days
                </th>
            </tr>
            </thead>
          <tbody class="text-sm text-[#475569]">
            <tr v-for="row in paginatedSchedule" :key="row.month">
              <td class="py-3 px-3 border border-gray-200 w-1/12">{{ row.month }}</td>
              
              <td class="hidden md:table-cell py-3 px-3 border border-gray-200 w-2/12">{{ formatDate(row.date) }}</td>
              
              <td class="hidden md:table-cell py-3 px-3 border border-gray-200 w-2/12">₱{{ formatCurrency(row.payment) }}</td>
              
              <td class="hidden md:table-cell py-3 px-3 border border-gray-200 w-2/12 text-[#b91c1c]">₱{{ formatCurrency(row.interestPaid) }}</td>
              
              <td class="hidden md:table-cell py-3 px-3 border border-gray-200 w-2/12">₱{{ formatCurrency(row.principalPaid) }}</td>
              
              <td class="hidden md:table-cell py-3 px-3 border border-gray-200 w-2/12">₱{{ formatCurrency(row.balance) }}</td>
              
              <td class="hidden md:table-cell py-3 px-3 border border-gray-200 w-1/12">{{ row.days }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-center p-6 bg-white border-t border-gray-100 text-sm text-[#475569]">
        <p>Page: {{ currentPage }} of {{ totalPages }}</p>
        <div class="flex gap-4">
          <button @click="currentPage = 1" :disabled="currentPage === 1" class="hover:text-red-600 disabled:opacity-30 disabled:hover:text-[#475569] transition">&lt; First</button>
          <button @click="currentPage--" :disabled="currentPage === 1" class="hover:text-red-600 disabled:opacity-30 disabled:hover:text-[#475569] transition">&lt; Previous</button>
          <button @click="currentPage++" :disabled="currentPage === totalPages" class="text-red-600 font-medium hover:text-red-800 disabled:opacity-30 disabled:text-[#475569] transition">Next &gt;</button>
          <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="text-red-600 font-medium hover:text-red-800 disabled:opacity-30 disabled:text-[#475569] transition">Last &gt;</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted} from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'


const props = defineProps<{
  principal: number;
  years: number;
  interest: number;
}>()

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = 'auto'
})

defineEmits(['close'])

const itemsPerPage = ref(12)
const currentPage = ref(1)

const formatCurrency = (val: number) => {
  return val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getPaymentDate = (monthsToAdd: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() + monthsToAdd)
  return d
}

const getDaysBetween = (d1: Date, d2: Date) => {
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}


const standardMonthlyPayment = computed(() => {
  if (!props.principal || !props.years || !props.interest) return 0
  const annualInterest = props.interest 
  const monthlyRate = (annualInterest / 100) / 12
  const totalMonths = props.years * 12
  return props.principal * ((monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
})

const schedule = computed(() => {
  if (!props.principal || !props.years || !props.interest) return []

  const annualRate = props.interest / 100
  const totalMonths = props.years * 12
  let currentBalance = props.principal
  const rows = []
  
  let previousDate = new Date() 

  for (let i = 1; i <= totalMonths; i++) {
    const currentDate = getPaymentDate(i)
    const daysInPeriod = getDaysBetween(previousDate, currentDate)
    
    const interestForMonth = currentBalance * annualRate * (daysInPeriod / 365)
    let principalForMonth = standardMonthlyPayment.value - interestForMonth
    let actualPayment = standardMonthlyPayment.value

    if (i === totalMonths || currentBalance <= principalForMonth) {
      principalForMonth = currentBalance
      actualPayment = principalForMonth + interestForMonth
    }

    currentBalance -= principalForMonth

    rows.push({
      month: i,
      date: currentDate,
      payment: actualPayment,
      principalPaid: principalForMonth,
      interestPaid: interestForMonth,
      balance: Math.max(0, currentBalance),
      days: daysInPeriod
    })

    previousDate = currentDate
  }

  return rows
})

const totalPages = computed(() => Math.ceil(schedule.value.length / itemsPerPage.value))

const paginatedSchedule = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return schedule.value.slice(start, end)
})

//
const exportToPDF = () => {
const doc = new jsPDF('p', 'mm', 'a4')

doc.setFontSize(18)
doc.setTextColor(30, 42, 90)
doc.text('Amortization Schedule', 14, 22)
    
doc.setFontSize(11)
doc.setTextColor(71, 85, 105)
doc.text(`Loan Amount: Php ${formatCurrency(props.principal)}`, 14, 32)
doc.text(`Loan Tenor (in years): ${props.years}`, 14, 38)
    
doc.setFontSize(14)
doc.setTextColor(185, 28, 28)
doc.text(`Monthly Payment: Php ${formatCurrency(standardMonthlyPayment.value)}`, 14, 48)


const tableColumns = ['Month', 'Due Date', 'Monthly Payment', 'Interest Due', 'Principal Payment', 'Balance', 'Days']
    
const tableRows = schedule.value.map(row => [
    row.month,
    formatDate(row.date),
    `Php ${formatCurrency(row.payment)}`,
    `Php ${formatCurrency(row.interestPaid)}`,
    `Php ${formatCurrency(row.principalPaid)}`,
    `Php ${formatCurrency(row.balance)}`,
    row.days
])


autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 55,
    theme: 'grid',
    styles: { 
    fontSize: 9, 
    halign: 'center',
    textColor: [71, 85, 105] 
    },
    headStyles: { 
    fillColor: [255, 255, 255], 
    textColor: [71, 85, 105],
    lineColor: [226, 232, 240],
    lineWidth: 0.1,
    fontStyle: 'bold'
    },
    didParseCell: function(data) {
    if (data.section === 'body' && data.column.index === 3) {
        data.cell.styles.textColor = [185, 28, 28] 
    }
    }
})

    
    doc.save('Amortization_Schedule.pdf')
    }
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 8px; 
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f8fafc; 
  border-radius: 8px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 8px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}


.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}
</style>
