import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-white/[0.03] animate-pulse rounded-sm border border-white/5', className)}
      {...props}
    />
  )
}

export { Skeleton }
