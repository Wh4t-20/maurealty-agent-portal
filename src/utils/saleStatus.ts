// src/utils/saleStatus.ts
// Status pill colours for a sale (sales.status), shared by the Sales Report table and the
// Sale Details popup (components/sales/SaleDetailsModal.vue).

// Maps the status string to its corresponding Tailwind colored badge styling
export function saleStatusClass(status: string): string {
  switch (status) {
    case 'pending approval':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    case 'awaiting payment':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    case 'complete':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
  }
}
