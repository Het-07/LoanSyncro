import type { ResourcesConfig } from "aws-amplify"

const awsmobile: ResourcesConfig = {
  Auth: {
    // The region for Cognito should be a direct property of Auth
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,  

    //   authenticationFlowType: "USER_PASSWORD_AUTH",
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
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET,
      region: import.meta.env.VITE_AWS_REGION,
    },
  },
  Geo: {
    LocationService: {
        region: import.meta.env.VITE_AWS_REGION
    }
}
}

export default awsmobile
