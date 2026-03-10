import { z } from 'zod'

export const CATEGORIES = [
  { value: 'textbooks',      label: 'Textbooks',      type: 'good' },
  { value: 'furniture',      label: 'Furniture',      type: 'good' },
  { value: 'electronics',    label: 'Electronics',    type: 'good' },
  { value: 'clothing',       label: 'Clothing',       type: 'good' },
  { value: 'winter_gear',    label: 'Winter Gear',    type: 'good' },
  { value: 'other_goods',    label: 'Other Goods',    type: 'good' },
  { value: 'tutoring',          label: 'Tutoring',          type: 'service' },
  { value: 'moving',            label: 'Moving Help',        type: 'service' },
  { value: 'cleaning',          label: 'Cleaning',           type: 'service' },
  { value: 'snow_shovelling',   label: 'Snow Shovelling',    type: 'service' },
  { value: 'other_services',    label: 'Other Services',     type: 'service' },
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']

// Zod v4: use `error` instead of `errorMap`
export const listingSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be 100 characters or less'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or less'),
  listing_type: z.enum(['good', 'service'], {
    error: 'Choose goods or services',
  }),
  category: z.enum(
    CATEGORIES.map(c => c.value) as [CategoryValue, ...CategoryValue[]],
    { error: 'Choose a valid category' }
  ),
  price: z
    .string()
    .optional()
    .transform(val => (val === '' || val === undefined ? null : Number(val)))
    .pipe(
      z.union([
        z.number().min(0, 'Price cannot be negative').max(100000, 'Price too high'),
        z.null(),
      ])
    ),
  location: z
    .string()
    .max(100, 'Location must be 100 characters or less')
    .optional()
    .transform(val => val?.trim() || null),
  availability: z
    .string()
    .max(200, 'Availability must be 200 characters or less')
    .optional()
    .transform(val => val?.trim() || null),
  service_area: z
    .string()
    .max(100, 'Service area must be 100 characters or less')
    .optional()
    .transform(val => val?.trim() || null),
})

export type ListingInput = z.infer<typeof listingSchema>
