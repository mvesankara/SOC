// Application SOCaaS - JavaScript principal (corrigé)

// Données simulées (basées sur les données fournies)
const mockData = {
  incidents: [
    {id: 1, title: "Activité suspecte détectée", criticite: "Critique", statut: "Ouvert", timestamp: "2025-06-16 22:15", type: "Malware", source: "Endpoint 192.168.1.45"},
    {id: 2, title: "Tentative de connexion non autorisée", criticite: "Élevé", statut: "En cours", timestamp: "2025-06-16 21:30", type: "Intrusion", source: "Firewall externe"},
    {id: 3, title: "Trafic réseau anormal", criticite: "Moyen", statut: "Résolu", timestamp: "2025-06-16 20:45", type: "Anomalie réseau", source: "Switch principal"},
    {id: 4, title: "Scan de ports détecté", criticite: "Élevé", statut: "Ouvert", timestamp: "2025-06-16 19:22", type: "Reconnaissance", source: "Externe 203.0.113.5"},
    {id: 5, title: "Fichier suspect en quarantaine", criticite: "Critique", statut: "En cours", timestamp: "2025-06-16 18:45", type: "Malware", source: "Endpoint 192.168.1.102"}
  ],
  metriques: {
    incidents_ouverts: 15,
    incidents_fermes: 142,
    menaces_detectees: 8,
    sla_respecte: "98.5%",
    temps_reponse_moyen: "4.2 min"
  },
  threats: [
    {type: "Phishing", count: 25, trend: "up"},
    {type: "Malware", count: 18, trend: "down"},
    {type: "Ransomware", count: 3, trend: "stable"},
    {type: "DDoS", count: 7, trend: "up"}
  ],
  systems: [
    {name: "Firewall Principal", status: "Online", cpu: "45%", memory: "62%"},
    {name: "SIEM", status: "Online", cpu: "78%", memory: "71%"},
    {name: "IDS/IPS", status: "Warning", cpu: "89%", memory: "82%"},
    {name: "Endpoints", status: "Online", monitored: 1247, issues: 3}
  ],
  securityEvents: [
    {timestamp: "22:38:15", message: "Connexion SSH réussie depuis 192.168.1.10", severity: "info"},
    {timestamp: "22:37:42", message: "Tentative de connexion échouée sur admin@mail.example.com", severity: "warning"},
    {timestamp: "22:36:28", message: "Mise à jour de signature antivirus terminée", severity: "info"},
    {timestamp: "22:35:15", message: "Détection d'activité suspecte sur endpoint-047", severity: "critical"},
    {timestamp: "22:34:03", message: "Sauvegarde des logs complétée avec succès", severity: "info"}
  ],
  iocList: [
    {type: "IP", value: "203.0.113.50", threat: "Botnet C&C", confidence: "High"},
    {type: "Domain", value: "malicious-site.example", threat: "Phishing", confidence: "Medium"},
    {type: "Hash", value: "d41d8cd98f00b204e9800998ecf8427e", threat: "Malware", confidence: "High"},
    {type: "URL", value: "http://suspicious-link.example/payload", threat: "Exploit Kit", confidence: "Low"}
  ]
};

// Variables globales
let currentPage = 'dashboard';
let charts = {};
let filteredIncidents = [...mockData.incidents];

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Initialiser la navigation
  initNavigation();
  
  // Charger les données initiales
  loadDashboardData();
  
  // Initialiser les filtres
  initFilters();
  
  // Démarrer les mises à jour en temps réel
  startRealTimeUpdates();
  
  // Mettre à jour l'heure
  updateLastUpdateTime();
});

// Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const targetPage = this.getAttribute('data-page');
      switchPage(targetPage);
    });
  });
}

function switchPage(pageName) {
  // Masquer toutes les pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Masquer tous les nav items actifs
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Afficher la page cible
  const targetPage = document.getElementById(pageName);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // Activer le nav item
  const navItem = document.querySelector(`[data-page="${pageName}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
  
  currentPage = pageName;
  
  // Charger les données spécifiques à la page avec un délai pour s'assurer que la page est visible
  setTimeout(() => {
    loadPageData(pageName);
  }, 100);
}

// Chargement des données
function loadDashboardData() {
  // Métriques principales
  const elements = {
    'incidents-ouverts': mockData.metriques.incidents_ouverts,
    'incidents-fermes': mockData.metriques.incidents_fermes,
    'menaces-detectees': mockData.metriques.menaces_detectees,
    'sla-respecte': mockData.metriques.sla_respecte,
    'temps-reponse': mockData.metriques.temps_reponse_moyen
  };
  
  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = elements[id];
    }
  });
  
  // Alertes récentes
  loadRecentAlerts();
  
  // État des systèmes
  loadSystemsStatus();
  
  // Graphique des tendances (avec délai pour s'assurer que le canvas est visible)
  setTimeout(() => {
    createThreatsChart();
  }, 100);
}

function loadRecentAlerts() {
  const container = document.getElementById('recent-alerts');
  if (!container) return;
  
  container.innerHTML = '';
  
  mockData.incidents.slice(0, 5).forEach(incident => {
    const alertDiv = document.createElement('div');
    const criticiteClass = incident.criticite.toLowerCase().replace('é', 'e');
    alertDiv.className = `alert-item ${criticiteClass}`;
    
    alertDiv.innerHTML = `
      <div class="alert-content">
        <div class="alert-title">${incident.title}</div>
        <div class="alert-meta">${incident.timestamp} - ${incident.source}</div>
      </div>
    `;
    
    container.appendChild(alertDiv);
  });
}

function loadSystemsStatus() {
  const container = document.getElementById('systems-status');
  if (!container) return;
  
  container.innerHTML = '';
  
  mockData.systems.forEach(system => {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-item';
    
    const statusClass = system.status.toLowerCase();
    const statusText = system.status === 'Online' ? 'En ligne' : 
                      system.status === 'Warning' ? 'Attention' : 'Hors ligne';
    
    systemDiv.innerHTML = `
      <div class="system-info">
        <div class="system-name">${system.name}</div>
        <div class="system-stats">
          ${system.cpu ? `CPU: ${system.cpu}` : ''}
          ${system.memory ? ` | RAM: ${system.memory}` : ''}
          ${system.monitored ? `${system.monitored} endpoints surveillés` : ''}
          ${system.issues ? ` | ${system.issues} problèmes` : ''}
        </div>
      </div>
      <div class="system-status ${statusClass}">${statusText}</div>
    `;
    
    container.appendChild(systemDiv);
  });
}

function loadPageData(pageName) {
  switch(pageName) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'incidents':
      loadIncidentsList();
      break;
    case 'threats':
      loadThreatsData();
      break;
    case 'monitoring':
      loadMonitoringData();
      break;
    case 'reports':
      loadReportsData();
      break;
    case 'config':
      // Configuration page doesn't need dynamic data
      break;
  }
}

function loadIncidentsList(useFiltered = false) {
  const container = document.getElementById('incidents-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  const incidentsToShow = useFiltered ? filteredIncidents : mockData.incidents;
  
  incidentsToShow.forEach(incident => {
    const incidentDiv = document.createElement('div');
    incidentDiv.className = 'incident-row';
    
    const criticiteClass = incident.criticite.toLowerCase().replace('é', 'e');
    const statutClass = incident.statut.toLowerCase().replace(' ', '-');
    
    incidentDiv.innerHTML = `
      <div class="col-id">#${incident.id}</div>
      <div class="col-title">
        <div class="incident-title">${incident.title}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">${incident.type} - ${incident.source}</div>
      </div>
      <div class="col-criticite">
        <span class="criticite-badge ${criticiteClass}">${incident.criticite}</span>
      </div>
      <div class="col-statut">
        <span class="statut-badge ${statutClass}">${incident.statut}</span>
      </div>
      <div class="col-date">${incident.timestamp}</div>
      <div class="col-actions">
        <div class="incident-actions">
          <button class="action-btn">Voir</button>
          <button class="action-btn">Assigner</button>
        </div>
      </div>
    `;
    
    container.appendChild(incidentDiv);
  });
}

function loadThreatsData() {
  // Graphique des types de menaces
  setTimeout(() => {
    createThreatTypesChart();
  }, 100);
  
  // Flux de menaces
  loadThreatFeed();
  
  // Indicateurs de compromission
  loadIOCList();
}

function loadThreatFeed() {
  const container = document.getElementById('threat-feed');
  if (!container) return;
  
  container.innerHTML = '';
  
  mockData.threats.forEach(threat => {
    const threatDiv = document.createElement('div');
    threatDiv.className = 'threat-item';
    
    const trendIcon = threat.trend === 'up' ? 'trending-up' : 
                     threat.trend === 'down' ? 'trending-down' : 'minus';
    const trendClass = `trend-${threat.trend}`;
    
    threatDiv.innerHTML = `
      <div class="threat-type">${threat.type}</div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="threat-count">${threat.count}</span>
        <i data-lucide="${trendIcon}" class="trend-indicator ${trendClass}"></i>
      </div>
    `;
    
    container.appendChild(threatDiv);
  });
  
  // Re-initialiser les icônes Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function loadIOCList() {
  const container = document.getElementById('ioc-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  mockData.iocList.forEach(ioc => {
    const iocDiv = document.createElement('div');
    iocDiv.className = 'threat-item';
    
    iocDiv.innerHTML = `
      <div>
        <div class="threat-type">${ioc.type}: ${ioc.value}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">${ioc.threat}</div>
      </div>
      <div class="threat-count">${ioc.confidence}</div>
    `;
    
    container.appendChild(iocDiv);
  });
}

function loadMonitoringData() {
  // Graphique réseau
  setTimeout(() => {
    createNetworkChart();
  }, 100);
  
  // Événements de sécurité
  loadSecurityEvents();
  
  // Status des endpoints
  loadEndpointsStatus();
}

function loadSecurityEvents() {
  const container = document.getElementById('security-events');
  if (!container) return;
  
  container.innerHTML = '';
  
  mockData.securityEvents.forEach(event => {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'security-event';
    
    eventDiv.innerHTML = `
      <span class="event-timestamp">[${event.timestamp}]</span>
      <span class="event-message">${event.message}</span>
    `;
    
    container.appendChild(eventDiv);
  });
}

function loadEndpointsStatus() {
  const container = document.getElementById('endpoints-status');
  if (!container) return;
  
  const endpointsSystem = mockData.systems.find(s => s.name === 'Endpoints');
  
  container.innerHTML = `
    <div class="system-item">
      <div class="system-info">
        <div class="system-name">Endpoints Surveillés</div>
        <div class="system-stats">${endpointsSystem.monitored} appareils</div>
      </div>
      <div class="system-status online">Actif</div>
    </div>
    <div class="system-item">
      <div class="system-info">
        <div class="system-name">Problèmes Détectés</div>
        <div class="system-stats">${endpointsSystem.issues} incidents</div>
      </div>
      <div class="system-status warning">Attention</div>
    </div>
  `;
}

function loadReportsData() {
  setTimeout(() => {
    createSOCMetricsChart();
  }, 100);
}

// Création des graphiques
function createThreatsChart() {
  const canvas = document.getElementById('threatsChart');
  if (!canvas || !canvas.getContext) return;
  
  // Détruire le graphique existant s'il existe
  if (charts.threats) {
    charts.threats.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Données simulées pour 7 jours
  const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const data = {
    labels: labels,
    datasets: [{
      label: 'Menaces Détectées',
      data: [12, 19, 8, 15, 22, 18, 25],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };
  
  charts.threats = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: '#334155'
          }
        },
        y: {
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: '#334155'
          }
        }
      }
    }
  });
}

function createThreatTypesChart() {
  const canvas = document.getElementById('threatTypesChart');
  if (!canvas || !canvas.getContext) return;
  
  // Détruire le graphique existant s'il existe
  if (charts.threatTypes) {
    charts.threatTypes.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  const data = {
    labels: mockData.threats.map(t => t.type),
    datasets: [{
      data: mockData.threats.map(t => t.count),
      backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
      borderColor: '#334155',
      borderWidth: 1
    }]
  };
  
  charts.threatTypes = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e2e8f0',
            padding: 20
          }
        }
      }
    }
  });
}

function createNetworkChart() {
  const canvas = document.getElementById('networkChart');
  if (!canvas || !canvas.getContext) return;
  
  // Détruire le graphique existant s'il existe
  if (charts.network) {
    charts.network.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  const data = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [{
      label: 'Trafic Entrant (Mbps)',
      data: [45, 23, 78, 92, 156, 134, 89],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4
    }, {
      label: 'Trafic Sortant (Mbps)',
      data: [35, 18, 65, 82, 124, 98, 67],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };
  
  charts.network = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: '#334155'
          }
        },
        y: {
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: '#334155'
          }
        }
      }
    }
  });
}

function createSOCMetricsChart() {
  const canvas = document.getElementById('socMetricsChart');
  if (!canvas || !canvas.getContext) return;
  
  // Détruire le graphique existant s'il existe
  if (charts.socMetrics) {
    charts.socMetrics.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [{
      label: 'Incidents Résolus (%)',
      data: [85, 92, 78, 96, 89, 94],
      backgroundColor: '#10b981',
    }, {
      label: 'Temps de Réponse (min)',
      data: [5.2, 4.8, 6.1, 4.2, 5.5, 4.2],
      backgroundColor: '#3b82f6',
      yAxisID: 'y1'
    }]
  };
  
  charts.socMetrics = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: '#334155'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: '#334155'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            drawOnChartArea: false,
            color: '#334155'
          }
        }
      }
    }
  });
}

// Filtres (corrigé)
function initFilters() {
  const statusFilter = document.getElementById('status-filter');
  const criticiteFilter = document.getElementById('criticite-filter');
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterIncidents);
  }
  
  if (criticiteFilter) {
    criticiteFilter.addEventListener('change', filterIncidents);
  }
}

function filterIncidents() {
  const statusFilter = document.getElementById('status-filter');
  const criticiteFilter = document.getElementById('criticite-filter');
  
  if (!statusFilter || !criticiteFilter) return;
  
  const statusValue = statusFilter.value;
  const criticiteValue = criticiteFilter.value;
  
  filteredIncidents = mockData.incidents.filter(incident => {
    let statusMatch = true;
    let criticiteMatch = true;
    
    if (statusValue && statusValue !== 'all') {
      const incidentStatus = incident.statut.toLowerCase().replace(' ', '-');
      statusMatch = incidentStatus === statusValue;
    }
    
    if (criticiteValue && criticiteValue !== 'all') {
      const incidentCriticite = incident.criticite.toLowerCase().replace('é', 'e');
      criticiteMatch = incidentCriticite === criticiteValue;
    }
    
    return statusMatch && criticiteMatch;
  });
  
  // Recharger la liste avec les incidents filtrés
  loadIncidentsList(true);
}

// Mises à jour en temps réel
function startRealTimeUpdates() {
  // Simulation de mises à jour toutes les 30 secondes
  setInterval(() => {
    updateMetrics();
    updateLastUpdateTime();
  }, 30000);
  
  // Simulation d'événements temps réel toutes les 10 secondes
  setInterval(() => {
    addNewSecurityEvent();
  }, 10000);
}

function updateMetrics() {
  // Simulation de changements dans les métriques
  const variations = {
    incidents_ouverts: Math.floor(Math.random() * 3) - 1, // -1, 0, ou 1
    menaces_detectees: Math.floor(Math.random() * 2) // 0 ou 1
  };
  
  mockData.metriques.incidents_ouverts = Math.max(0, mockData.metriques.incidents_ouverts + variations.incidents_ouverts);
  mockData.metriques.menaces_detectees = Math.max(0, mockData.metriques.menaces_detectees + variations.menaces_detectees);
  
  // Mettre à jour l'affichage si on est sur le dashboard
  if (currentPage === 'dashboard') {
    const incidentsElement = document.getElementById('incidents-ouverts');
    const menacesElement = document.getElementById('menaces-detectees');
    
    if (incidentsElement) {
      incidentsElement.textContent = mockData.metriques.incidents_ouverts;
    }
    if (menacesElement) {
      menacesElement.textContent = mockData.metriques.menaces_detectees;
    }
  }
}

function addNewSecurityEvent() {
  const newEvents = [
    "Nouvelle connexion VPN détectée",
    "Mise à jour de signature completée",
    "Scan de vulnérabilité programmé",
    "Backup des logs en cours",
    "Redémarrage du service de monitoring"
  ];
  
  const randomEvent = newEvents[Math.floor(Math.random() * newEvents.length)];
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  const newEvent = {
    timestamp: timestamp,
    message: randomEvent,
    severity: "info"
  };
  
  mockData.securityEvents.unshift(newEvent);
  
  // Garder seulement les 10 derniers événements
  if (mockData.securityEvents.length > 10) {
    mockData.securityEvents.pop();
  }
  
  // Mettre à jour l'affichage si on est sur la page de surveillance
  if (currentPage === 'monitoring') {
    loadSecurityEvents();
  }
}

function updateLastUpdateTime() {
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const element = document.getElementById('last-update-time');
  if (element) {
    element.textContent = timeString;
  }
}

// Gestionnaires d'événements
document.addEventListener('click', function(e) {
  // Bouton actualiser
  if (e.target.closest('.btn') && e.target.closest('.btn').textContent.includes('Actualiser')) {
    updateMetrics();
    updateLastUpdateTime();
    loadPageData(currentPage);
  }
  
  // Boutons d'action des incidents
  if (e.target.classList.contains('action-btn')) {
    const action = e.target.textContent;
    // Simuler une action
    e.target.style.opacity = '0.5';
    setTimeout(() => {
      e.target.style.opacity = '1';
    }, 500);
  }
});