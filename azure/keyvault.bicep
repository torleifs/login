resource keyvault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'myloginservice-kv'
  location: resourceGroup().location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: appService.identity.principalId
        permissions: {
          secrets: ['get']
        }
      }
    ]
  }
}
