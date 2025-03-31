import { toast } from 'sonner'

export const customToast = {
  success: (message: string) => toast.success(message, {
    className: "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800",
  }),
  error: (message: string) => toast.error(message, {
    className: "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800",
  }),
  warning: (message: string) => toast.warning(message, {
    className: "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800",
  }),
} 