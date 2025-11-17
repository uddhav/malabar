/**
 * Plaid Client Configuration
 * Initializes Plaid client with environment variables
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

// Validate environment variables
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  throw new Error(
    'PLAID_CLIENT_ID and PLAID_SECRET must be set in environment variables'
  )
}

// Map environment string to Plaid environment
const getPlaidEnvironment = (env: string) => {
  switch (env) {
    case 'sandbox':
      return PlaidEnvironments.sandbox
    case 'development':
      return PlaidEnvironments.development
    case 'production':
      return PlaidEnvironments.production
    default:
      return PlaidEnvironments.sandbox
  }
}

// Create Plaid configuration
const configuration = new Configuration({
  basePath: getPlaidEnvironment(PLAID_ENV),
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14', // Use latest stable version
    },
  },
})

// Export Plaid client
export const plaidClient = new PlaidApi(configuration)

// Export configuration values for use in API routes
export const plaidConfig = {
  clientId: PLAID_CLIENT_ID,
  secret: PLAID_SECRET,
  env: PLAID_ENV,
  products: process.env.PLAID_PRODUCTS?.split(',') || ['liabilities', 'transactions'],
  countryCodes: process.env.PLAID_COUNTRY_CODES?.split(',') || ['US'],
  redirectUri: process.env.PLAID_REDIRECT_URI,
  webhookUrl: process.env.PLAID_WEBHOOK_URL,
}

export default plaidClient
