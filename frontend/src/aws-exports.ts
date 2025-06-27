import type { ResourcesConfig } from "aws-amplify"

const awsmobile: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
    },
  },
  API: {
    REST: {
      LoanSyncroAPI: {
        endpoint: import.meta.env.VITE_API_URL,
        region: import.meta.env.VITE_AWS_REGION,
      },
    },
  },
  
  Geo: {
    LocationService: {
        region: import.meta.env.VITE_AWS_REGION
    }
  }
}

export default awsmobile
