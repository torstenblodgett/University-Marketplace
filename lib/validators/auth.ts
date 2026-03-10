import { z } from 'zod'

const MCGILL_DOMAINS = ['@mail.mcgill.ca', '@mcgill.ca']

export function isMcGillEmail(email: string) {
  return MCGILL_DOMAINS.some(domain => email.toLowerCase().endsWith(domain))
}

export const signupSchema = z.object({
  email: z
    .string()
    .email('Enter a valid email address')
    .refine(isMcGillEmail, {
      message: 'You must use a McGill email address (@mail.mcgill.ca or @mcgill.ca)',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9 '_-]+$/, 'Name contains invalid characters'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .email('Enter a valid email address')
    .refine(isMcGillEmail, {
      message: 'You must use a McGill email address',
    }),
  password: z.string().min(1, 'Enter your password'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
