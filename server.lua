local staffOnDuty = {}

print('[AX_StaffMenu] Servidor cargado correctamente')

-- ========== CALLBACKS ==========

-- Verificar permisos
ESX.RegisterServerCallback('ax_staff:checkPermission', function(source, cb)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        cb(false)
        return
    end
    
    local playerGroup = xPlayer.getGroup()
    local hasPermission = false
    
    for _, group in ipairs(Config.AllowedGroups) do
        if playerGroup == group then
            hasPermission = true
            break
        end
    end
    
    cb(hasPermission)
end)

-- Obtener estado de duty
ESX.RegisterServerCallback('ax_staff:getDutyStatus', function(source, cb)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then 
        cb(false)
        return 
    end
    
    local identifier = xPlayer.identifier
    cb(staffOnDuty[identifier] or false)
end)

-- Obtener información del servidor
ESX.RegisterServerCallback('ax_staff:getServerInfo', function(source, cb)
    local players = ESX.GetExtendedPlayers()
    local playerCount = #players
    
    -- Contar staff en servicio
    local staffCount = 0
    for identifier, onDuty in pairs(staffOnDuty) do
        if onDuty then
            staffCount = staffCount + 1
        end
    end
    
    local info = {
        playerCount = playerCount,
        maxPlayers = GetConvarInt('sv_maxclients', 32),
        staffOnDuty = staffCount,
        uptime = '00:00',
        serverName = GetConvar('sv_hostname', 'Mi Servidor')
    }
    
    cb(info)
end)

-- Obtener mensajes del chat al abrir el menú
ESX.RegisterServerCallback('ax_staff:getChatMessages', function(source, cb)
    MySQL.query('SELECT name, rank, message, time FROM staff_chat_messages ORDER BY timestamp ASC LIMIT 50', {}, function(result)
        cb(result or {})
    end)
end)

-- Verificar permiso para acción
ESX.RegisterServerCallback('ax_staff:checkActionPermission', function(source, cb, action)
    cb(hasActionPermission(source, action))
end)

-- ========== EVENTOS ==========

-- Toggle duty
RegisterNetEvent('ax_staff:toggleDuty', function()
    local source = source
    print('[AX_StaffMenu SERVER] Evento toggleDuty recibido de source: ' .. tostring(source))
    
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then 
        print('[AX_StaffMenu SERVER] ERROR: xPlayer es nil')
        return 
    end
    
    print('[AX_StaffMenu SERVER] xPlayer encontrado: ' .. xPlayer.getName())
    
    local identifier = xPlayer.identifier
    
    if staffOnDuty[identifier] == nil then
        staffOnDuty[identifier] = false
    end
    
    staffOnDuty[identifier] = not staffOnDuty[identifier]
    
    print('[AX_StaffMenu SERVER] Nuevo estado de duty: ' .. tostring(staffOnDuty[identifier]))
    
    TriggerClientEvent('ax_staff:updateDuty', source, staffOnDuty[identifier])
    
    -- Actualizar contador de staff activos para todos los staff
    local staffCount = 0
    for id, onDuty in pairs(staffOnDuty) do
        if onDuty then
            staffCount = staffCount + 1
        end
    end
    
    -- Enviar actualización a todos los staff conectados
    local players = ESX.GetExtendedPlayers()
    for _, player in ipairs(players) do
        local group = player.getGroup()
        for _, allowedGroup in ipairs(Config.AllowedGroups) do
            if group == allowedGroup then
                TriggerClientEvent('ax_staff:updateStaffCount', player.source, staffCount)
                break
            end
        end
    end
end)

-- Remover duty al desconectarse
AddEventHandler('playerDropped', function(reason)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if xPlayer then
        local identifier = xPlayer.identifier
        if staffOnDuty[identifier] then
            staffOnDuty[identifier] = false
        end
    end
end)

-- ========== SISTEMA DE CHAT ==========

-- Enviar mensaje al chat de staff
RegisterNetEvent('ax_staff:sendChatMessage', function(message)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then return end
    
    local playerGroup = xPlayer.getGroup()
    local hasPermission = false
    
    for _, group in ipairs(Config.AllowedGroups) do
        if playerGroup == group then
            hasPermission = true
            break
        end
    end
    
    if not hasPermission then return end
    
    local chatMessage = {
        name = xPlayer.getName(),
        rank = playerGroup,
        message = message,
        time = os.date('%H:%M')
    }
    
    -- Guardar en base de datos
    MySQL.insert('INSERT INTO staff_chat_messages (name, rank, message, time) VALUES (?, ?, ?, ?)', {
        chatMessage.name,
        chatMessage.rank,
        chatMessage.message,
        chatMessage.time
    })
    
    -- Enviar a todos los staff conectados
    local players = ESX.GetExtendedPlayers()
    for _, player in ipairs(players) do
        local group = player.getGroup()
        for _, allowedGroup in ipairs(Config.AllowedGroups) do
            if group == allowedGroup then
                TriggerClientEvent('ax_staff:receiveChatMessage', player.source, chatMessage)
                break
            end
        end
    end
end)

-- Limpiar chat (solo admin)
RegisterNetEvent('ax_staff:clearChat', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then return end
    
    if xPlayer.getGroup() ~= 'admin' then
        return
    end
    
    -- Limpiar base de datos
    MySQL.query('DELETE FROM staff_chat_messages', {})
    
    -- Notificar a todos los staff
    local players = ESX.GetExtendedPlayers()
    for _, player in ipairs(players) do
        local group = player.getGroup()
        for _, allowedGroup in ipairs(Config.AllowedGroups) do
            if group == allowedGroup then
                TriggerClientEvent('ax_staff:clearChatMessages', player.source)
                break
            end
        end
    end
end)

-- ========== ACCIONES RÁPIDAS ==========

-- Verificar permisos para acciones
function hasActionPermission(source, action)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return false end
    
    local playerGroup = xPlayer.getGroup()
    local allowedGroups = Config.Permissions[action]
    
    if not allowedGroups then return false end
    
    for _, group in ipairs(allowedGroups) do
        if playerGroup == group then
            return true
        end
    end
    
    return false
end

-- Revivir a todos
RegisterNetEvent('ax_staff:reviveAll', function()
    local source = source
    
    if not hasActionPermission(source, 'reviveall') then
        return
    end
    
    local xPlayer = ESX.GetPlayerFromId(source)
    local players = ESX.GetExtendedPlayers()
    
    for _, player in ipairs(players) do
        TriggerClientEvent('esx_ambulancejob:revive', player.source)
    end
    
    -- Log en Discord
    SendToDiscord('Revivir a Todos', xPlayer.getName() .. ' ha revivido a todos los jugadores', 16776960)
end)

-- ========== FUNCIONES AUXILIARES ==========

-- Función para enviar logs a Discord (opcional)
function SendToDiscord(title, description, color)
    if Config.Webhook == '' then return end
    
    local embed = {
        {
            ['title'] = title,
            ['description'] = description,
            ['type'] = 'rich',
            ['color'] = color,
            ['footer'] = {
                ['text'] = 'AX Staff Menu - ' .. os.date('%Y-%m-%d %H:%M:%S')
            }
        }
    }
    
    PerformHttpRequest(Config.Webhook, function(err, text, headers) end, 'POST', json.encode({
        username = 'Staff Menu',
        embeds = embed
    }), {['Content-Type'] = 'application/json'})
end


-- ========== TAB ITEMS ==========

-- Obtener todos los items del ox_inventory
ESX.RegisterServerCallback('ax_staff:getInventoryItems', function(source, cb)
    local items = {}
    
    -- Obtener items de ox_inventory
    local itemsList = exports.ox_inventory:Items()
    
    for itemName, itemData in pairs(itemsList) do
        table.insert(items, {
            name = itemName,
            label = itemData.label,
            weight = itemData.weight,
            close = itemData.close,
            description = itemData.description
        })
    end
    
    cb(items)
end)

-- Obtener jugadores online
ESX.RegisterServerCallback('ax_staff:getOnlinePlayers', function(source, cb)
    local players = {}
    local xPlayers = ESX.GetExtendedPlayers()
    
    for _, xPlayer in ipairs(xPlayers) do
        table.insert(players, {
            id = xPlayer.source,
            name = xPlayer.getName(),
            identifier = xPlayer.identifier
        })
    end
    
    cb(players)
end)

-- Dar items a jugadores
RegisterNetEvent('ax_staff:giveItems', function(data)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then return end
    
    -- Verificar permisos
    if not hasActionPermission(source, 'giveitems') then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Error',
            description = 'No tienes permisos para dar items',
            type = 'error'
        })
        return
    end
    
    local items = data.items
    local players = data.players
    
    if #items == 0 or #players == 0 then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Error',
            description = 'Debes seleccionar items y jugadores',
            type = 'error'
        })
        return
    end
    
    -- Dar items a cada jugador
    for _, playerId in ipairs(players) do
        local targetPlayer = ESX.GetPlayerFromId(playerId)
        
        if targetPlayer then
            for _, item in ipairs(items) do
                local success = exports.ox_inventory:AddItem(playerId, item.name, item.quantity)
                
                if success then
                    -- Notificar al jugador que recibió
                    TriggerClientEvent('ox_lib:notify', playerId, {
                        title = 'Item Recibido',
                        description = 'Has recibido ' .. item.quantity .. 'x ' .. item.label,
                        type = 'success'
                    })
                end
            end
        end
    end
    
    -- Notificar al staff
    TriggerClientEvent('ox_lib:notify', source, {
        title = 'Éxito',
        description = 'Items entregados correctamente',
        type = 'success'
    })
    
    -- Log en Discord
    local itemsText = ''
    for _, item in ipairs(items) do
        itemsText = itemsText .. item.quantity .. 'x ' .. item.label .. '\n'
    end
    
    local playersText = ''
    for _, playerId in ipairs(players) do
        local targetPlayer = ESX.GetPlayerFromId(playerId)
        if targetPlayer then
            playersText = playersText .. targetPlayer.getName() .. ' (ID: ' .. playerId .. ')\n'
        end
    end
    
    SendToDiscord('Items Entregados', 
        '**Staff:** ' .. xPlayer.getName() .. '\n\n**Items:**\n' .. itemsText .. '\n**Jugadores:**\n' .. playersText,
        3066993)
end)

-- ========== TAB VEHICULOS ==========

-- Función para generar placa aleatoria (ABC 123)
function GeneratePlate()
    local letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    local numbers = '0123456789'
    local plate = ''
    
    -- 3 letras
    for i = 1, 3 do
        local randomIndex = math.random(1, #letters)
        plate = plate .. letters:sub(randomIndex, randomIndex)
    end
    
    plate = plate .. ' '
    
    -- 3 números
    for i = 1, 3 do
        local randomIndex = math.random(1, #numbers)
        plate = plate .. numbers:sub(randomIndex, randomIndex)
    end
    
    return plate
end

-- Obtener vehículos de facciones
ESX.RegisterServerCallback('ax_staff:getFactionVehicles', function(source, cb)
    cb(Config.FactionVehicles)
end)

-- Spawnear vehículo de facción
RegisterNetEvent('ax_staff:spawnFactionVehicle', function(vehicleName)
    local source = source
    
    if not hasActionPermission(source, 'factionvehicles') then
        return
    end
    
    local plate = GeneratePlate()
    TriggerClientEvent('ax_staff:spawnVehicleClient', source, vehicleName, plate, false)
end)

-- Spawnear vehículo personalizado
RegisterNetEvent('ax_staff:spawnCustomVehicle', function(vehicleName)
    local source = source
    
    if not hasActionPermission(source, 'spawnvehicle') then
        return
    end
    
    local plate = GeneratePlate()
    TriggerClientEvent('ax_staff:spawnVehicleClient', source, vehicleName, plate, false)
end)

-- Dar vehículo a jugador
RegisterNetEvent('ax_staff:giveVehicleToPlayer', function(vehicleName, targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    local xTarget = ESX.GetPlayerFromId(targetId)
    
    if not xPlayer or not xTarget then
        return
    end
    
    if not hasActionPermission(source, 'givevehicle') then
        return
    end
    
    local plate = GeneratePlate()
    local vehicleData = json.encode({
        model = GetHashKey(vehicleName),
        plate = plate
    })
    
    -- Insertar vehículo en la base de datos (stored en Impound1)
    MySQL.insert('INSERT INTO owned_vehicles (owner, plate, vehicle, stored, type, garage) VALUES (?, ?, ?, ?, ?, ?)', {
        xTarget.identifier,
        plate,
        vehicleData,
        1,
        'vehicle',
        'Impound1'
    }, function(insertId)
        -- Verificar si se insertó correctamente
        if insertId then
            -- Dar llaves
            TriggerClientEvent('ax_staff:giveVehicleKeys', targetId, plate)
            
            -- Notificar al staff
            TriggerClientEvent('ox_lib:notify', source, {
                title = 'Éxito',
                description = 'Vehículo entregado a ' .. xTarget.getName() .. ' (Garaje: Impound1)',
                type = 'success'
            })
            
            -- Notificar al jugador
            TriggerClientEvent('ox_lib:notify', targetId, {
                title = 'Vehículo Recibido',
                description = 'Has recibido un ' .. vehicleName .. ' - Placa: ' .. plate .. ' (Garaje: Impound1)',
                type = 'success'
            })
            
            -- Log en Discord
            SendToDiscord('Vehículo Entregado',
                '**Staff:** ' .. xPlayer.getName() .. '\n**Jugador:** ' .. xTarget.getName() .. ' (ID: ' .. targetId .. ')\n**Vehículo:** ' .. vehicleName .. '\n**Placa:** ' .. plate .. '\n**Garaje:** Impound1',
                3447003)
        else
            TriggerClientEvent('ox_lib:notify', source, {
                title = 'Error',
                description = 'Error al guardar el vehículo en la base de datos',
                type = 'error'
            })
        end
    end)
end)

-- ========== TAB USUARIOS ==========

-- Obtener lista de jugadores online
ESX.RegisterServerCallback('ax_staff:getOnlinePlayersDetailed', function(source, cb)
    local players = {}
    local xPlayers = ESX.GetExtendedPlayers()
    
    for _, xPlayer in ipairs(xPlayers) do
        table.insert(players, {
            id = xPlayer.source,
            name = xPlayer.getName(),
            identifier = xPlayer.identifier
        })
    end
    
    cb(players)
end)

-- Obtener información detallada de un jugador
ESX.RegisterServerCallback('ax_staff:getPlayerInfo', function(source, cb, targetId)
    local xTarget = ESX.GetPlayerFromId(targetId)
    
    if not xTarget then
        cb(nil)
        return
    end
    
    -- Obtener información adicional de la base de datos
    MySQL.query('SELECT firstname, lastname, accounts, job, job_grade, vicoin FROM users WHERE identifier = ?', {
        xTarget.identifier
    }, function(result)
        if result[1] then
            local data = result[1]
            local accounts = json.decode(data.accounts)
            
            local playerInfo = {
                id = targetId,
                name = xTarget.getName(),
                identifier = xTarget.identifier,
                firstname = data.firstname,
                lastname = data.lastname,
                bank = accounts.bank or 0,
                cash = accounts.money or 0,
                vicoin = data.vicoin or 0,
                job = data.job,
                job_grade = data.job_grade
            }
            
            cb(playerInfo)
        else
            cb(nil)
        end
    end)
end)

-- Obtener vehículos de un jugador
ESX.RegisterServerCallback('ax_staff:getPlayerVehicles', function(source, cb, identifier)
    MySQL.query('SELECT plate, vehicle, stored, parking FROM owned_vehicles WHERE owner = ?', {
        identifier
    }, function(vehicles)
        cb(vehicles or {})
    end)
end)

-- Cambiar garage de vehículo
RegisterNetEvent('ax_staff:changeVehicleGarage', function(plate, newGarage)
    local source = source
    
    if not hasActionPermission(source, 'managevehicles') then
        return
    end
    
    MySQL.update('UPDATE owned_vehicles SET garage = ?, stored = ? WHERE plate = ?', {
        newGarage,
        1,
        plate
    }, function(affectedRows)
        if affectedRows > 0 then
            TriggerClientEvent('ox_lib:notify', source, {
                title = 'Éxito',
                description = 'Vehículo movido a ' .. newGarage,
                type = 'success'
            })
        end
    end)
end)

-- Eliminar vehículo
RegisterNetEvent('ax_staff:deleteVehicle', function(plate, targetIdentifier)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'managevehicles') then
        return
    end
    
    MySQL.query('DELETE FROM owned_vehicles WHERE plate = ? AND owner = ?', {
        plate,
        targetIdentifier
    }, function()
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Éxito',
            description = 'Vehículo eliminado',
            type = 'success'
        })
        
        -- Log en Discord
        SendToDiscord('Vehículo Eliminado',
            '**Staff:** ' .. xPlayer.getName() .. '\n**Placa:** ' .. plate,
            15158332)
    end)
end)

-- Traer jugador
RegisterNetEvent('ax_staff:bringPlayer', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'bring') then
        return
    end
    
    TriggerClientEvent('ax_staff:bringPlayerClient', source, targetId)
end)

-- Ir al jugador
RegisterNetEvent('ax_staff:gotoPlayer', function(targetId)
    local source = source
    
    if not hasActionPermission(source, 'tptoplayer') then
        return
    end
    
    TriggerClientEvent('ax_staff:gotoPlayerClient', source, targetId)
end)

-- Devolver jugador
RegisterNetEvent('ax_staff:returnPlayer', function(targetId)
    local source = source
    
    if not hasActionPermission(source, 'goback') then
        return
    end
    
    TriggerClientEvent('ax_staff:returnPlayerClient', targetId)
end)

-- Matar jugador
RegisterNetEvent('ax_staff:killPlayer', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'kill') then
        return
    end
    
    TriggerClientEvent('ax_staff:killPlayerClient', targetId)
    
    local xTarget = ESX.GetPlayerFromId(targetId)
    if xTarget then
        SendToDiscord('Jugador Eliminado',
            '**Staff:** ' .. xPlayer.getName() .. '\n**Jugador:** ' .. xTarget.getName() .. ' (ID: ' .. targetId .. ')',
            15158332)
    end
end)

-- Revivir jugador
RegisterNetEvent('ax_staff:revivePlayerTarget', function(targetId)
    local source = source
    
    if not hasActionPermission(source, 'reviveplayer') then
        return
    end
    
    TriggerClientEvent('esx_ambulancejob:revive', targetId)
    
    TriggerClientEvent('ox_lib:notify', source, {
        title = 'Éxito',
        description = 'Jugador revivido',
        type = 'success'
    })
end)

-- Cambiar skin del jugador
RegisterNetEvent('ax_staff:changeSkinPlayer', function(targetId)
    local source = source
    
    if not hasActionPermission(source, 'skinplayer') then
        return
    end
    
    TriggerClientEvent('ax_staff:openSkinMenu', targetId)
end)

-- Congelar jugador
RegisterNetEvent('ax_staff:freezePlayer', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'freeze') then
        return
    end
    
    TriggerClientEvent('ax_staff:freezePlayerClient', targetId)
    
    local xTarget = ESX.GetPlayerFromId(targetId)
    if xTarget then
        SendToDiscord('Jugador Congelado',
            '**Staff:** ' .. xPlayer.getName() .. '\n**Jugador:** ' .. xTarget.getName() .. ' (ID: ' .. targetId .. ')',
            16776960)
    end
end)

-- Limpiar inventario
RegisterNetEvent('ax_staff:clearInventory', function(targetId)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'clearinventory') then
        return
    end
    
    exports.ox_inventory:ClearInventory(targetId)
    
    TriggerClientEvent('ox_lib:notify', source, {
        title = 'Éxito',
        description = 'Inventario limpiado',
        type = 'success'
    })
    
    local xTarget = ESX.GetPlayerFromId(targetId)
    if xTarget then
        TriggerClientEvent('ox_lib:notify', targetId, {
            title = 'Inventario Limpiado',
            description = 'Tu inventario ha sido limpiado por un administrador',
            type = 'warning'
        })
        
        SendToDiscord('Inventario Limpiado',
            '**Staff:** ' .. xPlayer.getName() .. '\n**Jugador:** ' .. xTarget.getName() .. ' (ID: ' .. targetId .. ')',
            16776960)
    end
end)

-- Teleportar jugador (usado por traer)
RegisterNetEvent('ax_staff:teleportPlayer', function(targetId, coords)
    TriggerClientEvent('ax_staff:setPlayerCoords', targetId, coords)
end)

-- Obtener propiedades de un jugador
ESX.RegisterServerCallback('ax_staff:getPlayerProperties', function(source, cb, identifier)
    MySQL.query('SELECT house, owner, rented, rentPrice, purchasable FROM player_houses WHERE owner = ?', {
        identifier
    }, function(properties)
        cb(properties or {})
    end)
end)

-- Obtener crypto wallet de un jugador
ESX.RegisterServerCallback('ax_staff:getPlayerCrypto', function(source, cb, identifier)
    MySQL.query('SELECT coin, amount, invested FROM phone_crypto WHERE id = ?', {
        identifier
    }, function(crypto)
        cb(crypto or {})
    end)
end)

-- Quitar propiedad a jugador
RegisterNetEvent('ax_staff:removeProperty', function(house, targetIdentifier)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'managevehicles') then
        return
    end
    
    MySQL.query('DELETE FROM player_houses WHERE house = ? AND owner = ?', {
        house,
        targetIdentifier
    }, function(affectedRows)
        if affectedRows > 0 then
            TriggerClientEvent('ox_lib:notify', source, {
                title = 'Éxito',
                description = 'Propiedad eliminada',
                type = 'success'
            })
            
            -- Log en Discord
            SendToDiscord('Propiedad Eliminada',
                '**Staff:** ' .. xPlayer.getName() .. '\n**Casa:** ' .. house,
                15158332)
        end
    end)
end)

-- ========== TAB OFFLINE ==========

-- Obtener todos los jugadores registrados
ESX.RegisterServerCallback('ax_staff:getOfflinePlayers', function(source, cb)
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then
        print('[OFFLINE ERROR] xPlayer es nil')
        cb({})
        return
    end
    
    print('[OFFLINE] Callback recibido de:', xPlayer.getName())
    
    -- Verificar permisos
    local playerGroup = xPlayer.getGroup()
    local hasPermission = false
    
    for _, group in ipairs(Config.AllowedGroups) do
        if playerGroup == group then
            hasPermission = true
            break
        end
    end
    
    if not hasPermission then
        print('[OFFLINE] Sin permisos:', playerGroup)
        cb({})
        return
    end
    
    print('[OFFLINE] Ejecutando query...')
    
    MySQL.query('SELECT identifier, firstname, lastname FROM users ORDER BY lastname ASC', {}, function(result)
        if result then
            print('[OFFLINE] Query exitosa, jugadores encontrados:', #result)
            
            local players = {}
            for _, row in ipairs(result) do
                table.insert(players, {
                    identifier = row.identifier,
                    name = row.firstname .. ' ' .. row.lastname
                })
            end
            
            print('[OFFLINE] Enviando', #players, 'jugadores al cliente')
            cb(players)
        else
            print('[OFFLINE] Query sin resultados')
            cb({})
        end
    end)
end)

-- Obtener información detallada de un jugador offline
ESX.RegisterServerCallback('ax_staff:getOfflinePlayerInfo', function(source, cb, identifier)
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then
        cb(nil)
        return
    end
    
    -- Verificar permisos
    local playerGroup = xPlayer.getGroup()
    local hasPermission = false
    
    for _, group in ipairs(Config.AllowedGroups) do
        if playerGroup == group then
            hasPermission = true
            break
        end
    end
    
    if not hasPermission then
        cb(nil)
        return
    end
    
    MySQL.query('SELECT firstname, lastname, accounts, job, job_grade, vicoin FROM users WHERE identifier = ?', {
        identifier
    }, function(result)
        if result[1] then
            local data = result[1]
            local accounts = json.decode(data.accounts)
            
            local playerInfo = {
                identifier = identifier,
                firstname = data.firstname,
                lastname = data.lastname,
                bank = accounts.bank or 0,
                cash = accounts.money or 0,
                vicoin = data.vicoin or 0,
                job = data.job,
                job_grade = data.job_grade
            }
            
            cb(playerInfo)
        else
            cb(nil)
        end
    end)
end)

-- Eliminar personaje completo
RegisterNetEvent('ax_staff:deleteCharacter', function(identifier)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then return end
    
    -- Verificar permisos
    local playerGroup = xPlayer.getGroup()
    if playerGroup ~= 'admin' then
        return
    end
    
    -- Eliminar de todas las tablas configuradas
    for _, tableName in ipairs(Config.CharacterDeletionTables) do
        local column = 'owner'
        
        if tableName == 'users' or tableName == 'user_licenses' or tableName == 'user_contacts' or tableName == 'user_accounts' then
            column = 'identifier'
        elseif tableName == 'phone_crypto' then
            column = 'id'
        end
        
        MySQL.query('DELETE FROM ' .. tableName .. ' WHERE ' .. column .. ' = ?', {
            identifier
        })
    end
    
    TriggerClientEvent('ox_lib:notify', source, {
        title = 'Éxito',
        description = 'Personaje eliminado permanentemente',
        type = 'success'
    })
    
    SendToDiscord('Personaje Eliminado',
        '**Staff:** ' .. xPlayer.getName() .. '\n**Licencia:** ' .. identifier,
        15158332)
end)

-- ========== TAB COMIDAS ==========

-- Obtener todas las comidas configuradas
ESX.RegisterServerCallback('ax_staff:getFoodItems', function(source, cb)
    MySQL.query('SELECT * FROM staff_food_config ORDER BY id DESC', {}, function(result)
        cb(result or {})
    end)
end)

-- Agregar nueva comida
RegisterNetEvent('ax_staff:addFoodItem', function(data)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'managefood') then
        return
    end
    
    -- Validar rangos
    if data.hunger < -100 or data.hunger > 100 or 
       data.thirst < -100 or data.thirst > 100 or 
       data.stress < -100 or data.stress > 100 or 
       data.alcohol < -100 or data.alcohol > 100 then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Error',
            description = 'Los valores deben estar entre -100 y 100',
            type = 'error'
        })
        return
    end
    
    -- Verificar que el item existe en ox_inventory
    local itemExists = exports.ox_inventory:Items(data.item_name)
    if not itemExists then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Error',
            description = 'Este item no existe en ox_inventory',
            type = 'error'
        })
        return
    end
    
    -- Verificar si el item ya está configurado
    MySQL.query('SELECT id FROM staff_food_config WHERE item_name = ?', {
        data.item_name
    }, function(result)
        if result and #result > 0 then
            TriggerClientEvent('ox_lib:notify', source, {
                title = 'Error',
                description = 'Este item ya está configurado',
                type = 'error'
            })
            return
        end
        
        -- Insertar nueva comida
        MySQL.insert('INSERT INTO staff_food_config (item_name, label, category, hunger, thirst, stress, alcohol) VALUES (?, ?, ?, ?, ?, ?, ?)', {
            data.item_name,
            data.label,
            data.category,
            data.hunger,
            data.thirst,
            data.stress,
            data.alcohol
        }, function(insertId)
            if insertId then
                TriggerClientEvent('ox_lib:notify', source, {
                    title = 'Éxito',
                    description = 'Comida agregada correctamente',
                    type = 'success'
                })
                
                -- Log en Discord
                SendToDiscord('Comida Agregada',
                    '**Staff:** ' .. xPlayer.getName() .. '\n**Item:** ' .. data.item_name .. '\n**Label:** ' .. data.label .. '\n**Categoría:** ' .. data.category,
                    3066993)
            end
        end)
    end)
end)

-- Actualizar comida existente
RegisterNetEvent('ax_staff:updateFoodItem', function(data)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'managefood') then
        return
    end
    
    -- Validar rangos
    if data.hunger < -100 or data.hunger > 100 or 
       data.thirst < -100 or data.thirst > 100 or 
       data.stress < -100 or data.stress > 100 or 
       data.alcohol < -100 or data.alcohol > 100 then
        TriggerClientEvent('ox_lib:notify', source, {
            title = 'Error',
            description = 'Los valores deben estar entre -100 y 100',
            type = 'error'
        })
        return
    end
    
    MySQL.update('UPDATE staff_food_config SET label = ?, category = ?, hunger = ?, thirst = ?, stress = ?, alcohol = ? WHERE id = ?', {
        data.label,
        data.category,
        data.hunger,
        data.thirst,
        data.stress,
        data.alcohol,
        data.id
    }, function(affectedRows)
        if affectedRows > 0 then
            TriggerClientEvent('ox_lib:notify', source, {
                title = 'Éxito',
                description = 'Comida actualizada correctamente',
                type = 'success'
            })
            
            -- Log en Discord
            SendToDiscord('Comida Actualizada',
                '**Staff:** ' .. xPlayer.getName() .. '\n**ID:** ' .. data.id .. '\n**Label:** ' .. data.label,
                3447003)
        end
    end)
end)

-- Eliminar comida
RegisterNetEvent('ax_staff:deleteFoodItem', function(id)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer or not hasActionPermission(source, 'managefood') then
        return
    end
    
    -- Obtener info antes de eliminar para el log
    MySQL.query('SELECT item_name, label FROM staff_food_config WHERE id = ?', {id}, function(result)
        if result and #result > 0 then
            local itemData = result[1]
            
            MySQL.query('DELETE FROM staff_food_config WHERE id = ?', {id}, function()
                TriggerClientEvent('ox_lib:notify', source, {
                    title = 'Éxito',
                    description = 'Comida eliminada correctamente',
                    type = 'success'
                })
                
                -- Log en Discord
                SendToDiscord('Comida Eliminada',
                    '**Staff:** ' .. xPlayer.getName() .. '\n**Item:** ' .. itemData.item_name .. '\n**Label:** ' .. itemData.label,
                    15158332)
            end)
        end
    end)
end)

-- Aplicar efectos de comida/bebida
RegisterNetEvent('ax_staff:applyFoodEffects', function(itemName)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then return end
    
    -- Obtener configuración del item
    MySQL.query('SELECT * FROM staff_food_config WHERE item_name = ?', {itemName}, function(result)
        if result and #result > 0 then
            local itemData = result[1]
            
            -- Aplicar efectos usando esx_status
            if itemData.hunger ~= 0 then
                TriggerClientEvent('esx_status:add', source, 'hunger', itemData.hunger * 10000)
            end
            
            if itemData.thirst ~= 0 then
                TriggerClientEvent('esx_status:add', source, 'thirst', itemData.thirst * 10000)
            end
            
            if itemData.stress ~= 0 then
                TriggerClientEvent('esx_status:add', source, 'stress', itemData.stress * 10000)
            end
            
            if itemData.alcohol ~= 0 then
                TriggerClientEvent('esx_status:add', source, 'drunk', itemData.alcohol * 10000)
            end
            
            -- Ejecutar animación en el cliente
            TriggerClientEvent('ax_staff:useFoodItem', source, itemData)
        end
    end)
end)

-- Callback para obtener item por nombre (para ox_inventory)
ESX.RegisterServerCallback('ax_staff:getFoodItemByName', function(source, cb, itemName)
    MySQL.query('SELECT * FROM staff_food_config WHERE item_name = ?', {itemName}, function(result)
        if result and #result > 0 then
            cb(result[1])
        else
            cb(nil)
        end
    end)
end)