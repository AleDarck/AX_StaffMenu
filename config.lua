Config = {}

-- Grupos que pueden acceder al menú
Config.AllowedGroups = {
    'admin',
    'mod'
}

-- Comando para abrir el menú
Config.Command = 'staffmenu'

-- Webhook de Discord para logs (opcional)
Config.Webhook = 'https://discord.com/api/webhooks/1427912210692178014/p2J1YpF75XieOWwGHP3fEfFNWwHxDGENNorioU0L_Ym5pCET3WnfDmFGQP3yIwygbYML' -- Deja vacío si no quieres logs en Discord

-- Permisos para opciones de vehículo
Config.Permissions = {
    -- Accesos rápidos existentes...
    noclip = {'admin', 'mod'},
    revive = {'admin', 'mod'},
    godmode = {'admin'},
    invisible = {'admin', 'mod'},
    skin = {'admin', 'mod', 'helper'},
    blips = {'admin', 'mod'},
    tags = {'admin', 'mod', 'helper'},
    tpm = {'admin', 'mod'},
    reviveall = {'admin'},
    
    -- Opciones de vehículo (agregar estas líneas)
    repairveh = {'admin', 'mod'},
    refuelveh = {'admin', 'mod'},
    tuningmenu = {'admin', 'mod'},
    vehcustom = {'admin', 'mod'},
    sitveh = {'admin', 'mod'},
    unlockveh = {'admin', 'mod'},

    -- Tab de items (agregar esta línea)
    giveitems = {'admin'},
}

-- Permisos para vehículos
Config.Permissions.factionvehicles = {'admin', 'mod'}
Config.Permissions.spawnvehicle = {'admin', 'mod'}
Config.Permissions.givevehicle = {'admin'}

-- Vehículos de facciones (configurables)
Config.FactionVehicles = {
    ['Policía'] = {
        {name = '14suvrb', label = 'CAMIONETA 4X4 SWAT'},
        {name = '18gtruckrb', label = 'CAMIONETA 4X4 RAPTOR'},
        {name = '20fpiu', label = 'CAMIONETA 4X4'},
        {name = 'dloutlaw', label = 'CANAM POLICE'},
        {name = 'sphijv', label = 'CAMION BLINDADO SWAT'},
        {name = 'Prisonvan2rb', label = 'VAN DE TRANSPORTE'},
        {name = 'speeddemonrb', label = 'CHARGER POLICE'},
        {name = 'umkbuffalowidebody', label = 'SECRETA'},
        {name = 'valor2rb', label = 'SEDAN POLICE'},
        {name = 'valor9rb', label = 'SERVICIO SECRETO'},
        {name = 'wmfenyrcop', label = 'INTERCEPTOR POLICE'},
        {name = 'spnsbjv', label = 'MOTO POLICE'},
        {name = '2vd_gravion', label = 'MOTO2 POLICE'},
        {name = 'polmav2', label = 'POLICE HELICOP.'},

    },
    ['EMS'] = {
        {name = 'EMSf550ambo', label = 'AMBULANCIA'},
        {name = 'fd20exp', label = 'CAMIONETA 4X4'},
        {name = 'nksvolitoems', label = 'EMS HELICOP.'},
        {name = 'firetruk', label = 'CAMION DE BOMBEROS'},
    },
    ['Mecánicos'] = {
        {name = 'towtruck', label = 'Grúa'},
        {name = 'towtruck2', label = 'Grúa Grande'},
        {name = 'flatbed', label = 'Flatbed'}
    },
    ['Taxi'] = {
        {name = 'nkomnisegttaxi', label = 'Taxi Omnis E-GT'},
        {name = 'nkjugulartaxi', label = 'Taxi Jugular'},
        {name = 'taxi', label = 'Taxi Normal'},
    },
    ['Otros'] = {
        {name = 'bus', label = 'Bus'},
        {name = 'taxi', label = 'Taxi'},
        {name = 'trash', label = 'Camión de Basura'},
        {name = 'taco', label = 'Taco Van'}
    }
}

-- ========== TAB USUARIOS ==========

-- Permisos para acciones de usuarios
Config.Permissions.viewplayers = {'admin', 'mod', 'helper'}
Config.Permissions.spectate = {'admin', 'mod'}
Config.Permissions.bring = {'admin', 'mod'}
Config.Permissions.goback = {'admin', 'mod'}
Config.Permissions.kill = {'admin'}
Config.Permissions.reviveplayer = {'admin', 'mod'}
Config.Permissions.skinplayer = {'admin', 'mod'}
Config.Permissions.tptoplayer = {'admin', 'mod'}
Config.Permissions.freeze = {'admin', 'mod'}
Config.Permissions.clearinventory = {'admin'}
Config.Permissions.viewinventory = {'admin', 'mod'}
Config.Permissions.managevehicles = {'admin'}

-- Garajes disponibles para gestionar vehículos
Config.Garages = {
    'LegionSquare',
    'Impound1',
    'PillboxGarage',
    'SandyShores',
    'PaletoBay',
    'AirportGarage',
    'VinewoodGarage'
}

-- Permisos para tab offline
Config.Permissions.viewoffline = {'admin', 'mod'}
Config.Permissions.deletecharacter = {'admin'}

-- Tablas para borrar al eliminar personaje
Config.CharacterDeletionTables = {
    'users',
    'owned_vehicles',
    'player_houses',
    'phone_crypto',
    'addon_account_data',
    'addon_inventory',
    'datastore_data',
    'user_licenses',
    'user_contacts',
    'user_accounts'
    -- Agrega aquí más tablas según tu servidor
}

-- Colores del menú (puedes personalizarlos)
Config.Colors = {
    primary = '#747474ff',
    secondary = '#222222ff',
    success = '#10b981',
    danger = '#ef4444',
    warning = '#f59e0b',
    background = '#1e1e2e',
    card = '#2a2a3e'
}