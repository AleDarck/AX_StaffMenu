fx_version 'cerulean'
game 'gta5'

author 'AleDarck'
description 'AX Staff Menu - Sistema de administración para staff'
version '1.0.0'

lua54 'yes'

shared_scripts {
    '@es_extended/imports.lua',
    'config.lua'
}

client_scripts {
    'client.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js'
}

dependencies {
    'es_extended',
    'oxmysql',
    'ox_inventory',
    'esx_status',
    'AX_ProgressBar'
}