module.exports = {
  appId: 'com.bibin.inventorymanager',
  productName: 'Inventory Manager',
  directories: {
    output: 'release',
    buildResources: 'build'
  },
  files: [
    'dist/**/*',
    'package.json'
  ],
  extraMetadata: {
    main: 'dist/main.js'
  },
  buildDependenciesFromSource: false,
  asar: true,
  publish: null,

  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    category: 'public.app-category.business'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      }
    ],
    category: 'Office',
    description: 'A comprehensive inventory management system with POS capabilities',
    synopsis: 'Inventory Management System',
    executableName: 'inventory-manager',
    desktop: {
      entry: {
        Name: 'Inventory Manager',
        Comment: 'A comprehensive inventory management system with POS capabilities',
        Icon: 'inventory-manager',
        Type: 'Application',
        Categories: 'Office;Finance;Business;'
      }
    },
    icon: 'build/icon.png',
    executableArgs: ['--no-sandbox', '--disable-dev-shm-usage']
  },
  deb: {
    depends: [
      'libgtk-3-0',
      'libnotify4 | libnotify-bin', 
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libuuid1',
      'libsecret-1-0'
    ],
    priority: 'optional',
    category: 'office'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ]
  }
};
