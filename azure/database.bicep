param location string = resourceGroup().location
param postgresServerName string = 'logindbserver'
param adminUsername string = 'pgadmin'
@secure()
param adminPassword string
param databaseName string = 'logindb'
param skuName string = 'Standard_B1ms'

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2021-06-01' = {
  name: postgresServerName
  location: location

  properties: {
    version: '16'
    storage: { storageSizeGB: 32 }
    administratorLogin: adminUsername
    administratorLoginPassword: adminPassword
  }
  sku: {
    name: skuName
    tier: 'Burstable'
  }
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: databaseName
}
