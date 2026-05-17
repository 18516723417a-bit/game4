const LANGUAGE_STORAGE_KEY = 'game4:language';

const TEXT = {
  en: {
    airport: 'Airport',
    area: 'Area',
    best: 'Best',
    brake: 'Brake',
    cargo: 'Cargo',
    cargoBest: 'Cargo Best',
    cargoGoal: 'Cargo Goal',
    cargoRoute: 'Cargo Route',
    cargoRun: 'Cargo Run',
    cargoTime: 'Cargo Time',
    chase: 'Chase',
    chaseView: 'Chase View',
    chunk: 'Chunk',
    clear: 'Clear',
    clearNav: 'Clear Nav',
    clearRoute: 'Clear Route',
    close: 'Close',
    collisionHits: 'hits',
    cooldown: 'Cooldown',
    day: 'Day',
    dayMode: 'Day Mode',
    delivered: 'Delivered',
    distance: 'Distance',
    districtIndustrial: 'Industrial',
    districtResidential: 'Residential',
    districts: 'Districts',
    done: 'Done',
    draws: 'Draws',
    drift: 'Drift',
    driver: 'Driver',
    driverView: 'Driver View',
    failed: 'Failed',
    finish: 'Finish',
    follow: 'Follow',
    fps: 'FPS',
    free: 'Free',
    freeDrive: 'Free Drive',
    freeRoam: 'Free roam',
    gas: 'Gas',
    goal: 'Goal',
    grip: 'Grip',
    groundLine: 'Ground Line',
    guide: 'Guide',
    height: 'Height',
    hits: 'Hits',
    inside: 'Inside',
    language: 'Language',
    left: 'Left',
    light: 'Light',
    line: 'Line',
    loaded: 'Loaded',
    loading: 'Loading',
    loadingRenderer: 'Loading renderer',
    map: 'Map',
    mapClickAction: 'Map click action',
    mapLayers: 'Layers',
    mapZoomControls: 'Map zoom controls',
    meshes: 'Meshes',
    mini: 'Mini',
    mode: 'Mode',
    nav: 'Nav',
    navigation: 'Navigation',
    navigationDestinations: 'Navigation destinations',
    next: 'Next',
    nextCargo: 'Next Cargo',
    night: 'Night',
    nightMode: 'Night Mode',
    nitro: 'Nitro',
    north: 'North',
    off: 'off',
    on: 'On',
    online: 'Online',
    openWorldMap: 'Open world map',
    outside: 'outside',
    outsideWorld: 'Outside world',
    pause: 'Pause',
    paused: 'Paused',
    quality: 'Quality',
    race: 'Race',
    raceOff: 'Race Off',
    raceOn: 'Race On',
    ready: 'ready',
    restart: 'Restart',
    resume: 'Resume',
    reward: 'Reward',
    right: 'Right',
    road: 'Road',
    rotateDevice: 'Rotate your device for a wider driving view.',
    route: 'Route',
    score: 'Score',
    scene3d: '3D scene',
    setNav: 'Set Nav',
    speed: 'Speed',
    start: 'Start',
    startRace: 'Start Race',
    state: 'State',
    station: 'Station',
    status: 'Status',
    teleport: 'Teleport',
    time: 'Time',
    toll: 'Toll',
    view: 'View',
    weather: 'Weather',
    worldMap: 'World Map',
    worldX: 'World X',
    worldY: 'World Y',
    worldZ: 'World Z',
    yes: 'yes',
    you: 'YOU'
  },
  zh: {
    airport: '机场',
    area: '区域',
    best: '最佳',
    brake: '刹车',
    cargo: '货运',
    cargoBest: '货运最佳',
    cargoGoal: '货运目标',
    cargoRoute: '货运路线',
    cargoRun: '货运任务',
    cargoTime: '货运时间',
    chase: '追尾',
    chaseView: '追尾视角',
    chunk: '区块',
    clear: '清除',
    clearNav: '清除导航',
    clearRoute: '清除路线',
    close: '关闭',
    collisionHits: '次碰撞',
    cooldown: '冷却',
    day: '白天',
    dayMode: '白天模式',
    delivered: '已送达',
    distance: '距离',
    districtIndustrial: '工业区',
    districtResidential: '住宅区',
    districts: '分区',
    done: '完成',
    draws: '绘制',
    drift: '漂移',
    driver: '驾驶',
    driverView: '驾驶视角',
    failed: '失败',
    finish: '终点',
    follow: '跟随',
    fps: '帧率',
    free: '自由',
    freeDrive: '自由驾驶',
    freeRoam: '自由驾驶',
    gas: '油门',
    goal: '目标',
    grip: '抓地',
    groundLine: '地面线',
    guide: '指引',
    height: '高度',
    hits: '碰撞',
    inside: '边界内',
    language: '语言',
    left: '左',
    light: '光照',
    line: '路线',
    loaded: '已载入',
    loading: '加载中',
    loadingRenderer: '加载渲染器',
    map: '地图',
    mapClickAction: '地图点击动作',
    mapLayers: '图层',
    mapZoomControls: '地图缩放',
    meshes: '网格',
    mini: '小地图',
    mode: '模式',
    nav: '导航',
    navigation: '导航',
    navigationDestinations: '导航目的地',
    next: '下一个',
    nextCargo: '下一单',
    night: '夜晚',
    nightMode: '夜晚模式',
    nitro: '氮气',
    north: '北向',
    off: '关',
    on: '开',
    online: '在线',
    openWorldMap: '打开世界地图',
    outside: '外部',
    outsideWorld: '世界外',
    pause: '暂停',
    paused: '已暂停',
    quality: '画质',
    race: '竞速',
    raceOff: '关闭竞速',
    raceOn: '开启竞速',
    ready: '就绪',
    restart: '重开',
    resume: '继续',
    reward: '奖励',
    right: '右',
    road: '道路',
    rotateDevice: '旋转设备以获得更宽的驾驶视野。',
    route: '路线',
    score: '分数',
    scene3d: '3D 场景',
    setNav: '设为导航',
    speed: '速度',
    start: '开始',
    startRace: '开始竞速',
    state: '状态',
    station: '车站',
    status: '状态',
    teleport: '传送',
    time: '计时',
    toll: '收费站',
    view: '视角',
    weather: '天气',
    worldMap: '世界地图',
    worldX: '世界 X',
    worldY: '世界 Y',
    worldZ: '世界 Z',
    yes: '是',
    you: '你'
  }
};

const LANGUAGE_NAMES = {
  en: 'English',
  zh: '中文'
};

const QUALITY_TEXT = {
  en: { auto: 'Auto', high: 'High', low: 'Low', ultra: 'Ultra' },
  zh: { auto: '自动', high: '高', low: '低', ultra: '超高' }
};

const WEATHER_TEXT = {
  en: {
    clear: 'Clear',
    cloudy: 'Cloudy',
    fog: 'Fog',
    rain: 'Rain',
    snow: 'Snow',
    storm: 'Storm'
  },
  zh: {
    clear: '晴朗',
    cloudy: '多云',
    fog: '雾',
    rain: '雨',
    snow: '雪',
    storm: '暴雨'
  }
};

const GAME_PHASE_TEXT = {
  en: {
    countdown: 'Countdown',
    failed: 'Failed',
    finished: 'Finished',
    freeDrive: 'Free Drive',
    paused: 'Paused',
    ready: 'Ready',
    running: 'Running'
  },
  zh: {
    countdown: '倒计时',
    failed: '失败',
    finished: '完成',
    freeDrive: '自由驾驶',
    paused: '已暂停',
    ready: '准备',
    running: '进行中'
  }
};

const SURFACE_TEXT = {
  en: {
    bridge: 'bridge',
    elevatedHighway: 'elevated',
    grass: 'grass',
    groundRoad: 'road',
    highway: 'highway',
    mainRoad: 'main',
    parking: 'parking',
    ramp: 'ramp'
  },
  zh: {
    bridge: '桥',
    elevatedHighway: '高架',
    grass: '草地',
    groundRoad: '地面路',
    highway: '高速',
    mainRoad: '主路',
    parking: '停车场',
    ramp: '坡道'
  }
};

const DESTINATION_TEXT = {
  en: {
    'airport-terminal': ['Airport Terminal', 'Airport'],
    downtown: ['Downtown Start', 'Start'],
    'train-station': ['Train Station', 'Station'],
    'transport-bridge': ['Ground Road Highway Overpass', 'Road Bridge'],
    'transport-tunnel': ['Ground Road Underpass', 'Underpass'],
    toll: ['Toll Booth', 'Toll'],
    custom: ['Custom Point', 'Custom']
  },
  zh: {
    'airport-terminal': ['机场航站楼', '机场'],
    downtown: ['市中心起点', '起点'],
    'train-station': ['火车站', '车站'],
    'transport-bridge': ['地面路跨高速桥', '跨高速桥'],
    'transport-tunnel': ['地面下穿隧道', '下穿隧道'],
    toll: ['收费站', '收费'],
    custom: ['自定义点', '自定']
  }
};

const TRANSPORT_ROUTE_TEXT = {
  en: {
    'airport-to-station': 'Airport to Station',
    'station-to-airport': 'Station to Airport',
    'toll-inspection-run': 'Toll Inspection'
  },
  zh: {
    'airport-to-station': '机场到车站',
    'station-to-airport': '车站到机场',
    'toll-inspection-run': '收费站巡检'
  }
};

const TRANSPORT_PHASE_TEXT = {
  en: {
    delivery: 'Deliver',
    failed: 'Failed',
    finished: 'Done',
    idle: 'off',
    pickup: 'Pickup'
  },
  zh: {
    delivery: '送货',
    failed: '失败',
    finished: '完成',
    idle: '关',
    pickup: '取货'
  }
};

const FAIL_REASON_TEXT = {
  en: {
    'Out of bounds': 'Out of bounds',
    'Race stopped': 'Race stopped',
    'Time limit reached': 'Time limit reached',
    Timeout: 'Timeout',
    'Too many collisions': 'Too many collisions'
  },
  zh: {
    'Out of bounds': '驶出边界',
    'Race stopped': '比赛停止',
    'Time limit reached': '超时',
    Timeout: '超时',
    'Too many collisions': '碰撞太多'
  }
};

const CHECKPOINT_TEXT = {
  en: {
    finish: 'Finish',
    'main-road-run': 'Main road run',
    'roundabout-exit': 'Roundabout exit'
  },
  zh: {
    finish: '终点',
    'main-road-run': '主路冲刺',
    'roundabout-exit': '环岛出口'
  }
};

const MAP_LAYER_TEXT = {
  en: {
    airport: 'Airport',
    districts: 'Districts',
    expressway: 'Expressway',
    highway: 'Highway',
    parking: 'Parking',
    roads: 'Roads',
    station: 'Station',
    structures: 'Structures',
    tolls: 'Tolls',
    traffic: 'AI Cars'
  },
  zh: {
    airport: '机场',
    districts: '分区',
    expressway: '快速路',
    highway: '高速',
    parking: '停车',
    roads: '道路',
    station: '车站',
    structures: '桥/隧道',
    tolls: '收费站',
    traffic: 'AI 车辆'
  }
};

const DISTRICT_TEXT = {
  en: {
    commercial: ['Commerce Row', 'COM'],
    downtown: ['Downtown Core', 'DT'],
    harbor: ['Harbor Fringe', 'HAR'],
    industrial: ['Industrial Works', 'IND'],
    residential: ['Garden Residential', 'RES']
  },
  zh: {
    commercial: ['商业区', '商业'],
    downtown: ['市中心', '中心'],
    harbor: ['港口区', '港口'],
    industrial: ['工业区', '工业'],
    residential: ['住宅区', '住宅']
  }
};

export function readLanguagePreference() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') return stored;
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }

  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) {
    return 'zh';
  }

  return 'en';
}

export function writeLanguagePreference(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

export function getNextLanguage(language) {
  return normalizeLanguage(language) === 'zh' ? 'en' : 'zh';
}

export function getLanguageName(language) {
  return LANGUAGE_NAMES[normalizeLanguage(language)];
}

export function getText(language, key) {
  const normalized = normalizeLanguage(language);
  return TEXT[normalized]?.[key] ?? TEXT.en[key] ?? key;
}

export function getQualityText(language, mode) {
  const normalized = normalizeLanguage(language);
  return QUALITY_TEXT[normalized]?.[mode] ?? QUALITY_TEXT.en[mode] ?? mode;
}

export function getWeatherText(language, mode, fallback = mode) {
  const normalized = normalizeLanguage(language);
  return WEATHER_TEXT[normalized]?.[mode] ?? WEATHER_TEXT.en[mode] ?? fallback;
}

export function getGamePhaseText(language, phase) {
  const normalized = normalizeLanguage(language);
  return GAME_PHASE_TEXT[normalized]?.[phase] ?? GAME_PHASE_TEXT.en[phase] ?? phase;
}

export function getSurfaceTypeText(language, surfaceType) {
  const normalized = normalizeLanguage(language);
  return SURFACE_TEXT[normalized]?.[surfaceType] ?? SURFACE_TEXT.en[surfaceType] ?? surfaceType;
}

export function getTransportRouteText(language, route) {
  if (!route) return '--';
  const normalized = normalizeLanguage(language);
  return TRANSPORT_ROUTE_TEXT[normalized]?.[route.id] ?? route.label ?? '--';
}

export function getTransportPhaseText(language, phase) {
  const normalized = normalizeLanguage(language);
  return TRANSPORT_PHASE_TEXT[normalized]?.[phase] ?? TRANSPORT_PHASE_TEXT.en[phase] ?? phase;
}

export function getFailReasonText(language, reason) {
  if (!reason) return '';
  const normalized = normalizeLanguage(language);
  return FAIL_REASON_TEXT[normalized]?.[reason] ?? FAIL_REASON_TEXT.en[reason] ?? reason;
}

export function getCheckpointText(language, checkpoint) {
  if (!checkpoint) return getText(language, 'finish');
  const normalized = normalizeLanguage(language);
  return CHECKPOINT_TEXT[normalized]?.[checkpoint.id] ?? checkpoint.label ?? getText(language, 'finish');
}

export function getDestinationLabel(language, destination) {
  if (!destination) return '--';
  const normalized = normalizeLanguage(language);
  const key = destination.id in (DESTINATION_TEXT.en ?? {}) ? destination.id : destination.type;
  return DESTINATION_TEXT[normalized]?.[key]?.[0] ?? destination.label ?? '--';
}

export function getDestinationShortLabel(language, destination) {
  if (!destination) return '--';
  const normalized = normalizeLanguage(language);
  const key = destination.id in (DESTINATION_TEXT.en ?? {}) ? destination.id : destination.type;
  return DESTINATION_TEXT[normalized]?.[key]?.[1] ?? destination.shortLabel ?? destination.label ?? '--';
}

export function getMapLayerText(language, layerId) {
  const normalized = normalizeLanguage(language);
  return MAP_LAYER_TEXT[normalized]?.[layerId] ?? MAP_LAYER_TEXT.en[layerId] ?? layerId;
}

export function getDistrictLabel(language, type) {
  const normalized = normalizeLanguage(language);
  return DISTRICT_TEXT[normalized]?.[type]?.[0] ?? DISTRICT_TEXT.en[type]?.[0] ?? type;
}

export function getDistrictShortLabel(language, type, fallback) {
  const normalized = normalizeLanguage(language);
  return DISTRICT_TEXT[normalized]?.[type]?.[1] ?? fallback ?? type;
}

function normalizeLanguage(language) {
  return language === 'zh' ? 'zh' : 'en';
}
