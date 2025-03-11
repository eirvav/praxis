import { Roles } from '@/types/globals'
import { auth } from '@clerk/nextjs/server'

export const checkRole = async (role: Roles): Promise<boolean> => {
  const { sessionClaims } = await auth()
  
  // Check if sessionClaims and metadata exist before accessing role
  if (!sessionClaims || !sessionClaims.metadata) {
    return false
  }
  
  return sessionClaims.metadata.role === role
}