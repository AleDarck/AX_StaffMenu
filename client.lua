-- Variables
local isMenuOpen = false
local isOnDuty = false
local noclipEnabled = false
local godmodeEnabled = false
local invisibleEnabled = false
local blipsEnabled = false
local tagsEnabled = false
local playerBlips = {}

-- Esperar a que ESX esté listo
CreateThread(function()
    while ESX == nil do
        Wait(100)
    end
    print('[AX_StaffMenu] Cliente cargado correctamente')
end)

-- Función para abrir el menú
local function OpenStaffMenu()
    ESX.TriggerServerCallback('ax_staff:checkPermission', function(hasPermission)
        if hasPermission then
            ESX.TriggerServerCallback('ax_staff:getDutyStatus', function(dutyStatus)
                isOnDuty = dutyStatus
                isMenuOpen = true
                SetNuiFocus(true, true)
                SendNUIMessage({
                    action = 'openMenu',
                    duty = isOnDuty
                })
            end)
        else
            ESX.ShowNotification('No tienes permisos para usar este menú', 'error')
        end
    end)
end

-- Comando para abrir el menú
RegisterCommand(Config.Command, function()
    OpenStaffMenu()
end, false)

-- ========== CALLBACKS NUI ==========

-- Cerrar menú
RegisterNUICallback('closeMenu', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

-- Toggle duty
RegisterNUICallback('toggleDuty', function(data, cb)
    print('[AX_StaffMenu CLIENT] Toggle duty callback ejecutado')
    TriggerServerEvent('ax_staff:toggleDuty')
    cb('ok')
end)

-- Obtener información del servidor para el tab INICIO
RegisterNUICallback('getServerInfo', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getServerInfo', function(info)
        cb(info)
    end)
end)

-- Enviar mensaje al chat
RegisterNUICallback('sendChatMessage', function(data, cb)
    TriggerServerEvent('ax_staff:sendChatMessage', data.message)
    cb('ok')
end)

-- Limpiar chat (solo admin)
RegisterNUICallback('clearChat', function(data, cb)
    TriggerServerEvent('ax_staff:clearChat')
    cb('ok')
end)

-- Cargar mensajes del chat
RegisterNUICallback('loadChatMessages', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getChatMessages', function(messages)
        cb(messages)
    end)
end)

-- Acciones rápidas
RegisterNUICallback('quickAction', function(data, cb)
    local action = data.action
    
    ESX.TriggerServerCallback('ax_staff:checkActionPermission', function(hasPermission)
        if not hasPermission then
            ESX.ShowNotification('No tienes permisos para esta acción')
            cb({success = false})
            return
        end
        
        local shouldClose = true -- Variable para controlar si cierra el menú
        local response = {success = true}
        
        if action == 'noclip' then
            noclipEnabled = not noclipEnabled
            ExecuteCommand('noclip')
            ESX.ShowNotification('Noclip ' .. (noclipEnabled and 'activado' or 'desactivado'))
            response.active = noclipEnabled
            
        elseif action == 'revive' then
            ExecuteCommand('revive me')
            ESX.ShowNotification('Te has revivido')
            
        elseif action == 'godmode' then
            godmodeEnabled = not godmodeEnabled
            SetEntityInvincible(PlayerPedId(), godmodeEnabled)
            ESX.ShowNotification('Godmode ' .. (godmodeEnabled and 'activado' or 'desactivado'))
            response.active = godmodeEnabled
            
        elseif action == 'invisible' then
            invisibleEnabled = not invisibleEnabled
            SetEntityVisible(PlayerPedId(), not invisibleEnabled, 0)
            ESX.ShowNotification('Invisible ' .. (invisibleEnabled and 'activado' or 'desactivado'))
            response.active = invisibleEnabled
            
        elseif action == 'skin' then
            ExecuteCommand('pedmenu')
            ESX.ShowNotification('Menú de skin abierto')
            
        elseif action == 'blips' then
            blipsEnabled = not blipsEnabled
            TogglePlayerBlips()
            ESX.ShowNotification('Blips de jugadores ' .. (blipsEnabled and 'activados' or 'desactivados'))
            response.active = blipsEnabled
            
        elseif action == 'tags' then
            tagsEnabled = not tagsEnabled
            ESX.ShowNotification('Tags de IDs ' .. (tagsEnabled and 'activados' or 'desactivados'))
            response.active = tagsEnabled
            
        elseif action == 'tpm' then
            ExecuteCommand('tpm')
            ESX.ShowNotification('Teletransporte al marcador')
            
        elseif action == 'reviveall' then
            TriggerServerEvent('ax_staff:reviveAll')
            
        elseif action == 'repairveh' then
            local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
            if vehicle == 0 then
                local coords = GetEntityCoords(PlayerPedId())
                vehicle = GetClosestVehicle(coords.x, coords.y, coords.z, 5.0, 0, 71)
            end
            
            if vehicle ~= 0 then
                SetVehicleFixed(vehicle)
                SetVehicleDeformationFixed(vehicle)
                SetVehicleUndriveable(vehicle, false)
                SetVehicleEngineOn(vehicle, true, true)
                ESX.ShowNotification('Vehículo reparado')
            else
                ESX.ShowNotification('No hay vehículo cerca')
                response.success = false
            end
            
        elseif action == 'refuelveh' then
            local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
            if vehicle == 0 then
                local coords = GetEntityCoords(PlayerPedId())
                vehicle = GetClosestVehicle(coords.x, coords.y, coords.z, 5.0, 0, 71)
            end
            
            if vehicle ~= 0 then
                SetVehicleFuelLevel(vehicle, 100.0)
                ESX.ShowNotification('Tanque lleno')
            else
                ESX.ShowNotification('No hay vehículo cerca')
                response.success = false
            end
            
        elseif action == 'tuningmenu' then
            local vehicle = GetVehiclePedIsIn(PlayerPedId(), false)
            if vehicle ~= 0 then
                exports["vms_tuning"]:openTuning(nil, true)
                ESX.ShowNotification('Menú de tuning abierto')
            else
                ESX.ShowNotification('Debes estar en un vehículo')
                response.success = false
            end
            
        elseif action == 'vehcustom' then
            ExecuteCommand('vehcustom')
            ESX.ShowNotification('Custom menu abierto')
            
        elseif action == 'sitveh' then
            local coords = GetEntityCoords(PlayerPedId())
            local vehicle = GetClosestVehicle(coords.x, coords.y, coords.z, 10.0, 0, 71)
            
            if vehicle ~= 0 then
                local maxSeats = GetVehicleMaxNumberOfPassengers(vehicle)
                local foundSeat = false
                
                if IsVehicleSeatFree(vehicle, -1) then
                    TaskWarpPedIntoVehicle(PlayerPedId(), vehicle, -1)
                    foundSeat = true
                else
                    for i = 0, maxSeats do
                        if IsVehicleSeatFree(vehicle, i) then
                            TaskWarpPedIntoVehicle(PlayerPedId(), vehicle, i)
                            foundSeat = true
                            break
                        end
                    end
                end
                
                if foundSeat then
                    ESX.ShowNotification('Teletransportado al vehículo')
                else
                    ESX.ShowNotification('No hay asientos disponibles')
                    response.success = false
                end
            else
                ESX.ShowNotification('No hay vehículo cerca')
                response.success = false
            end
            
        elseif action == 'unlockveh' then
            local coords = GetEntityCoords(PlayerPedId())
            local vehicle = GetClosestVehicle(coords.x, coords.y, coords.z, 10.0, 0, 71)
            
            if vehicle ~= 0 then
                SetVehicleDoorsLocked(vehicle, 1)
                SetVehicleDoorsLockedForAllPlayers(vehicle, false)
                ESX.ShowNotification('Vehículo desbloqueado')
            else
                ESX.ShowNotification('No hay vehículo cerca')
                response.success = false
            end
        end
        
        -- Cerrar menú después de ejecutar la acción
        if shouldClose and response.success then
            SetNuiFocus(false, false)
            isMenuOpen = false
            SendNUIMessage({action = 'forceClose'})
        end
        
        cb(response)
    end, action)
end)

-- ========== EVENTOS DEL SERVIDOR ==========

-- Recibir estado de duty desde el servidor
RegisterNetEvent('ax_staff:updateDuty', function(duty)
    isOnDuty = duty
    SendNUIMessage({
        action = 'updateDuty',
        duty = duty
    })
    
    if duty then
        ESX.ShowNotification('Entraste en servicio de staff', 'success')
    else
        ESX.ShowNotification('Saliste de servicio de staff', 'info')
    end
end)

-- Recibir mensaje del chat
RegisterNetEvent('ax_staff:receiveChatMessage', function(messageData)
    SendNUIMessage({
        action = 'addChatMessage',
        data = messageData
    })
end)

-- Limpiar chat
RegisterNetEvent('ax_staff:clearChatMessages', function()
    SendNUIMessage({
        action = 'clearChat'
    })
end)

-- ========== FUNCIONES ==========

-- Toggle blips de jugadores
function TogglePlayerBlips()
    if blipsEnabled then
        CreateThread(function()
            while blipsEnabled do
                local players = ESX.Game.GetPlayers()
                
                for _, playerId in ipairs(players) do
                    if playerId ~= PlayerId() then
                        local ped = GetPlayerPed(playerId)
                        local coords = GetEntityCoords(ped)
                        
                        if not playerBlips[playerId] then
                            local blip = AddBlipForCoord(coords.x, coords.y, coords.z)
                            SetBlipSprite(blip, 1)
                            SetBlipScale(blip, 0.8)
                            SetBlipColour(blip, 0)
                            SetBlipAsShortRange(blip, true)
                            BeginTextCommandSetBlipName("STRING")
                            AddTextComponentString("ID: " .. GetPlayerServerId(playerId))
                            EndTextCommandSetBlipName(blip)
                            playerBlips[playerId] = blip
                        else
                            SetBlipCoords(playerBlips[playerId], coords.x, coords.y, coords.z)
                        end
                    end
                end
                
                Wait(1000)
            end
        end)
    else
        for _, blip in pairs(playerBlips) do
            RemoveBlip(blip)
        end
        playerBlips = {}
    end
end

-- Mostrar tags de IDs
CreateThread(function()
    while true do
        Wait(0)
        
        if tagsEnabled then
            local players = ESX.Game.GetPlayers()
            
            for _, playerId in ipairs(players) do
                if playerId ~= PlayerId() then
                    local ped = GetPlayerPed(playerId)
                    local coords = GetEntityCoords(ped)
                    local serverId = GetPlayerServerId(playerId)
                    
                    DrawText3D(coords.x, coords.y, coords.z + 1.0, "[" .. serverId .. "]")
                end
            end
        else
            Wait(500)
        end
    end
end)

-- Función para dibujar texto 3D
function DrawText3D(x, y, z, text)
    local onScreen, _x, _y = World3dToScreen2d(x, y, z)
    local px, py, pz = table.unpack(GetGameplayCamCoords())
    
    SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(255, 255, 255, 215)
    SetTextEntry("STRING")
    SetTextCentre(1)
    AddTextComponentString(text)
    DrawText(_x, _y)
end

-- ========== TAB ITEMS ==========

-- Obtener items del inventario
RegisterNUICallback('getInventoryItems', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getInventoryItems', function(items)
        cb(items)
    end)
end)

-- Obtener jugadores online
RegisterNUICallback('getOnlinePlayers', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getOnlinePlayers', function(players)
        cb(players)
    end)
end)

-- Dar items
RegisterNUICallback('giveItems', function(data, cb)
    TriggerServerEvent('ax_staff:giveItems', data)
    cb('ok')
end)

-- Cerrar menú con ESC
CreateThread(function()
    while true do
        Wait(0)
        if isMenuOpen then
            DisableControlAction(0, 322, true)
        end
    end
end)

-- ========== TAB VEHICULOS ==========

-- Obtener vehículos de facciones
RegisterNUICallback('getFactionVehicles', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getFactionVehicles', function(vehicles)
        cb(vehicles)
    end)
end)

-- Spawnear vehículo de facción
RegisterNUICallback('spawnFactionVehicle', function(data, cb)
    TriggerServerEvent('ax_staff:spawnFactionVehicle', data.vehicleName)
    cb('ok')
end)

-- Spawnear vehículo personalizado
RegisterNUICallback('spawnCustomVehicle', function(data, cb)
    TriggerServerEvent('ax_staff:spawnCustomVehicle', data.vehicleName)
    cb('ok')
end)

-- Dar vehículo a jugador
RegisterNUICallback('giveVehicleToPlayer', function(data, cb)
    TriggerServerEvent('ax_staff:giveVehicleToPlayer', data.vehicleName, data.playerId)
    cb('ok')
end)

-- Spawnear vehículo (cliente)
RegisterNetEvent('ax_staff:spawnVehicleClient', function(vehicleName, plate, giveKeys)
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local heading = GetEntityHeading(playerPed)
    
    -- Calcular posición frontal
    local forwardVector = GetEntityForwardVector(playerPed)
    local spawnCoords = vector3(
        coords.x + forwardVector.x * 5.0,
        coords.y + forwardVector.y * 5.0,
        coords.z
    )
    
    -- Cargar modelo
    local modelHash = GetHashKey(vehicleName)
    
    if not IsModelInCdimage(modelHash) then
        ESX.ShowNotification('Modelo de vehículo no válido')
        return
    end
    
    RequestModel(modelHash)
    while not HasModelLoaded(modelHash) do
        Wait(100)
    end
    
    -- Crear vehículo
    local vehicle = CreateVehicle(modelHash, spawnCoords.x, spawnCoords.y, spawnCoords.z, heading, true, false)
    
    SetVehicleNumberPlateText(vehicle, plate)
    SetVehicleOnGroundProperly(vehicle)
    SetVehicleDirtLevel(vehicle, 0.0)
    SetVehicleEngineOn(vehicle, true, true, false)
    SetVehRadioStation(vehicle, 'OFF')
    
    -- Dar llaves si es necesario
    if giveKeys then
        exports.wasabi_carlock:GiveKey(plate)
    end
    
    ESX.ShowNotification('Vehículo spawneado - Placa: ' .. plate)
    
    SetModelAsNoLongerNeeded(modelHash)
    
    -- Cerrar menú
    SetNuiFocus(false, false)
    isMenuOpen = false
    SendNUIMessage({action = 'forceClose'})
end)

-- Dar llaves de vehículo (sin spawn)
RegisterNetEvent('ax_staff:giveVehicleKeys', function(plate)
    exports.wasabi_carlock:GiveKey(plate)
end)

-- ========== TAB USUARIOS ==========

local savedPlayerPositions = {}
local isSpectating = false
local spectatingTarget = nil
local isFrozen = false

-- Obtener jugadores online
RegisterNUICallback('getOnlinePlayersDetailed', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getOnlinePlayersDetailed', function(players)
        cb(players)
    end)
end)

-- Obtener info de jugador
RegisterNUICallback('getPlayerInfo', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getPlayerInfo', function(info)
        cb(info)
    end, data.playerId)
end)

-- Obtener vehículos del jugador
RegisterNUICallback('getPlayerVehicles', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getPlayerVehicles', function(vehicles)
        cb(vehicles)
    end, data.identifier)
end)

-- Cambiar garage
RegisterNUICallback('changeVehicleGarage', function(data, cb)
    TriggerServerEvent('ax_staff:changeVehicleGarage', data.plate, data.garage)
    cb('ok')
end)

-- Eliminar vehículo
RegisterNUICallback('deleteVehicle', function(data, cb)
    TriggerServerEvent('ax_staff:deleteVehicle', data.plate, data.identifier)
    cb('ok')
end)

-- Obtener garajes
RegisterNUICallback('getGarages', function(data, cb)
    cb(Config.Garages)
end)

-- Espectar jugador
RegisterNUICallback('spectatePlayer', function(data, cb)
    local targetId = data.playerId
    
    if isSpectating and spectatingTarget == targetId then
        -- Dejar de espectar
        isSpectating = false
        spectatingTarget = nil
        
        local playerPed = PlayerPedId()
        SetEntityVisible(playerPed, true, 0)
        SetEntityCollision(playerPed, true, true)
        FreezeEntityPosition(playerPed, false)
        
        cb({spectating = false})
    else
        -- Empezar a espectar
        isSpectating = true
        spectatingTarget = targetId
        
        local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
        local playerPed = PlayerPedId()
        
        SetEntityVisible(playerPed, false, 0)
        SetEntityCollision(playerPed, false, false)
        FreezeEntityPosition(playerPed, true)
        
        CreateThread(function()
            while isSpectating and spectatingTarget == targetId do
                local target = GetPlayerPed(GetPlayerFromServerId(targetId))
                local coords = GetEntityCoords(target)
                SetEntityCoords(playerPed, coords.x, coords.y, coords.z + 10.0)
                Wait(0)
            end
        end)
        
        ESX.ShowNotification('Espectando al jugador ID: ' .. targetId)
        cb({spectating = true})
    end
end)

-- Traer jugador
RegisterNUICallback('bringPlayer', function(data, cb)
    TriggerServerEvent('ax_staff:bringPlayer', data.playerId)
    cb('ok')
end)

RegisterNetEvent('ax_staff:bringPlayerClient', function(targetId)
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    
    -- Guardar posición del jugador traído
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    local targetCoords = GetEntityCoords(targetPed)
    savedPlayerPositions[targetId] = targetCoords
    
    -- Traer jugador
    TriggerServerEvent('ax_staff:teleportPlayer', targetId, coords)
end)

RegisterNetEvent('ax_staff:teleportPlayer', function(coords)
    SetEntityCoords(PlayerPedId(), coords.x, coords.y, coords.z)
end)

-- Evento en server.lua para teleportar
RegisterNetEvent('ax_staff:teleportPlayer', function(targetId, coords)
    TriggerClientEvent('ax_staff:setPlayerCoords', targetId, coords)
end)

RegisterNetEvent('ax_staff:setPlayerCoords', function(coords)
    SetEntityCoords(PlayerPedId(), coords.x, coords.y, coords.z)
end)

-- Devolver jugador
RegisterNUICallback('returnPlayer', function(data, cb)
    TriggerServerEvent('ax_staff:returnPlayer', data.playerId)
    cb('ok')
end)

RegisterNetEvent('ax_staff:returnPlayerClient', function()
    local playerId = GetPlayerServerId(PlayerId())
    if savedPlayerPositions[playerId] then
        local coords = savedPlayerPositions[playerId]
        SetEntityCoords(PlayerPedId(), coords.x, coords.y, coords.z)
        savedPlayerPositions[playerId] = nil
        ESX.ShowNotification('Has sido devuelto a tu posición anterior')
    end
end)

-- Ir al jugador
RegisterNUICallback('gotoPlayer', function(data, cb)
    TriggerServerEvent('ax_staff:gotoPlayer', data.playerId)
    cb('ok')
end)

RegisterNetEvent('ax_staff:gotoPlayerClient', function(targetId)
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    local coords = GetEntityCoords(targetPed)
    SetEntityCoords(PlayerPedId(), coords.x, coords.y, coords.z)
    ESX.ShowNotification('Teletransportado al jugador')
end)

-- Matar jugador
RegisterNUICallback('killPlayer', function(data, cb)
    TriggerServerEvent('ax_staff:killPlayer', data.playerId)
    cb('ok')
end)

RegisterNetEvent('ax_staff:killPlayerClient', function()
    SetEntityHealth(PlayerPedId(), 0)
end)

-- Revivir jugador
RegisterNUICallback('revivePlayerTarget', function(data, cb)
    TriggerServerEvent('ax_staff:revivePlayerTarget', data.playerId)
    cb('ok')
end)

-- Cambiar skin
RegisterNUICallback('changeSkinPlayer', function(data, cb)
    TriggerServerEvent('ax_staff:changeSkinPlayer', data.playerId)
    cb('ok')
end)

RegisterNetEvent('ax_staff:openSkinMenu', function()
    ExecuteCommand('pedmenu')
end)

-- Congelar jugador
RegisterNUICallback('freezePlayer', function(data, cb)
    TriggerServerEvent('ax_staff:freezePlayer', data.playerId)
    cb('ok')
end)

RegisterNetEvent('ax_staff:freezePlayerClient', function()
    isFrozen = not isFrozen
    FreezeEntityPosition(PlayerPedId(), isFrozen)
    
    if isFrozen then
        ESX.ShowNotification('Has sido congelado por un administrador')
    else
        ESX.ShowNotification('Has sido descongelado')
    end
end)

-- Limpiar inventario
RegisterNUICallback('clearInventory', function(data, cb)
    TriggerServerEvent('ax_staff:clearInventory', data.playerId)
    cb('ok')
end)

-- Ver inventario
RegisterNUICallback('viewInventory', function(data, cb)
    -- Cerrar menú
    SetNuiFocus(false, false)
    isMenuOpen = false
    SendNUIMessage({action = 'forceClose'})
    
    -- Abrir inventario del jugador
    exports.ox_inventory:openInventory('player', data.playerId)
    cb('ok')
end)

-- Obtener propiedades del jugador
RegisterNUICallback('getPlayerProperties', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getPlayerProperties', function(properties)
        cb(properties)
    end, data.identifier)
end)

-- Obtener crypto del jugador
RegisterNUICallback('getPlayerCrypto', function(data, cb)
    ESX.TriggerServerCallback('ax_staff:getPlayerCrypto', function(crypto)
        cb(crypto)
    end, data.identifier)
end)

-- Eliminar propiedad
RegisterNUICallback('removeProperty', function(data, cb)
    TriggerServerEvent('ax_staff:removeProperty', data.house, data.identifier)
    cb('ok')
end)