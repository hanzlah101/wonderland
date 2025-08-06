import { FirebaseError } from "firebase/app"

const firebaseErrorMessages: Record<string, string> = {
  "auth/user-not-found": "No account found with this email address",
  "auth/wrong-password": "Incorrect password",
  "auth/invalid-email": "Please enter a valid email address",
  "auth/user-disabled": "This account has been disabled",
  "auth/too-many-requests": "Too many failed attempts. Please try again later",
  "auth/email-already-in-use": "An account with this email already exists",
  "auth/weak-password": "Password should be at least 6 characters",
  "auth/invalid-credential": "Invalid email or password",
  "auth/network-request-failed": "Network error. Please check your connection",
  "auth/operation-not-allowed": "This operation is not allowed",
  "auth/requires-recent-login": "Please log in again to continue",
  "auth/missing-password": "Please enter your password",
  "auth/invalid-login-credentials": "Invalid email or password"
}

export function getErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return firebaseErrorMessages[error.code] || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred"
}
