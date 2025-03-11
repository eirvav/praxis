export {}

// Create a type for the roles
export type Roles = 'admin' | 'teacher' | 'student'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}