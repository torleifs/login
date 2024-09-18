resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'myAppServicePlan'
  location: resourceGroup().location
  sku: {
    name: 'F1'
    tier: 'Free'
  }
  kind: 'linux'
  properties: {
    // Required for Linux. if not set, a windows plan will be created
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: 'myuniquepasswordlessloginservice'
  location: resourceGroup().location
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      // If this is not set, it seems Azure will try to deploy a windows container
      linuxFxVersion: 'DOCKER|torleifs/webauthn:latest'
    }
    httpsOnly: true
    clientAffinityEnabled: false
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: 'myuniqueloginstorage'
  location: resourceGroup().location
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
  }
  sku: {
    name: 'Standard_LRS'
  }
}

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

resource appSettings 'Microsoft.Web/sites/config@2021-02-01' = {
  parent: appService
  name: 'appsettings'
  properties: {
    PG_PASSWORD: '@Microsoft.KeyVault(SecretUri=https://${keyvault.name}.vault.azure.net/secrets/pgLoginPassword)'
  }
}

module database './database.bicep' = {
  name: 'database'
  params: {
    location: resourceGroup().location
    postgresServerName: 'logindbserver'
    adminUsername: 'pgadmin'
    adminPassword: keyvault.getSecret('pgAdminPassword')
    databaseName: 'logindb'
    skuName: 'Standard_B1ms'
  }
}
