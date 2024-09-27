resource keyvault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: 'myloginservice-kv'
}

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

resource cdnProfile 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: 'myloginservice-cdn'
  location: resourceGroup().location
  sku: { name: 'Standard_Microsoft' }
}

resource cdnEndPoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: 'myloginservice-cdn-endpoint'
  location: resourceGroup().location
  properties: {
    originHostHeader: '${storageAccount.name}.z33.web.core.windows.net'
    origins: [
      {
        name: 'origin1'
        properties: {
          hostName: '${storageAccount.name}.z16.web.core.windows.net'
          httpPort: 80
          httpsPort: 443
        }
      }
    ]
    isHttpAllowed: true
    isHttpsAllowed: true
  }
}

resource customDomain 'Microsoft.Cdn/profiles/endpoints/customDomains@2021-06-01' = {
  name: 'xyz-custom-domain'
  parent: cdnEndPoint
  properties: {
    hostName: 'www.thelogin.xyz'
  }
}

resource appSettings 'Microsoft.Web/sites/config@2021-02-01' = {
  parent: appService
  name: 'appsettings'
  properties: {
    // TODO: add cors, dbuser, dbhost
    PG_PASSWORD: '@Microsoft.KeyVault(SecretUri=${keyvault.properties.vaultUri}secrets/pgLoginPassword)'
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

// post-deployment scripts

// resource httpsSettingIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
//   name: 'https-setting-identity'
//   location: resourceGroup().location
// }

// resource deploymentScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
//   name: 'setup-https-for-cdn'
//   location: resourceGroup().location
//   identity: {
//     type: 'UserAssigned'
//     userAssignedIdentities: {
//       '${httpsSettingIdentity.id}': {}
//     }
//   }
//   kind: 'AzureCLI'
//   properties: {
//     azCliVersion: '2.37.0' // Specify the Azure CLI version
//     scriptContent: 'az cdn custom-domain enable-https -g ${resourceGroup().name} -n ${customDomain.name} --profile-name ${cdnProfile.name} --endpoint-name ${cdnEndPoint.name}'

//     timeout: 'PT30M' // Specify a timeout period
//     retentionInterval: 'PT1H'
//     cleanupPreference: 'OnSuccess' // Clean up the container group after a successful run
//   }
// }
