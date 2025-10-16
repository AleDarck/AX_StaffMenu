let isOnDuty = false;

// Escuchar mensajes desde Lua
window.addEventListener('message', function(event) {
    const data = event.data;
    
    if (data.action === 'openMenu') {
        document.getElementById('staffMenu').style.display = 'flex';
        isOnDuty = data.duty || false;
        updateDutyButton();
        checkDutyAccess(); // Agregar esta línea
        loadServerInfo();
    } else if (data.action === 'updateDuty') {
        isOnDuty = data.duty;
        updateDutyButton();
    } else if (data.action === 'updateStaffCount') {
        const staffCount = document.getElementById('staffActiveCount');
        if (staffCount) {
            staffCount.textContent = data.count;
        }
    }
});

// Cerrar menú
function closeMenu() {
    document.getElementById('staffMenu').style.display = 'none';
    fetch(`https://${GetParentResourceName()}/closeMenu`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
}

// Botón cerrar
document.getElementById('closeBtn').addEventListener('click', closeMenu);

// Cerrar con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMenu();
    }
});

// Cerrar al hacer clic fuera del menú
document.getElementById('staffMenu').addEventListener('click', function(event) {
    if (event.target.id === 'staffMenu') {
        closeMenu();
    }
});

// Actualizar botón de duty
function updateDutyButton() {
    const dutyBtn = document.getElementById('dutyBtn');
    const dutyText = document.getElementById('dutyText');
    
    if (isOnDuty) {
        dutyBtn.classList.add('active');
        dutyText.textContent = 'SALIR DE SERVICIO';
    } else {
        dutyBtn.classList.remove('active');
        dutyText.textContent = 'ENTRAR EN SERVICIO';
    }
    
    checkDutyAccess(); // Agregar esta línea
}

// Verificar si el contenido debe estar bloqueado
function checkDutyAccess() {
    const allTabs = document.querySelectorAll('.tab-content');
    const dutyOverlay = document.getElementById('dutyOverlay');
    
    if (!isOnDuty) {
        // Crear overlay si no existe
        if (!dutyOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'dutyOverlay';
            overlay.className = 'duty-overlay';
            overlay.innerHTML = `
                <div class="duty-overlay-content">
                    <i class="fas fa-lock"></i>
                    <h3>DEBES ESTAR EN SERVICIO</h3>
                    <p>Entra en servicio para acceder a las funciones del staff</p>
                </div>
            `;
            document.querySelector('.menu-content').appendChild(overlay);
        }
    } else {
        // Remover overlay si existe
        if (dutyOverlay) {
            dutyOverlay.remove();
        }
    }
}

// Sistema de Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        
        // Remover clase active de todos los botones y contenidos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Agregar clase active al botón clickeado y su contenido
        this.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
});

// Cargar información del servidor
function loadServerInfo() {
    fetch(`https://${GetParentResourceName()}/getServerInfo`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(data => {
        // Actualizar stats del tab inicio
        const staffCount = document.getElementById('staffActiveCount');
        const playersCount = document.getElementById('playersOnlineCount');
        
        if (staffCount) {
            staffCount.textContent = data.staffOnDuty || 0;
        }
        if (playersCount) {
            playersCount.textContent = data.playerCount || 0;
        }
    }).catch(error => {
        console.log('Esperando datos del servidor...');
    });
}

// Función auxiliar para obtener el nombre del recurso
function GetParentResourceName() {
    return 'AX_StaffMenu'; // Nombre exacto de tu carpeta del recurso (en minúsculas)
}

// Cargar mensajes del chat al abrir
function loadChatMessages() {
    fetch(`https://${GetParentResourceName()}/loadChatMessages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => {
        if (!response.ok) {
            return [];
        }
        return response.json();
    })
    .then(messages => {
        // AGREGAR ESTA LÍNEA PARA LIMPIAR ANTES DE CARGAR:
        document.getElementById('chatMessages').innerHTML = '';
        
        if (messages && messages.length > 0) {
            messages.forEach(msg => addChatMessage(msg));
        }
    }).catch(error => {
        console.log('No hay mensajes en el chat aún');
    });
}

// Agregar mensaje al chat
function addChatMessage(data) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    messageDiv.innerHTML = `
        <div class="chat-message-header">
            <span class="chat-player-name">${data.name}</span>
            <span class="chat-player-rank ${data.rank.toLowerCase()}">${data.rank.toUpperCase()}</span>
            <span class="chat-message-time">${data.time}</span>
        </div>
        <div class="chat-message-text">${data.message}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enviar mensaje
document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    fetch(`https://${GetParentResourceName()}/sendChatMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: message})
    });
    
    input.value = '';
}

// Limpiar chat
document.getElementById('clearChatBtn').addEventListener('click', function() {
    fetch(`https://${GetParentResourceName()}/clearChat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    });
});

// Botones de acciones rápidas
document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        
        fetch(`https://${GetParentResourceName()}/quickAction`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: action})
        }).then(response => response.json())
        .then(data => {
            if (data.success && data.active !== undefined) {
                if (data.active) {
                    this.classList.add('active');
                } else {
                    this.classList.remove('active');
                }
            }
        });
    });
});

// Actualizar en el listener de mensajes
window.addEventListener('message', function(event) {
    const data = event.data;
    
    if (data.action === 'openMenu') {
        document.getElementById('staffMenu').style.display = 'flex';
        isOnDuty = data.duty || false;
        updateDutyButton();
        checkDutyAccess();
        loadServerInfo();
        loadChatMessages();
    } else if (data.action === 'updateDuty') {
        isOnDuty = data.duty;
        updateDutyButton();
    } else if (data.action === 'addChatMessage') {
        addChatMessage(data.data);
    } else if (data.action === 'clearChat') {
        document.getElementById('chatMessages').innerHTML = '';
    } else if (data.action === 'forceClose') {
        document.getElementById('staffMenu').style.display = 'none';
    } else if (data.action === 'openReportModal') {
        // MODIFICAR ESTA PARTE
        const reportModal = document.getElementById('reportModal');
        reportModal.style.display = 'flex';
        setTimeout(() => {
            reportModal.classList.add('active');
        }, 10);
        document.getElementById('reportReason').value = '';
        document.getElementById('reportDescription').value = '';
        updateCharCount();
    } else if (data.action === 'newReport') {
        if (document.querySelector('[data-tab="reportes"]').classList.contains('active')) {
            loadReports();
        }
    } else if (data.action === 'refreshReports') {
        if (document.querySelector('[data-tab="reportes"]').classList.contains('active')) {
            loadReports();
        }
    }
});

// Toggle duty - Nueva versión con debug
document.addEventListener('DOMContentLoaded', function() {
    const dutyBtn = document.getElementById('dutyBtn');
    
    if (dutyBtn) {
        dutyBtn.addEventListener('click', function() {
            console.log('Botón de duty presionado');
            
            fetch(`https://${GetParentResourceName()}/toggleDuty`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }).then(() => {
                console.log('Petición enviada');
            }).catch(err => {
                console.log('Error:', err);
            });
        });
    } else {
        console.log('ERROR: No se encontró el botón dutyBtn');
    }
});

// ========== TAB ITEMS ==========

let allItems = [];
let filteredItems = [];
let selectedItems = {};
let selectedPlayers = [];
let currentPage = 1;
const itemsPerPage = 24; // 4 filas x 6 columnas

// Cargar items cuando se abre el tab
document.querySelector('[data-tab="items"]').addEventListener('click', function() {
    loadInventoryItems();
    loadOnlinePlayers();
});

// Cargar items del inventario
function loadInventoryItems() {
    fetch(`https://${GetParentResourceName()}/getInventoryItems`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(items => {
        allItems = items;
        filteredItems = items;
        currentPage = 1;
        displayItemsPage();
        updatePagination();
    });
}

// Mostrar items de la página actual
function displayItemsPage() {
    const itemsGrid = document.getElementById('itemsGrid');
    itemsGrid.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredItems.slice(startIndex, endIndex);
    
    pageItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.dataset.itemName = item.name;
        
        if (selectedItems[item.name]) {
            itemCard.classList.add('selected');
        }
        
        itemCard.innerHTML = `
            <img src="nui://ox_inventory/web/images/${item.name}.png" 
                 onerror="this.src='https://via.placeholder.com/60x60?text=NO+IMG'" 
                 alt="${item.label}">
            <span class="item-card-name">${item.label}</span>
        `;
        
        itemCard.addEventListener('click', () => toggleItemSelection(item));
        itemsGrid.appendChild(itemCard);
    });
}

// Actualizar paginación
function updatePagination() {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Botón anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayItemsPage();
            updatePagination();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Números de página
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Ajustar para mostrar siempre 5 páginas si es posible
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        pageBtn.textContent = i;
        
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayItemsPage();
            updatePagination();
        });
        
        paginationContainer.appendChild(pageBtn);
    }
    
    // Botón siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayItemsPage();
            updatePagination();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Buscar items
document.getElementById('itemSearchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    filteredItems = allItems.filter(item => 
        item.label.toLowerCase().includes(searchTerm) || 
        item.name.toLowerCase().includes(searchTerm)
    );
    
    currentPage = 1;
    displayItemsPage();
    updatePagination();
});

// Seleccionar/Deseleccionar item
function toggleItemSelection(item) {
    if (selectedItems[item.name]) {
        delete selectedItems[item.name];
    } else {
        selectedItems[item.name] = {
            name: item.name,
            label: item.label,
            quantity: 1
        };
    }
    
    updateSelectedItemsList();
    
    // Actualizar visual en el grid
    const itemCard = document.querySelector(`[data-item-name="${item.name}"]`);
    if (itemCard) {
        itemCard.classList.toggle('selected');
    }
}

// Actualizar lista de items seleccionados
function updateSelectedItemsList() {
    const list = document.getElementById('selectedItemsList');
    
    if (Object.keys(selectedItems).length === 0) {
        list.innerHTML = '<p class="empty-message">No hay items seleccionados</p>';
        return;
    }
    
    list.innerHTML = '';
    
    for (let itemName in selectedItems) {
        const item = selectedItems[itemName];
        
        const row = document.createElement('div');
        row.className = 'selected-item-row';
        
        row.innerHTML = `
            <div class="selected-item-info">
                <img src="nui://ox_inventory/web/images/${item.name}.png" 
                     onerror="this.src='https://via.placeholder.com/35x35?text=NO+IMG'">
                <span class="selected-item-name">${item.label}</span>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn minus-btn" data-item="${item.name}">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" class="quantity-input" value="${item.quantity}" 
                       min="1" data-item="${item.name}">
                <button class="quantity-btn plus-btn" data-item="${item.name}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <button class="remove-item-btn" data-item="${item.name}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        list.appendChild(row);
    }
    
    // Event listeners para los controles
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemName = this.dataset.item;
            if (selectedItems[itemName].quantity > 1) {
                selectedItems[itemName].quantity--;
                updateSelectedItemsList();
            }
        });
    });
    
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemName = this.dataset.item;
            selectedItems[itemName].quantity++;
            updateSelectedItemsList();
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const itemName = this.dataset.item;
            let value = parseInt(this.value) || 1;
            if (value < 1) value = 1;
            selectedItems[itemName].quantity = value;
            this.value = value;
        });
    });
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemName = this.dataset.item;
            delete selectedItems[itemName];
            updateSelectedItemsList();
            
            // Actualizar visual en todas las páginas
            displayItemsPage();
        });
    });
}

// ========== DROPDOWN DE JUGADORES ==========

// Cargar jugadores online
function loadOnlinePlayers() {
    fetch(`https://${GetParentResourceName()}/getOnlinePlayers`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(players => {
        displayPlayersDropdown(players);
    });
}

// Mostrar jugadores en dropdown
function displayPlayersDropdown(players) {
    const dropdownList = document.getElementById('dropdownList');
    dropdownList.innerHTML = '';
    
    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = `[${player.id}] ${player.name}`;
        item.dataset.playerId = player.id;
        item.dataset.playerName = player.name;
        
        item.addEventListener('click', () => selectPlayerForItems(player)); // CAMBIAR AQUÍ
        dropdownList.appendChild(item);
    });
}

// Toggle dropdown
document.getElementById('dropdownHeader').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('dropdownList').classList.toggle('active');
});

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('playersDropdown');
    if (!dropdown.contains(e.target)) {
        document.getElementById('dropdownHeader').classList.remove('active');
        document.getElementById('dropdownList').classList.remove('active');
    }
});

// Seleccionar jugador (para el dropdown de items)
function selectPlayerForItems(player) {
    if (!selectedPlayers.find(p => p.id === player.id)) {
        selectedPlayers.push(player);
        updateSelectedPlayersList();
    }
    
    // Cerrar dropdown
    document.getElementById('dropdownHeader').classList.remove('active');
    document.getElementById('dropdownList').classList.remove('active');
}

// Actualizar lista de jugadores seleccionados
function updateSelectedPlayersList() {
    const list = document.getElementById('selectedPlayersList');
    
    if (selectedPlayers.length === 0) {
        list.innerHTML = '<p class="empty-message">No hay jugadores seleccionados</p>';
        return;
    }
    
    list.innerHTML = '';
    
    selectedPlayers.forEach(player => {
        const item = document.createElement('div');
        item.className = 'selected-player-item';
        
        item.innerHTML = `
            <span class="selected-player-info">[${player.id}] ${player.name}</span>
            <button class="remove-player-btn" data-player-id="${player.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        list.appendChild(item);
    });
    
    // Event listeners para remover
    document.querySelectorAll('.remove-player-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const playerId = parseInt(this.dataset.playerId);
            selectedPlayers = selectedPlayers.filter(p => p.id !== playerId);
            updateSelectedPlayersList();
        });
    });
}

// Botón entregar items
document.getElementById('giveItemsBtn').addEventListener('click', function() {
    if (Object.keys(selectedItems).length === 0) {
        console.log('No hay items seleccionados');
        return;
    }
    
    if (selectedPlayers.length === 0) {
        console.log('No hay jugadores seleccionados');
        return;
    }
    
    const itemsArray = Object.values(selectedItems);
    const playersArray = selectedPlayers.map(p => p.id);
    
    fetch(`https://${GetParentResourceName()}/giveItems`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            items: itemsArray,
            players: playersArray
        })
    });
    
    // Limpiar selecciones
    selectedItems = {};
    selectedPlayers = [];
    updateSelectedItemsList();
    updateSelectedPlayersList();
    displayItemsPage();
});

// ========== TAB VEHICULOS ==========

let factionVehicles = {};
let selectedCategory = null;
let categoryOrder = []; // Para mantener el orden del config

// Cargar vehículos cuando se abre el tab
document.querySelector('[data-tab="vehiculos"]').addEventListener('click', function() {
    loadFactionVehicles();
});

// Cargar vehículos de facciones
function loadFactionVehicles() {
    fetch(`https://${GetParentResourceName()}/getFactionVehicles`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(vehicles => {
        factionVehicles = vehicles;
        categoryOrder = Object.keys(vehicles); // Mantener orden del config
        displayFactionTabs();
    });
}

// Mostrar tabs de categorías
function displayFactionTabs() {
    const container = document.getElementById('factionTabs');
    container.innerHTML = '';
    
    categoryOrder.forEach((category, index) => {
        const btn = document.createElement('button');
        btn.className = 'faction-tab-btn';
        btn.textContent = category;
        
        btn.addEventListener('click', () => {
            // Remover active de todos
            document.querySelectorAll('.faction-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            selectedCategory = category;
            displayCategoryVehicles(category);
        });
        
        container.appendChild(btn);
        
        // Seleccionar primera categoría por defecto
        if (index === 0) {
            btn.classList.add('active');
            selectedCategory = category;
            displayCategoryVehicles(category);
        }
    });
}

// Mostrar vehículos de la categoría seleccionada
function displayCategoryVehicles(category) {
    const grid = document.getElementById('factionVehiclesGrid');
    grid.innerHTML = '';
    
    const vehicles = factionVehicles[category];
    
    if (!vehicles || vehicles.length === 0) {
        grid.innerHTML = '<p class="empty-message">No hay vehículos en esta categoría</p>';
        return;
    }
    
    vehicles.forEach(vehicle => {
        const card = document.createElement('div');
        card.className = 'faction-vehicle-card';
        
        card.innerHTML = `
            <div class="faction-vehicle-icon">
                <i class="fas fa-car"></i>
            </div>
            <div class="faction-vehicle-info">
                <span class="faction-vehicle-label">${vehicle.label}</span>
                <span class="faction-vehicle-name">${vehicle.name}</span>
            </div>
            <button class="faction-vehicle-spawn-btn" data-vehicle="${vehicle.name}">
                <i class="fas fa-plus-circle"></i>
                <span>SPAWN</span>
            </button>
        `;
        
        grid.appendChild(card);
    });
    
    // Event listeners para botones de spawn
    document.querySelectorAll('.faction-vehicle-spawn-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const vehicleName = this.dataset.vehicle;
            spawnFactionVehicle(vehicleName);
        });
    });
}

// Spawnear vehículo de facción
function spawnFactionVehicle(vehicleName) {
    fetch(`https://${GetParentResourceName()}/spawnFactionVehicle`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({vehicleName: vehicleName})
    });
}

// Spawnear vehículo personalizado
document.getElementById('spawnVehicleBtn').addEventListener('click', function() {
    const vehicleName = document.getElementById('spawnVehicleInput').value.trim();
    
    if (vehicleName === '') {
        console.log('Debes ingresar un nombre de vehículo');
        return;
    }
    
    fetch(`https://${GetParentResourceName()}/spawnCustomVehicle`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({vehicleName: vehicleName})
    });
    
    document.getElementById('spawnVehicleInput').value = '';
});

// Enter para spawnear vehículo
document.getElementById('spawnVehicleInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('spawnVehicleBtn').click();
    }
});

// Dar vehículo a jugador
document.getElementById('giveVehicleBtn').addEventListener('click', function() {
    const vehicleName = document.getElementById('giveVehicleName').value.trim();
    const playerId = document.getElementById('giveVehiclePlayerId').value.trim();
    
    if (vehicleName === '' || playerId === '') {
        console.log('Debes completar ambos campos');
        return;
    }
    
    const playerIdNum = parseInt(playerId);
    
    if (isNaN(playerIdNum)) {
        console.log('ID de jugador inválido');
        return;
    }
    
    fetch(`https://${GetParentResourceName()}/giveVehicleToPlayer`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            vehicleName: vehicleName,
            playerId: playerIdNum
        })
    });
    
    document.getElementById('giveVehicleName').value = '';
    document.getElementById('giveVehiclePlayerId').value = '';
});

// Enter para dar vehículo
document.getElementById('giveVehiclePlayerId').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('giveVehicleBtn').click();
    }
});

// ========== TAB USUARIOS ==========

let currentSelectedPlayer = null;
let selectedPlayerData = null;

// Cargar jugadores cuando se abre el tab
document.querySelector('[data-tab="usuarios"]').addEventListener('click', function() {
    loadOnlinePlayersDetailed();
});

// Cargar jugadores online
function loadOnlinePlayersDetailed() {
    fetch(`https://${GetParentResourceName()}/getOnlinePlayersDetailed`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(players => {
        displayPlayersList(players);
    });
}

// Mostrar lista de jugadores
function displayPlayersList(players) {
    const list = document.getElementById('playersList');
    list.innerHTML = '';
    
    if (players.length === 0) {
        list.innerHTML = '<p class="empty-message">No hay jugadores conectados</p>';
        return;
    }
    
    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-list-item';
        item.dataset.playerId = player.id;
        
        if (currentSelectedPlayer === player.id) {
            item.classList.add('selected');
        }
        
        item.innerHTML = `
            <div class="player-id-badge">${player.id}</div>
            <div class="player-list-name">${player.name}</div>
        `;
        
        item.addEventListener('click', () => selectPlayerInUsersTab(player.id)); // CAMBIAR AQUÍ
        list.appendChild(item);
    });
}

// Seleccionar jugador (para el tab usuarios)
function selectPlayerInUsersTab(playerId) {
    currentSelectedPlayer = playerId;
    
    // Actualizar visual
    document.querySelectorAll('#playersList .player-list-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`#playersList [data-player-id="${playerId}"]`)?.classList.add('selected');
    
    // Cargar información del jugador
    loadPlayerInfo(playerId);
}

// Cargar información del jugador
function loadPlayerInfo(playerId) {
    fetch(`https://${GetParentResourceName()}/getPlayerInfo`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({playerId: playerId})
    }).then(response => response.json())
    .then(info => {
        if (info) {
            selectedPlayerData = info;
            displayPlayerPanel(info);
            loadPlayerVehicles(info.identifier);
            loadPlayerProperties(info.identifier); // Agregar esta línea
            loadPlayerCrypto(info.identifier); // Agregar esta línea
        }
    });
}

// Mostrar panel de jugador
function displayPlayerPanel(info) {
    const panel = document.getElementById('playerPanelContent');
    
    panel.innerHTML = `
        <!-- Info Grid -->
        <div class="player-info-grid">
            <div class="player-info-item">
                <div class="player-info-label">NOMBRE IC</div>
                <div class="player-info-value">${info.firstname} ${info.lastname}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">BANK</div>
                <div class="player-info-value money">$${formatNumber(info.bank)}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">CASH</div>
                <div class="player-info-value money">$${formatNumber(info.cash)}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">VICOIN</div>
                <div class="player-info-value money">${formatNumber(info.vicoin)}</div>
            </div>
            <div class="player-info-item" style="grid-column: span 2;">
                <div class="player-info-label">LICENCIA</div>
                <div class="player-info-value" style="font-size: 12px;">${info.identifier}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">TRABAJO</div>
                <div class="player-info-value">${info.job}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">GRADO</div>
                <div class="player-info-value">${info.job_grade}</div>
            </div>
        </div>
        
        <!-- Acciones Rápidas -->
        <div class="player-actions-section">
            <div class="player-actions-title">ACCIONES RÁPIDAS</div>
            <div class="player-actions-grid">
                <button class="player-action-btn" data-action="spectate">
                    <i class="fas fa-eye"></i>
                    <span>ESPECTAR</span>
                </button>
                <button class="player-action-btn" data-action="bring">
                    <i class="fas fa-hand-point-down"></i>
                    <span>TRAER</span>
                </button>
                <button class="player-action-btn" data-action="return">
                    <i class="fas fa-undo"></i>
                    <span>REGRESAR</span>
                </button>
                <button class="player-action-btn danger" data-action="kill">
                    <i class="fas fa-skull"></i>
                    <span>MATAR</span>
                </button>
                <button class="player-action-btn" data-action="revive">
                    <i class="fas fa-heart"></i>
                    <span>REVIVIR</span>
                </button>
                <button class="player-action-btn" data-action="skin">
                    <i class="fas fa-user"></i>
                    <span>SKIN</span>
                </button>
                <button class="player-action-btn" data-action="goto">
                    <i class="fas fa-location-arrow"></i>
                    <span>TP AL JUGADOR</span>
                </button>
                <button class="player-action-btn" data-action="freeze">
                    <i class="fas fa-snowflake"></i>
                    <span>CONGELAR</span>
                </button>
                <button class="player-action-btn danger" data-action="clearinv">
                    <i class="fas fa-trash"></i>
                    <span>LIMPIAR INV</span>
                </button>
                <button class="player-action-btn" data-action="viewinv">
                    <i class="fas fa-boxes"></i>
                    <span>VER INVENTARIO</span>
                </button>
            </div>
        </div>
        
        <!-- Vehículos -->
        <div class="player-vehicles-section">
            <div class="player-vehicles-title">VEHÍCULOS</div>
            <div class="player-vehicles-list" id="playerVehiclesList">
                <p class="empty-message">Cargando vehículos...</p>
            </div>
        </div>
        <!-- Propiedades -->
        <div class="player-properties-section">
            <div class="player-properties-title">PROPIEDADES</div>
            <div class="player-properties-list" id="playerPropertiesList">
                <p class="empty-message">Cargando propiedades...</p>
            </div>
        </div>
        
        <!-- Crypto Wallet -->
        <div class="player-crypto-section">
            <div class="player-crypto-title">CRYPTO WALLET</div>
            <div class="player-crypto-list" id="playerCryptoList">
                <p class="empty-message">Cargando cryptos...</p>
            </div>
        </div>
    `;
    
    // Event listeners para acciones
    document.querySelectorAll('.player-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            handlePlayerAction(action, info.id);
        });
    });
}

// Manejar acciones de jugador
function handlePlayerAction(action, playerId) {
    const actions = {
        spectate: 'spectatePlayer',
        bring: 'bringPlayer',
        return: 'returnPlayer',
        kill: 'killPlayer',
        revive: 'revivePlayerTarget',
        skin: 'changeSkinPlayer',
        goto: 'gotoPlayer',
        freeze: 'freezePlayer',
        clearinv: 'clearInventory',
        viewinv: 'viewInventory'
    };
    
    const endpoint = actions[action];
    if (!endpoint) return;
    
    fetch(`https://${GetParentResourceName()}/${endpoint}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({playerId: playerId})
    }).then(response => response.json())
    .then(data => {
        if (action === 'spectate' && data.spectating !== undefined) {
            // Actualizar botón de espectador
            const btn = document.querySelector('[data-action="spectate"]');
            if (data.spectating) {
                btn.innerHTML = '<i class="fas fa-eye-slash"></i><span>DEJAR DE ESPECTAR</span>';
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            } else {
                btn.innerHTML = '<i class="fas fa-eye"></i><span>ESPECTAR</span>';
                btn.style.background = '';
            }
        }
    });
}

// Cargar vehículos del jugador
function loadPlayerVehicles(identifier) {
    fetch(`https://${GetParentResourceName()}/getPlayerVehicles`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(response => response.json())
    .then(vehicles => {
        displayPlayerVehicles(vehicles, identifier);
    });
}

// Mostrar vehículos del jugador
function displayPlayerVehicles(vehicles, identifier) {
    const list = document.getElementById('playerVehiclesList');
    
    if (!vehicles || vehicles.length === 0) {
        list.innerHTML = '<p class="empty-message">No tiene vehículos</p>';
        return;
    }
    
    list.innerHTML = '';
    
    vehicles.forEach(vehicle => {
        const item = document.createElement('div');
        item.className = 'vehicle-item';
        
        const parking = vehicle.parking || 'Sin garaje';
        const stored = vehicle.stored === 1 ? 'Guardado' : 'Fuera';
        
        item.innerHTML = `
            <div class="vehicle-item-info">
                <div class="vehicle-item-plate">${vehicle.plate}</div>
                <div class="vehicle-item-garage">${parking} - ${stored}</div>
            </div>
            <div class="vehicle-item-actions">
                <button class="vehicle-action-btn" data-plate="${vehicle.plate}">
                    <i class="fas fa-warehouse"></i> Mover
                </button>
                <button class="vehicle-action-btn delete" data-plate="${vehicle.plate}" data-identifier="${identifier}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    // Event listeners para mover
    document.querySelectorAll('.vehicle-action-btn:not(.delete)').forEach(btn => {
        btn.addEventListener('click', function() {
            const plate = this.dataset.plate;
            showGarageModal(plate);
        });
    });
    
    // Event listeners para eliminar
    document.querySelectorAll('.vehicle-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const plate = this.dataset.plate;
            const identifier = this.dataset.identifier;
            
            if (confirm(`¿Seguro que quieres eliminar el vehículo con placa ${plate}?`)) {
                deleteVehicle(plate, identifier);
            }
        });
    });
}

// Mostrar modal de garajes
function showGarageModal(plate) {
    // Crear modal si no existe
    let modal = document.getElementById('garageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'garageModal';
        modal.className = 'garage-modal';
        document.body.appendChild(modal);
    }
    
    // Cargar garajes
    fetch(`https://${GetParentResourceName()}/getGarages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(garages => {
        modal.innerHTML = `
            <div class="garage-modal-content">
                <h3 class="garage-modal-title">CAMBIAR GARAJE</h3>
                <select class="garage-select" id="garageSelect">
                    ${garages.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
                <div class="garage-modal-actions">
                    <button class="garage-modal-btn confirm" id="confirmGarage">CONFIRMAR</button>
                    <button class="garage-modal-btn cancel" id="cancelGarage">CANCELAR</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Event listeners
        document.getElementById('confirmGarage').addEventListener('click', () => {
            const newGarage = document.getElementById('garageSelect').value;
            changeVehicleGarage(plate, newGarage);
            modal.classList.remove('active');
        });
        
        document.getElementById('cancelGarage').addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });
}

// Cambiar garage de vehículo
function changeVehicleGarage(plate, garage) {
    fetch(`https://${GetParentResourceName()}/changeVehicleGarage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({plate: plate, garage: garage})
    }).then(() => {
        // Recargar vehículos
        if (selectedPlayerData) {
            loadPlayerVehicles(selectedPlayerData.identifier);
        }
    });
}

// Eliminar vehículo
function deleteVehicle(plate, identifier) {
    fetch(`https://${GetParentResourceName()}/deleteVehicle`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({plate: plate, identifier: identifier})
    }).then(() => {
        // Recargar vehículos
        if (selectedPlayerData) {
            loadPlayerVehicles(selectedPlayerData.identifier);
        }
    });
}

// Botón refrescar jugadores
document.getElementById('refreshPlayersBtn').addEventListener('click', function() {
    loadOnlinePlayersDetailed();
});

// Función para formatear números
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Cargar propiedades del jugador
function loadPlayerProperties(identifier) {
    fetch(`https://${GetParentResourceName()}/getPlayerProperties`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(response => response.json())
    .then(properties => {
        displayPlayerProperties(properties, identifier);
    });
}

// Mostrar propiedades del jugador
function displayPlayerProperties(properties, identifier) {
    const list = document.getElementById('playerPropertiesList');
    
    if (!properties || properties.length === 0) {
        list.innerHTML = '<p class="empty-message">No tiene propiedades</p>';
        return;
    }
    
    list.innerHTML = '';
    
    properties.forEach(property => {
        const item = document.createElement('div');
        item.className = 'property-item';
        
        const status = property.rented === 1 ? 'Rentado' : 'Comprado';
        const price = property.rentPrice || 'N/A';
        
        item.innerHTML = `
            <div class="property-item-info">
                <div class="property-item-name">${property.house}</div>
                <div class="property-item-status">${status} - $${formatNumber(price)}</div>
            </div>
            <div class="property-item-actions">
                <button class="property-action-btn" data-house="${property.house}" data-identifier="${identifier}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    // Event listeners para eliminar
    document.querySelectorAll('.property-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const house = this.dataset.house;
            const identifier = this.dataset.identifier;
            
            if (confirm(`¿Seguro que quieres eliminar la propiedad ${house}?`)) {
                removeProperty(house, identifier);
            }
        });
    });
}

// Eliminar propiedad
function removeProperty(house, identifier) {
    fetch(`https://${GetParentResourceName()}/removeProperty`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({house: house, identifier: identifier})
    }).then(() => {
        // Recargar propiedades
        if (selectedPlayerData) {
            loadPlayerProperties(selectedPlayerData.identifier);
        }
    });
}

// Cargar crypto del jugador
function loadPlayerCrypto(identifier) {
    fetch(`https://${GetParentResourceName()}/getPlayerCrypto`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(response => response.json())
    .then(crypto => {
        displayPlayerCrypto(crypto);
    });
}

// Mostrar crypto del jugador
function displayPlayerCrypto(crypto) {
    const list = document.getElementById('playerCryptoList');
    
    if (!crypto || crypto.length === 0) {
        list.innerHTML = '<p class="empty-message">No tiene cryptomonedas</p>';
        return;
    }
    
    list.innerHTML = '';
    
    crypto.forEach(coin => {
        const item = document.createElement('div');
        item.className = 'crypto-item';
        
        const coinName = coin.coin.charAt(0).toUpperCase() + coin.coin.slice(1);
        const totalValue = coin.amount * (coin.invested / coin.amount || 0);
        
        item.innerHTML = `
            <div class="crypto-item-info">
                <div class="crypto-item-name">${coinName}</div>
                <div class="crypto-item-amount">${coin.amount.toFixed(8)} - Invertido: $${formatNumber(coin.invested)}</div>
            </div>
        `;
        
        list.appendChild(item);
    });
}


// ========== TAB OFFLINE ==========

let allOfflinePlayers = [];
let filteredOfflinePlayers = [];
let currentOfflinePage = 1;
let currentSelectedOfflinePlayer = null;
let selectedOfflinePlayerData = null;
const offlinePlayersPerPage = 20;

// Cargar jugadores cuando se abre el tab
document.querySelector('[data-tab="offline"]').addEventListener('click', function() {
    loadOfflinePlayers();
});

// Cargar jugadores offline
function loadOfflinePlayers() {
    fetch(`https://${GetParentResourceName()}/getOfflinePlayers`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(players => {
        if (!players || players.length === 0) {
            allOfflinePlayers = [];
            filteredOfflinePlayers = [];
            document.getElementById('offlinePlayersList').innerHTML = '<p class="empty-message">No hay jugadores registrados</p>';
            document.getElementById('offlinePlayersCount').textContent = '0';
            return;
        }
        
        allOfflinePlayers = players;
        filteredOfflinePlayers = players;
        currentOfflinePage = 1;
        displayOfflinePlayersPage();
        updateOfflinePagination();
        
        // Actualizar contador
        document.getElementById('offlinePlayersCount').textContent = players.length;
    })
    .catch(error => {
        console.error('Error cargando jugadores offline:', error);
        document.getElementById('offlinePlayersList').innerHTML = '<p class="empty-message">Error al cargar jugadores</p>';
        document.getElementById('offlinePlayersCount').textContent = '0';
    });
}

// Mostrar página de jugadores offline
function displayOfflinePlayersPage() {
    const list = document.getElementById('offlinePlayersList');
    list.innerHTML = '';
    
    if (filteredOfflinePlayers.length === 0) {
        list.innerHTML = '<p class="empty-message">No se encontraron jugadores</p>';
        return;
    }
    
    const startIndex = (currentOfflinePage - 1) * offlinePlayersPerPage;
    const endIndex = startIndex + offlinePlayersPerPage;
    const pageUsers = filteredOfflinePlayers.slice(startIndex, endIndex);
    
    pageUsers.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-list-item';
        item.dataset.identifier = player.identifier;
        
        if (currentSelectedOfflinePlayer === player.identifier) {
            item.classList.add('selected');
        }
        
        item.innerHTML = `
            <div class="player-list-name">${player.name}</div>
        `;
        
        item.addEventListener('click', () => selectOfflinePlayer(player.identifier));
        list.appendChild(item);
    });
}

// Actualizar paginación offline
function updateOfflinePagination() {
    const totalPages = Math.ceil(filteredOfflinePlayers.length / offlinePlayersPerPage);
    const paginationContainer = document.getElementById('offlinePaginationContainer');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Botón anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentOfflinePage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentOfflinePage > 1) {
            currentOfflinePage--;
            displayOfflinePlayersPage();
            updateOfflinePagination();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Números de página
    let startPage = Math.max(1, currentOfflinePage - 2);
    let endPage = Math.min(totalPages, currentOfflinePage + 2);
    
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        pageBtn.textContent = i;
        
        if (i === currentOfflinePage) {
            pageBtn.classList.add('active');
        }
        
        pageBtn.addEventListener('click', () => {
            currentOfflinePage = i;
            displayOfflinePlayersPage();
            updateOfflinePagination();
        });
        
        paginationContainer.appendChild(pageBtn);
    }
    
    // Botón siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentOfflinePage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentOfflinePage < totalPages) {
            currentOfflinePage++;
            displayOfflinePlayersPage();
            updateOfflinePagination();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Buscar jugadores offline
document.getElementById('offlineSearchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    filteredOfflinePlayers = allOfflinePlayers.filter(player => 
        player.name.toLowerCase().includes(searchTerm) || 
        player.identifier.toLowerCase().includes(searchTerm)
    );
    
    currentOfflinePage = 1;
    displayOfflinePlayersPage();
    updateOfflinePagination();
    
    // Actualizar contador
    document.getElementById('offlinePlayersCount').textContent = filteredOfflinePlayers.length;
});

// Seleccionar jugador offline
function selectOfflinePlayer(identifier) {
    currentSelectedOfflinePlayer = identifier;
    
    // Actualizar visual
    document.querySelectorAll('#offlinePlayersList .player-list-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`#offlinePlayersList [data-identifier="${identifier}"]`)?.classList.add('selected');
    
    // Cargar información del jugador
    loadOfflinePlayerInfo(identifier);
}

// Cargar información del jugador offline
function loadOfflinePlayerInfo(identifier) {
    fetch(`https://${GetParentResourceName()}/getOfflinePlayerInfo`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(info => {
        if (info) {
            selectedOfflinePlayerData = info;
            displayOfflinePlayerPanel(info);
            loadOfflinePlayerVehicles(info.identifier);
            loadOfflinePlayerProperties(info.identifier);
            loadOfflinePlayerCrypto(info.identifier);
        } else {
            document.getElementById('offlinePlayerPanelContent').innerHTML = '<p class="empty-message">Error al cargar información del jugador</p>';
        }
    })
    .catch(error => {
        console.error('Error cargando info del jugador:', error);
        document.getElementById('offlinePlayerPanelContent').innerHTML = '<p class="empty-message">Error al cargar información</p>';
    });
}

// Mostrar panel de jugador offline
function displayOfflinePlayerPanel(info) {
    const panel = document.getElementById('offlinePlayerPanelContent');
    
    panel.innerHTML = `
        <!-- Info Grid -->
        <div class="player-info-grid">
            <div class="player-info-item">
                <div class="player-info-label">NOMBRE IC</div>
                <div class="player-info-value">${info.firstname} ${info.lastname}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">BANK</div>
                <div class="player-info-value money">$${formatNumber(info.bank)}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">CASH</div>
                <div class="player-info-value money">$${formatNumber(info.cash)}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">VICOIN</div>
                <div class="player-info-value money">${formatNumber(info.vicoin)}</div>
            </div>
            <div class="player-info-item" style="grid-column: span 2;">
                <div class="player-info-label">LICENCIA</div>
                <div class="player-info-value" style="font-size: 12px;">${info.identifier}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">TRABAJO</div>
                <div class="player-info-value">${info.job}</div>
            </div>
            <div class="player-info-item">
                <div class="player-info-label">GRADO</div>
                <div class="player-info-value">${info.job_grade}</div>
            </div>
        </div>
        
        <!-- Vehículos -->
        <div class="player-vehicles-section">
            <div class="player-vehicles-title">VEHÍCULOS</div>
            <div class="player-vehicles-list" id="offlinePlayerVehiclesList">
                <p class="empty-message">Cargando vehículos...</p>
            </div>
        </div>
        
        <!-- Propiedades -->
        <div class="player-properties-section">
            <div class="player-properties-title">PROPIEDADES</div>
            <div class="player-properties-list" id="offlinePlayerPropertiesList">
                <p class="empty-message">Cargando propiedades...</p>
            </div>
        </div>
        
        <!-- Crypto Wallet -->
        <div class="player-crypto-section">
            <div class="player-crypto-title">CRYPTO WALLET</div>
            <div class="player-crypto-list" id="offlinePlayerCryptoList">
                <p class="empty-message">Cargando cryptos...</p>
            </div>
        </div>
        
        <!-- Botón Eliminar Personaje -->
        <button class="delete-character-btn" id="deleteCharacterBtn">
            <i class="fas fa-user-times"></i>
            <span>BORRAR PERSONAJE</span>
        </button>
    `;
    
    // Event listener para eliminar personaje
    document.getElementById('deleteCharacterBtn').addEventListener('click', function() {
        showDeleteConfirmation(info.identifier, info.firstname + ' ' + info.lastname);
    });
}

// Funciones para cargar vehículos, propiedades y crypto (reutilizadas)
function loadOfflinePlayerVehicles(identifier) {
    fetch(`https://${GetParentResourceName()}/getPlayerVehicles`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(response => response.json())
    .then(vehicles => {
        displayOfflinePlayerVehicles(vehicles, identifier);
    });
}

function displayOfflinePlayerVehicles(vehicles, identifier) {
    const list = document.getElementById('offlinePlayerVehiclesList');
    
    if (!vehicles || vehicles.length === 0) {
        list.innerHTML = '<p class="empty-message">No tiene vehículos</p>';
        return;
    }
    
    list.innerHTML = '';
    
    vehicles.forEach(vehicle => {
        const item = document.createElement('div');
        item.className = 'vehicle-item';
        
        const parking = vehicle.parking || 'Sin garaje';
        const stored = vehicle.stored === 1 ? 'Guardado' : 'Fuera';
        
        item.innerHTML = `
            <div class="vehicle-item-info">
                <div class="vehicle-item-plate">${vehicle.plate}</div>
                <div class="vehicle-item-garage">${parking} - ${stored}</div>
            </div>
            <div class="vehicle-item-actions">
                <button class="vehicle-action-btn" data-plate="${vehicle.plate}">
                    <i class="fas fa-warehouse"></i> Mover
                </button>
                <button class="vehicle-action-btn delete" data-plate="${vehicle.plate}" data-identifier="${identifier}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    // Event listeners
    document.querySelectorAll('#offlinePlayerVehiclesList .vehicle-action-btn:not(.delete)').forEach(btn => {
        btn.addEventListener('click', function() {
            const plate = this.dataset.plate;
            showGarageModal(plate);
        });
    });
    
    document.querySelectorAll('#offlinePlayerVehiclesList .vehicle-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const plate = this.dataset.plate;
            const identifier = this.dataset.identifier;
            
            if (confirm(`¿Seguro que quieres eliminar el vehículo con placa ${plate}?`)) {
                deleteVehicle(plate, identifier);
            }
        });
    });
}

function loadOfflinePlayerProperties(identifier) {
    fetch(`https://${GetParentResourceName()}/getPlayerProperties`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(response => response.json())
    .then(properties => {
        displayOfflinePlayerProperties(properties, identifier);
    });
}

function displayOfflinePlayerProperties(properties, identifier) {
    const list = document.getElementById('offlinePlayerPropertiesList');
    
    if (!properties || properties.length === 0) {
        list.innerHTML = '<p class="empty-message">No tiene propiedades</p>';
        return;
    }
    
    list.innerHTML = '';
    
    properties.forEach(property => {
        const item = document.createElement('div');
        item.className = 'property-item';
        
        const status = property.rented === 1 ? 'Rentado' : 'Comprado';
        const price = property.rentPrice || 'N/A';
        
        item.innerHTML = `
            <div class="property-item-info">
                <div class="property-item-name">${property.house}</div>
                <div class="property-item-status">${status} - $${formatNumber(price)}</div>
            </div>
            <div class="property-item-actions">
                <button class="property-action-btn" data-house="${property.house}" data-identifier="${identifier}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    document.querySelectorAll('#offlinePlayerPropertiesList .property-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const house = this.dataset.house;
            const identifier = this.dataset.identifier;
            
            if (confirm(`¿Seguro que quieres eliminar la propiedad ${house}?`)) {
                removeProperty(house, identifier);
            }
        });
    });
}

function loadOfflinePlayerCrypto(identifier) {
    fetch(`https://${GetParentResourceName()}/getPlayerCrypto`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(response => response.json())
    .then(crypto => {
        displayOfflinePlayerCrypto(crypto);
    });
}

function displayOfflinePlayerCrypto(crypto) {
    const list = document.getElementById('offlinePlayerCryptoList');
    
    if (!crypto || crypto.length === 0) {
        list.innerHTML = '<p class="empty-message">No tiene cryptomonedas</p>';
        return;
    }
    
    list.innerHTML = '';
    
    crypto.forEach(coin => {
        const item = document.createElement('div');
        item.className = 'crypto-item';
        
        const coinName = coin.coin.charAt(0).toUpperCase() + coin.coin.slice(1);
        
        item.innerHTML = `
            <div class="crypto-item-info">
                <div class="crypto-item-name">${coinName}</div>
                <div class="crypto-item-amount">${coin.amount.toFixed(8)} - Invertido: $${formatNumber(coin.invested)}</div>
            </div>
        `;
        
        list.appendChild(item);
    });
}

// Botón refrescar jugadores offline
document.getElementById('refreshOfflinePlayersBtn').addEventListener('click', function() {
    loadOfflinePlayers();
});

// Modal de confirmación para eliminar personaje
function showDeleteConfirmation(identifier, name) {
    let modal = document.getElementById('deleteConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'deleteConfirmModal';
        modal.className = 'confirm-modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="confirm-modal-content">
            <i class="fas fa-exclamation-triangle confirm-modal-icon"></i>
            <h3 class="confirm-modal-title">¿BORRAR PERSONAJE?</h3>
            <p class="confirm-modal-text">
                Estás a punto de eliminar permanentemente a <strong>${name}</strong>.<br>
                Esta acción NO se puede deshacer y eliminará TODOS los datos del jugador.
            </p>
            <div class="confirm-modal-actions">
                <button class="confirm-modal-btn cancel" id="cancelDeleteChar">CANCELAR</button>
                <button class="confirm-modal-btn confirm" id="confirmDeleteChar">ELIMINAR PERMANENTEMENTE</button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    document.getElementById('cancelDeleteChar').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    document.getElementById('confirmDeleteChar').addEventListener('click', () => {
        deleteCharacter(identifier);
        modal.classList.remove('active');
    });
}

// Eliminar personaje
function deleteCharacter(identifier) {
    fetch(`https://${GetParentResourceName()}/deleteCharacter`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifier})
    }).then(() => {
        // Recargar lista de jugadores
        loadOfflinePlayers();
        
        // Limpiar panel
        document.getElementById('offlinePlayerPanelContent').innerHTML = '<p class="empty-message">Selecciona un jugador de la lista</p>';
        currentSelectedOfflinePlayer = null;
        selectedOfflinePlayerData = null;
    });
}

// ========== TAB COMIDAS ==========

let allFoodItems = [];
let filteredFoodItems = [];
let currentFoodPage = 1;
let availableItems = [];
let editingFoodId = null;
const foodItemsPerPage = 8;

// Cargar comidas cuando se abre el tab
document.querySelector('[data-tab="comidas"]').addEventListener('click', function() {
    loadFoodItems();
    loadAvailableItems();
});

// Cargar items disponibles de ox_inventory
function loadAvailableItems() {
    fetch(`https://${GetParentResourceName()}/getInventoryItems`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(items => {
        availableItems = items;
    });
}

// Cargar comidas configuradas
function loadFoodItems() {
    fetch(`https://${GetParentResourceName()}/getFoodItems`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(items => {
        allFoodItems = items;
        filteredFoodItems = items;
        currentFoodPage = 1;
        displayFoodPage();
        updateFoodPagination();
    });
}

// Mostrar página de comidas
function displayFoodPage() {
    const tbody = document.getElementById('foodTableBody');
    tbody.innerHTML = '';
    
    if (filteredFoodItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No hay comidas configuradas</td></tr>';
        return;
    }
    
    const startIndex = (currentFoodPage - 1) * foodItemsPerPage;
    const endIndex = startIndex + foodItemsPerPage;
    const pageItems = filteredFoodItems.slice(startIndex, endIndex);
    
    pageItems.forEach(item => {
        const row = document.createElement('tr');
        
        const categoryLabel = item.category === 'food' ? 'COMIDA' : (item.category === 'drink' ? 'BEBIDA' : 'ALCOHOL');
        
        row.innerHTML = `
            <td><img src="nui://ox_inventory/web/images/${item.item_name}.png" class="food-item-icon" onerror="this.src='https://via.placeholder.com/50x50?text=NO'"></td>
            <td><strong>${item.label}</strong><br><small style="color: rgba(255,255,255,0.5);">${item.item_name}</small></td>
            <td><span class="food-category-badge ${item.category}">${categoryLabel}</span></td>
            <td><span class="food-stat-value">${item.hunger > 0 ? '+' : ''}${item.hunger}</span></td>
            <td><span class="food-stat-value">${item.thirst > 0 ? '+' : ''}${item.thirst}</span></td>
            <td><span class="food-stat-value">${item.stress > 0 ? '+' : ''}${item.stress}</span></td>
            <td><span class="food-stat-value">${item.alcohol > 0 ? '+' : ''}${item.alcohol}</span></td>
            <td>
                <div class="food-actions">
                    <button class="food-action-btn edit" data-id="${item.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="food-action-btn delete" data-id="${item.id}">
                        <i class="fas fa-trash"></i> Borrar
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Event listeners para botones
    document.querySelectorAll('.food-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            editFoodItem(id);
        });
    });
    
    document.querySelectorAll('.food-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const item = allFoodItems.find(i => i.id === id);
            if (confirm(`¿Seguro que quieres eliminar "${item.label}"?`)) {
                deleteFoodItem(id);
            }
        });
    });
}

// Actualizar paginación
function updateFoodPagination() {
    const totalPages = Math.ceil(filteredFoodItems.length / foodItemsPerPage);
    const container = document.getElementById('foodPaginationContainer');
    container.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Botón anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentFoodPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentFoodPage > 1) {
            currentFoodPage--;
            displayFoodPage();
            updateFoodPagination();
        }
    });
    container.appendChild(prevBtn);
    
    // Números de página
    let startPage = Math.max(1, currentFoodPage - 2);
    let endPage = Math.min(totalPages, currentFoodPage + 2);
    
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        pageBtn.textContent = i;
        
        if (i === currentFoodPage) {
            pageBtn.classList.add('active');
        }
        
        pageBtn.addEventListener('click', () => {
            currentFoodPage = i;
            displayFoodPage();
            updateFoodPagination();
        });
        
        container.appendChild(pageBtn);
    }
    
    // Botón siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentFoodPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentFoodPage < totalPages) {
            currentFoodPage++;
            displayFoodPage();
            updateFoodPagination();
        }
    });
    container.appendChild(nextBtn);
}

// Búsqueda de comidas
document.getElementById('foodSearchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    filteredFoodItems = allFoodItems.filter(item => 
        item.label.toLowerCase().includes(searchTerm) || 
        item.item_name.toLowerCase().includes(searchTerm)
    );
    
    currentFoodPage = 1;
    displayFoodPage();
    updateFoodPagination();
});

// Abrir modal para agregar
document.getElementById('addFoodBtn').addEventListener('click', function() {
    editingFoodId = null;
    document.getElementById('foodModalTitle').textContent = 'AGREGAR COMIDA';
    document.getElementById('foodItemName').value = '';
    document.getElementById('foodItemName').disabled = false;
    document.getElementById('foodLabel').value = '';
    document.getElementById('foodCategory').value = 'food';
    document.getElementById('foodHunger').value = 0;
    document.getElementById('foodThirst').value = 0;
    document.getElementById('foodStress').value = 0;
    document.getElementById('foodAlcohol').value = 0;
    document.getElementById('foodModal').classList.add('active');
});

// Cerrar modal
document.getElementById('closeFoodModal').addEventListener('click', closeFoodModal);
document.getElementById('cancelFoodBtn').addEventListener('click', closeFoodModal);

function closeFoodModal() {
    document.getElementById('foodModal').classList.remove('active');
    document.getElementById('itemSuggestions').classList.remove('active');
}

// Autocomplete para items con iconos
document.getElementById('foodItemName').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const suggestions = document.getElementById('itemSuggestions');
    
    if (searchTerm.length < 2) {
        suggestions.classList.remove('active');
        return;
    }
    
    const matches = availableItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.label.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
    
    if (matches.length === 0) {
        suggestions.classList.remove('active');
        return;
    }
    
    suggestions.innerHTML = '';
    matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.innerHTML = `
            <img src="nui://ox_inventory/web/images/${item.name}.png" class="autocomplete-item-icon" onerror="this.src='https://via.placeholder.com/40x40?text=NO'">
            <div class="autocomplete-item-text">
                <span class="autocomplete-item-name">${item.name}</span>
                <span class="autocomplete-item-label">${item.label}</span>
            </div>
        `;
        
        div.addEventListener('click', () => {
            document.getElementById('foodItemName').value = item.name;
            document.getElementById('foodLabel').value = item.label;
            suggestions.classList.remove('active');
        });
        
        suggestions.appendChild(div);
    });
    
    suggestions.classList.add('active');
});

// Cerrar sugerencias al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.autocomplete-wrapper')) {
        document.getElementById('itemSuggestions').classList.remove('active');
    }
});

// Guardar comida
document.getElementById('saveFoodBtn').addEventListener('click', function() {
    const itemName = document.getElementById('foodItemName').value.trim();
    const label = document.getElementById('foodLabel').value.trim();
    const category = document.getElementById('foodCategory').value;
    const hunger = parseInt(document.getElementById('foodHunger').value) || 0;
    const thirst = parseInt(document.getElementById('foodThirst').value) || 0;
    const stress = parseInt(document.getElementById('foodStress').value) || 0;
    const alcohol = parseInt(document.getElementById('foodAlcohol').value) || 0;
    
    // Validaciones
    if (!itemName || !label) {
        alert('Debes completar el nombre del item y el nombre de la comida');
        return;
    }
    
    if (hunger < -100 || hunger > 100 || thirst < -100 || thirst > 100 || 
        stress < -100 || stress > 100 || alcohol < -100 || alcohol > 100) {
        alert('Los valores deben estar entre -100 y 100');
        return;
    }
    
    const data = {
        id: editingFoodId,
        item_name: itemName,
        label: label,
        category: category,
        hunger: hunger,
        thirst: thirst,
        stress: stress,
        alcohol: alcohol
    };
    
    const endpoint = editingFoodId ? 'updateFoodItem' : 'addFoodItem';
    
    fetch(`https://${GetParentResourceName()}/${endpoint}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(response => response.json())
    .then(result => {
        if (result.success) {
            closeFoodModal();
            loadFoodItems();
        }
    });
});

// Editar comida
function editFoodItem(id) {
    const item = allFoodItems.find(i => i.id === id);
    if (!item) return;
    
    editingFoodId = id;
    document.getElementById('foodModalTitle').textContent = 'EDITAR COMIDA';
    document.getElementById('foodItemName').value = item.item_name;
    document.getElementById('foodItemName').disabled = true;
    document.getElementById('foodLabel').value = item.label;
    document.getElementById('foodCategory').value = item.category;
    document.getElementById('foodHunger').value = item.hunger;
    document.getElementById('foodThirst').value = item.thirst;
    document.getElementById('foodStress').value = item.stress;
    document.getElementById('foodAlcohol').value = item.alcohol;
    document.getElementById('foodModal').classList.add('active');
}

// Eliminar comida
function deleteFoodItem(id) {
    fetch(`https://${GetParentResourceName()}/deleteFoodItem`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
    }).then(() => {
        loadFoodItems();
    });
}

// ========== TAB REPORTES ==========

let allReports = [];
let myAcceptedReports = [];

// Cargar reportes cuando se abre el tab
document.querySelector('[data-tab="reportes"]').addEventListener('click', function() {
    loadReports();
});

// Cargar todos los reportes
function loadReports() {
    fetch(`https://${GetParentResourceName()}/getReports`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    }).then(response => response.json())
    .then(reports => {
        allReports = reports;
        displayReports();
    }).catch(error => {
        console.log('Error cargando reportes:', error);
    });
}

// Mostrar reportes en ambos paneles
function displayReports() {
    const listaContainer = document.getElementById('listaReportesContent');
    const panelContainer = document.getElementById('panelReportesContent');
    
    // Filtrar reportes pendientes y prioritarios para la lista
    const pendingReports = allReports.filter(r => r.status === 'pending' || r.status === 'priority');
    
    // Filtrar reportes aceptados para el panel
    const acceptedReports = allReports.filter(r => r.status === 'accepted');
    
    // Mostrar lista de reportes
    if (pendingReports.length === 0) {
        listaContainer.innerHTML = '<p class="empty-message">No hay reportes pendientes</p>';
    } else {
        listaContainer.innerHTML = '';
        pendingReports.forEach(report => {
            const card = createReportCard(report);
            listaContainer.appendChild(card);
        });
    }
    
    // Mostrar panel de reportes aceptados
    if (acceptedReports.length === 0) {
        panelContainer.innerHTML = '<p class="empty-message">No hay reportes aceptados</p>';
    } else {
        panelContainer.innerHTML = '';
        acceptedReports.forEach(report => {
            const card = createAcceptedReportCard(report);
            panelContainer.appendChild(card);
        });
    }
}

// Crear card de reporte para la lista
function createReportCard(report) {
    const card = document.createElement('div');
    card.className = `report-card ${report.status}`;
    
    let acceptedInfo = '';
    // Solo mostrar "ACEPTADO POR" si está en estado accepted (no priority)
    if (report.status === 'accepted' && report.accepted_by_name) {
        acceptedInfo = `
            <div class="report-card-accepted">
                ACEPTADO POR: <span>${report.accepted_by_name}</span>
            </div>
        `;
    }
    
    // Botones si está pendiente o en prioridad
    let buttons = '';
    if (report.status === 'pending' || report.status === 'priority') {
        buttons = `
            <div class="report-card-actions">
                <button class="report-card-btn accept" data-id="${report.id}">
                    <i class="fas fa-check"></i> ACEPTAR
                </button>
                <button class="report-card-btn delete" data-id="${report.id}">
                    <i class="fas fa-trash"></i> BORRAR
                </button>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="report-card-info">
            <div class="report-card-reason">
                RAZÓN: <span>${report.reason}</span>
            </div>
            <div class="report-card-player">
                <span>NOMBRE: ${report.reporter_name}</span>
            </div>
            <div class="report-card-id">
                ID: <span>${report.reporter_id}</span>
            </div>
            ${acceptedInfo}
        </div>
        ${buttons}
    `;
    
    return card;
}

// Crear card de reporte aceptado para el panel
function createAcceptedReportCard(report) {
    const card = document.createElement('div');
    card.className = 'accepted-report-card';
    
    card.innerHTML = `
        <div class="accepted-report-header">
            <div class="accepted-report-reason">
                RAZÓN: <span>${report.reason}</span>
            </div>
            <div class="accepted-report-description">
                <strong>Descripción:</strong><br>
                ${report.description}
            </div>
        </div>
        <div class="accepted-report-actions-title">ACCIONES RÁPIDAS</div>
        <div class="accepted-report-actions">
            <button class="report-action-btn" data-action="spectate" data-id="${report.id}">
                <i class="fas fa-eye"></i> ESPECTAR
            </button>
            <button class="report-action-btn" data-action="goto" data-id="${report.id}">
                <i class="fas fa-location-arrow"></i> IR
            </button>
            <button class="report-action-btn" data-action="bring" data-id="${report.id}">
                <i class="fas fa-hand-point-down"></i> TRAER
            </button>
            <button class="report-action-btn" data-action="return" data-id="${report.id}">
                <i class="fas fa-undo"></i> REGRESAR
            </button>
            <button class="report-action-btn" data-action="freeze" data-id="${report.id}">
                <i class="fas fa-snowflake"></i> CONGELAR
            </button>
            <button class="report-action-btn" data-action="revive" data-id="${report.id}">
                <i class="fas fa-heart"></i> REVIVIR
            </button>
            <button class="report-action-btn priority" data-action="prioritize" data-id="${report.id}">
                <i class="fas fa-exclamation-triangle"></i> SUBIR PRIORIDAD
            </button>
            <button class="report-action-btn close-report" data-action="close" data-id="${report.id}">
                <i class="fas fa-check-circle"></i> CERRAR REPORTE
            </button>
        </div>
    `;
    
    return card;
}

// Event delegation para botones de reportes
document.getElementById('listaReportesContent').addEventListener('click', function(e) {
    const acceptBtn = e.target.closest('.report-card-btn.accept');
    const deleteBtn = e.target.closest('.report-card-btn.delete');
    
    if (acceptBtn) {
        const reportId = parseInt(acceptBtn.dataset.id);
        acceptReport(reportId);
    } else if (deleteBtn) {
        const reportId = parseInt(deleteBtn.dataset.id);
        deleteReport(reportId);
    }
});

// Event delegation para acciones rápidas del panel
document.getElementById('panelReportesContent').addEventListener('click', function(e) {
    const actionBtn = e.target.closest('.report-action-btn');
    
    if (actionBtn) {
        const action = actionBtn.dataset.action;
        const reportId = parseInt(actionBtn.dataset.id);
        
        if (action === 'prioritize') {
            prioritizeReport(reportId);
        } else if (action === 'close') {
            deleteReport(reportId);
        } else {
            executeReportAction(action, reportId);
        }
    }
});

// Aceptar reporte
function acceptReport(reportId) {
    fetch(`https://${GetParentResourceName()}/acceptReport`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({reportId: reportId})
    });
}

// Borrar reporte
function deleteReport(reportId) {
    fetch(`https://${GetParentResourceName()}/deleteReport`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({reportId: reportId})
    });
}

// Subir prioridad
function prioritizeReport(reportId) {
    fetch(`https://${GetParentResourceName()}/prioritizeReport`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({reportId: reportId})
    });
}

// Ejecutar acción del reporte
function executeReportAction(action, reportId) {
    fetch(`https://${GetParentResourceName()}/reportAction`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: action, reportId: reportId})
    });
}

// Botón refrescar reportes
document.getElementById('refreshReportesBtn').addEventListener('click', function() {
    loadReports();
});

// ========== MODAL DE REPORTE ==========

// Abrir modal
window.addEventListener('message', function(event) {
    const data = event.data;
    
    // ... código existente ...
    
    if (data.action === 'openReportModal') {
        document.getElementById('reportModal').classList.add('active');
        document.getElementById('reportReason').value = '';
        document.getElementById('reportDescription').value = '';
        updateCharCount();
    } else if (data.action === 'newReport') {
        // Nuevo reporte recibido, recargar
        if (document.querySelector('[data-tab="reportes"]').classList.contains('active')) {
            loadReports();
        }
    } else if (data.action === 'refreshReports') {
        // Actualizar reportes
        if (document.querySelector('[data-tab="reportes"]').classList.contains('active')) {
            loadReports();
        }
    }
});

// Cerrar modal
document.getElementById('closeReportModal').addEventListener('click', closeReportModal);
document.getElementById('cancelReportBtn').addEventListener('click', closeReportModal);

function closeReportModal() {
    const reportModal = document.getElementById('reportModal');
    reportModal.classList.remove('active');
    
    setTimeout(() => {
        reportModal.style.display = 'none';
    }, 300);
    
    // Solo cerrar NUI focus, no cerrar el menú completo
    fetch(`https://${GetParentResourceName()}/closeReportModal`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({})
    });
}

// Contador de caracteres
document.getElementById('reportDescription').addEventListener('input', updateCharCount);

function updateCharCount() {
    const textarea = document.getElementById('reportDescription');
    const count = document.getElementById('descriptionCharCount');
    count.textContent = `${textarea.value.length}/500 caracteres`;
}

// Enviar reporte
document.getElementById('sendReportBtn').addEventListener('click', function() {
    const reason = document.getElementById('reportReason').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    
    // Validar campos
    if (reason === '' || description === '') {
        // Aquí puedes mostrar una notificación de error
        console.log('Todos los campos son obligatorios');
        
        // Efecto visual en campos vacíos
        if (reason === '') {
            document.getElementById('reportReason').style.borderColor = '#ef4444';
            setTimeout(() => {
                document.getElementById('reportReason').style.borderColor = '';
            }, 2000);
        }
        
        if (description === '') {
            document.getElementById('reportDescription').style.borderColor = '#ef4444';
            setTimeout(() => {
                document.getElementById('reportDescription').style.borderColor = '';
            }, 2000);
        }
        
        return;
    }
    
    // Enviar reporte
    fetch(`https://${GetParentResourceName()}/sendReport`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            reason: reason,
            description: description
        })
    });
    
    closeReportModal();
});

// Cerrar modal con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const reportModal = document.getElementById('reportModal');
        if (reportModal.classList.contains('active')) {
            closeReportModal();
        }
    }
});