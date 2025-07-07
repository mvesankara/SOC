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
let allIncidentsData = []; // To store incidents fetched from API for client-side filtering

// Enums for form dropdowns (mirroring backend)
const CriticiteLevel = {
  CRITIQUE: "Critique",
  ELEVE: "Élevé",
  MOYEN: "Moyen",
  BAS: "Bas"
};

const StatutIncident = {
  OUVERT: "Ouvert",
  EN_COURS: "En cours",
  RESOLU: "Résolu",
  FERME: "Fermé"
};

// Pagination and Filter State
let currentIncidentsPage = 1;
const incidentsPerPage = 15; // Or make this configurable
let totalIncidents = 0;
let currentIncidentFilters = { status: null, criticite: null };

// DOM Elements for Auth
const loginView = document.getElementById('login-view');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form');
const loginErrorMessage = document.getElementById('login-error-message');
const showRegisterLink = document.getElementById('show-register-link');

// DOM Elements for Registration
const registrationView = document.getElementById('registration-view');
const registrationForm = document.getElementById('registration-form');
const registrationErrorMessage = document.getElementById('registration-error-message');
const showLoginLink = document.getElementById('show-login-link');

// DOM Elements for Pagination
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfoSpan = document.getElementById('page-info');


// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Initialiser la navigation
  initNavigation();
  
  // Charger les données initiales (will be conditional based on auth)
  // loadDashboardData();
  
  // Initialiser les filtres
  initFilters();
  
  // Démarrer les mises à jour en temps réel (will be conditional)
  // startRealTimeUpdates();
  
  // Mettre à jour l'heure (will be conditional)
  // updateLastUpdateTime();

  // Initialiser les interactions du modal
  initNewIncidentModal();

  // Initialize Auth related functionalities
  initAuth();
});


// --- Auth Functions ---
function storeToken(token) {
  localStorage.setItem('socaas_token', token);
}

function getToken() {
  return localStorage.getItem('socaas_token');
}

function clearToken() {
  localStorage.removeItem('socaas_token');
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (!loginForm || !loginErrorMessage) return;

  const username = loginForm.username.value;
  const password = loginForm.password.value;

  if (!username || !password) {
    loginErrorMessage.textContent = "Nom d'utilisateur et mot de passe requis.";
    loginErrorMessage.style.display = 'block';
    return;
  }
  loginErrorMessage.style.display = 'none';

  // FastAPI's OAuth2PasswordRequestForm expects form-urlencoded data
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await fetch('/api/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      loginErrorMessage.textContent = data.detail || `Erreur HTTP: ${response.status}`;
      loginErrorMessage.style.display = 'block';
      return;
    }

    storeToken(data.access_token);
    showAppLayout(); // Show main app, hide login
    loadDashboardData(); // Load initial data for the dashboard
    startRealTimeUpdates(); // Start updates now that user is logged in
    updateLastUpdateTime(); // Update time display

  } catch (error) {
    console.error("Erreur de connexion:", error);
    loginErrorMessage.textContent = "Erreur de connexion. Vérifiez la console pour plus de détails.";
    loginErrorMessage.style.display = 'block';
  }
}

async function handleDeleteIncident(incidentId) {
  const token = getToken();
  if (!token) {
    alert("Non authentifié. Veuillez vous reconnecter.");
    showLoginView();
    return;
  }

  try {
    const response = await fetch(`/api/v1/incidents/${incidentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken(); showLoginView();
        throw new Error("Session expirée. Suppression annulée. Veuillez vous reconnecter.");
      }
      // Try to get more specific error from backend if available
      const errorData = await response.json().catch(() => null);
      const detail = errorData && errorData.detail ? errorData.detail : `Erreur HTTP: ${response.status}`;
      throw new Error(detail);
    }

    // Status 204 No Content means successful deletion, no JSON body to parse.
    console.log(`Incident ${incidentId} supprimé avec succès.`);
    // When deleting, if it was the last item on a page, and that page > 1,
    // we might want to go to the previous page.
    // For simplicity now, just reload current page or page 1 if current becomes empty.
    if (allIncidentsData.length === 1 && currentIncidentsPage > 1) {
      await loadIncidentsList(currentIncidentsPage - 1, currentIncidentFilters);
    } else {
      await loadIncidentsList(currentIncidentsPage, currentIncidentFilters);
    }
    // await loadIncidentsList(); // Refresh the incidents list - old way

  } catch (error) {
    console.error(`Erreur lors de la suppression de l'incident ${incidentId}:`, error);
    alert(`Erreur: ${error.message}`); // Use alert for delete errors for now
  }
}

function showLoginView() {
  if (loginView) loginView.style.display = 'flex';
  if (registrationView) registrationView.style.display = 'none';
  if (appLayout) appLayout.style.display = 'none';
  if (loginForm) loginForm.reset();
  if (loginErrorMessage) loginErrorMessage.style.display = 'none';
}

function showRegistrationView() {
  if (loginView) loginView.style.display = 'none';
  if (registrationView) registrationView.style.display = 'flex'; // Assuming .registration-container uses flex
  if (appLayout) appLayout.style.display = 'none';
  if (registrationForm) registrationForm.reset();
  if (registrationErrorMessage) registrationErrorMessage.style.display = 'none';
}

function showAppLayout() {
  if (loginView) loginView.style.display = 'none';
  if (registrationView) registrationView.style.display = 'none';
  if (appLayout) appLayout.style.display = 'flex';
  if (typeof lucide !== 'undefined') {
      lucide.createIcons();
  }
  switchPage('dashboard');
}

function initAuth() {
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      clearToken();
      showLoginView();
      // Potentially clear other app state if needed
      // For now, just showing login view is the main action
      console.log("Utilisateur déconnecté.");
    });
  }
  // Initial check for token will be in step 7 (Conditional UI Rendering)
  checkAuthStatus(); // Call this to determine initial UI state
}

async function checkAuthStatus() {
  const token = getToken();
  if (token) {
    try {
      const response = await fetch('/api/v1/auth/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        // const user = await response.json(); // We can store user info if needed
        await response.json();
        console.log("Utilisateur authentifié via token existant.");
        showAppLayout();
        loadDashboardData(); // Load initial data for the dashboard
        startRealTimeUpdates();
        updateLastUpdateTime();
      } else {
        // Token is invalid or expired
        console.log("Token existant invalide ou expiré.");
        clearToken();
        showLoginView();
      }
    } catch (error) {
      // Network error or other issue validating token
      console.error("Erreur lors de la vérification du statut d'authentification:", error);
      clearToken(); // Clear potentially problematic token
      showLoginView();
    }
  } else {
    // No token found
    console.log("Aucun token trouvé, affichage de la page de connexion.");
    showLoginView();
  }
}


// --- Modal Functions ---
const newIncidentModal = document.getElementById('new-incident-modal');
const newIncidentBtn = document.getElementById('new-incident-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const newIncidentForm = document.getElementById('new-incident-form');
const criticiteSelect = document.getElementById('incident-criticite');
const statutSelect = document.getElementById('incident-statut');
const modalErrorMessage = document.getElementById('modal-error-message');

// DOM Elements for Edit Incident Modal
const editIncidentModal = document.getElementById('edit-incident-modal');
const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
const editModalCancelBtn = document.getElementById('edit-modal-cancel-btn');
const editIncidentForm = document.getElementById('edit-incident-form');
const editIncidentIdInput = document.getElementById('edit-incident-id');
const editIncidentTitleInput = document.getElementById('edit-incident-title');
const editIncidentCriticiteSelect = document.getElementById('edit-incident-criticite');
const editIncidentStatutSelect = document.getElementById('edit-incident-statut');
const editIncidentTypeInput = document.getElementById('edit-incident-type');
const editIncidentSourceInput = document.getElementById('edit-incident-source');
const editModalErrorMessage = document.getElementById('edit-modal-error-message');


function populateSelect(selectElement, enumObject,selectedValue = null) {
  if (!selectElement) return;
  // Clear existing options except for a potential placeholder if needed
  // selectElement.innerHTML = '<option value="">Sélectionnez...</option>';
  selectElement.innerHTML = ''; // Clear all
  for (const key in enumObject) {
    const option = document.createElement('option');
    option.value = enumObject[key]; // Use the string value for the option value
    option.textContent = enumObject[key]; // Display the string value
    if (selectedValue && enumObject[key] === selectedValue) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  }
}

function openNewIncidentModal() {
  if (!newIncidentModal || !newIncidentForm) return;
  newIncidentForm.reset(); // Reset form fields
  modalErrorMessage.style.display = 'none'; // Hide error message
  modalErrorMessage.textContent = '';
  newIncidentModal.style.display = 'block';
  // Populate dropdowns each time it opens, in case enums change (though unlikely for this app)
  populateSelect(criticiteSelect, CriticiteLevel);
  populateSelect(statutSelect, StatutIncident);
}

function closeNewIncidentModal() {
  if (!newIncidentModal) return;
  newIncidentModal.style.display = 'none';
}

function initNewIncidentModal() {
  if (newIncidentBtn) {
    newIncidentBtn.addEventListener('click', openNewIncidentModal);
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeNewIncidentModal);
  }
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', closeNewIncidentModal);
  }
  // Close modal if user clicks outside the modal content
  if (newIncidentModal) {
    newIncidentModal.addEventListener('click', function(event) {
      if (event.target === newIncidentModal) { // Clicked on the modal background (overlay)
        closeNewIncidentModal();
      }
    });
  }
  // Form submission will be handled in a separate function
  if (newIncidentForm) {
    newIncidentForm.addEventListener('submit', handleNewIncidentSubmit);
  }
  // Event listener for edit modal form submission will be added separately
}


// --- Edit Incident Modal Functions ---
async function openEditIncidentModal(incidentId) {
  if (!editIncidentModal || !editIncidentForm) return;

  try {
    const token = getToken();
    if (!token) {
      showLoginView();
      throw new Error("Non authentifié. Veuillez vous connecter.");
    }
    const response = await fetch(`/api/v1/incidents/${incidentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearToken(); showLoginView();
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      throw new Error(`Erreur HTTP: ${response.status} - Impossible de charger les détails de l'incident.`);
    }
    const incident = await response.json();

    // Populate form
    editIncidentIdInput.value = incident.id;
    editIncidentTitleInput.value = incident.title;
    populateSelect(editIncidentCriticiteSelect, CriticiteLevel, incident.criticite);
    populateSelect(editIncidentStatutSelect, StatutIncident, incident.statut);
    editIncidentTypeInput.value = incident.type || '';
    editIncidentSourceInput.value = incident.source || '';

    editModalErrorMessage.style.display = 'none';
    editModalErrorMessage.textContent = '';
    editIncidentModal.style.display = 'block';

  } catch (error) {
    console.error("Erreur lors de l'ouverture du modal de modification:", error);
    // Display a more general error to the user, perhaps not in the modal itself if it can't open
    alert(`Erreur: ${error.message}`);
  }
}

function closeEditIncidentModal() {
  if (editIncidentModal) {
    editIncidentModal.style.display = 'none';
  }
}

function initEditIncidentModalListeners() {
  // Event delegation for edit and delete buttons on the incidents list
  const incidentsListContainer = document.getElementById('incidents-list');
  if (incidentsListContainer) {
    incidentsListContainer.addEventListener('click', async function(event) { // Make async for delete
      const editButton = event.target.closest('.edit-btn');
      const deleteButton = event.target.closest('.delete-btn');

      if (editButton) {
        const incidentId = editButton.dataset.incidentId;
        if (incidentId) {
          openEditIncidentModal(incidentId);
        }
      } else if (deleteButton) {
        const incidentId = deleteButton.dataset.incidentId;
        if (incidentId) {
          if (confirm(`Êtes-vous sûr de vouloir supprimer l'incident #${incidentId} ?`)) {
            await handleDeleteIncident(incidentId);
          }
        }
      }
    });
  }

  if (editModalCloseBtn) {
    editModalCloseBtn.addEventListener('click', closeEditIncidentModal);
  }
  if (editModalCancelBtn) {
    editModalCancelBtn.addEventListener('click', closeEditIncidentModal);
  }
  if (editIncidentModal) {
    editIncidentModal.addEventListener('click', function(event) {
      if (event.target === editIncidentModal) {
        closeEditIncidentModal();
      }
    });
  }
  // Edit form submission listener
  if (editIncidentForm) {
    editIncidentForm.addEventListener('submit', handleEditIncidentSubmit);
  }
}

async function handleEditIncidentSubmit(event) {
  event.preventDefault();
  if (!editIncidentForm || !editModalErrorMessage || !editIncidentIdInput) return;

  const incidentId = editIncidentIdInput.value;

  // Basic client-side validation
  if (!editIncidentTitleInput.value.trim()) {
    editModalErrorMessage.textContent = "Le titre de l'incident est requis.";
    editModalErrorMessage.style.display = 'block';
    return;
  }
   if (!editIncidentCriticiteSelect.value) {
    editModalErrorMessage.textContent = "Veuillez sélectionner une criticité.";
    editModalErrorMessage.style.display = 'block';
    return;
  }
  if (!editIncidentStatutSelect.value) {
    editModalErrorMessage.textContent = "Veuillez sélectionner un statut.";
    editModalErrorMessage.style.display = 'block';
    return;
  }
  editModalErrorMessage.style.display = 'none'; // Clear previous errors

  const incidentUpdateData = {
    title: editIncidentTitleInput.value.trim(),
    criticite: editIncidentCriticiteSelect.value,
    statut: editIncidentStatutSelect.value,
    type: editIncidentTypeInput.value.trim() || null,
    source: editIncidentSourceInput.value.trim() || null,
  };

  const token = getToken();
  if (!token) {
    editModalErrorMessage.textContent = "Non authentifié. Veuillez vous reconnecter.";
    editModalErrorMessage.style.display = 'block';
    showLoginView();
    return;
  }

  try {
    const response = await fetch(`/api/v1/incidents/${incidentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(incidentUpdateData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken(); closeEditIncidentModal(); showLoginView();
        throw new Error("Session expirée. Modification annulée. Veuillez vous reconnecter.");
      }
      const errorData = await response.json().catch(() => ({ detail: "Erreur inconnue lors de la mise à jour de l'incident." }));
      throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
    }

    await response.json(); // Process the updated incident data if needed

    closeEditIncidentModal();
    await loadIncidentsList(); // Refresh the incidents list
    console.log(`Incident ${incidentId} mis à jour avec succès.`);

  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'incident ${incidentId}:`, error);
    editModalErrorMessage.textContent = `Erreur: ${error.message}`;
    editModalErrorMessage.style.display = 'block';
  }
}


// Modify initAuth to also initialize edit modal listeners
function initAuth() {
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      clearToken();
      showLoginView(); // Show login view on logout
      console.log("Utilisateur déconnecté.");
    });
  }

  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', function(event) {
      event.preventDefault();
      showRegistrationView();
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener('click', function(event) {
      event.preventDefault();
      showLoginView();
    });
  }

  checkAuthStatus();
  initEditIncidentModalListeners();

  // Add event listener for registration form
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegistrationSubmit);
  }

  // Add event listeners for pagination buttons
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentIncidentsPage > 1) {
        loadIncidentsList(currentIncidentsPage - 1, currentIncidentFilters);
      }
    });
  }
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(totalIncidents / incidentsPerPage);
      if (currentIncidentsPage < totalPages) {
        loadIncidentsList(currentIncidentsPage + 1, currentIncidentFilters);
      }
    });
  }
}

function updatePaginationUI() {
  if (!pageInfoSpan || !prevPageBtn || !nextPageBtn) return;

  if (totalIncidents === 0) {
    pageInfoSpan.textContent = ""; // Or "Aucun incident"
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    // Hide pagination controls entirely if no items
    const paginationControls = document.getElementById('incidents-pagination-controls');
    if (paginationControls) paginationControls.style.display = 'none';
    return;
  }

  // Ensure pagination controls are visible if there are items
  const paginationControls = document.getElementById('incidents-pagination-controls');
  if (paginationControls) paginationControls.style.display = 'flex';


  const totalPages = Math.ceil(totalIncidents / incidentsPerPage);
  pageInfoSpan.textContent = `Page ${currentIncidentsPage} sur ${totalPages}`;

  prevPageBtn.disabled = currentIncidentsPage <= 1;
  nextPageBtn.disabled = currentIncidentsPage >= totalPages;
}


async function loadIncidentsList(pageNumber = 1, filters = currentIncidentFilters) {
  const container = document.getElementById('incidents-list');
  if (!container) return;

  container.innerHTML = '<div class="loading-message">Chargement des incidents...</div>';
  currentIncidentsPage = pageNumber;
  currentIncidentFilters = filters; // Update global filters

  const skip = (pageNumber - 1) * incidentsPerPage;
  const limit = incidentsPerPage;

  const queryParams = new URLSearchParams({
    skip: skip,
    limit: limit,
  });

  if (filters.status && filters.status !== 'all') {
    queryParams.append('status', filters.status);
  }
  if (filters.criticite && filters.criticite !== 'all') {
    queryParams.append('criticite', filters.criticite);
  }

  try {
    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/incidents/?${queryParams.toString()}`, { headers });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        showLoginView();
        throw new Error("Session expirée ou invalide. Veuillez vous reconnecter.");
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json(); // schemas.IncidentList { items: [], total: 0 }
    allIncidentsData = data.items; // Store current page's items
    totalIncidents = data.total;   // Store total for pagination

    container.innerHTML = ''; // Clear loading message

    if (allIncidentsData.length === 0) {
      container.innerHTML = '<div class="empty-message">Aucun incident à afficher.</div>';
    } else {
      allIncidentsData.forEach(incident => {
        const incidentDiv = document.createElement('div');
        incidentDiv.className = 'incident-row';
        // ... (rest of the incident row creation logic remains the same)

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
          <button class="action-btn view-btn" data-incident-id="${incident.id}">Voir</button>
          <button class="action-btn edit-btn" data-incident-id="${incident.id}">Modifier</button>
          <button class="action-btn delete-btn" data-incident-id="${incident.id}">Supprimer</button>
        </div>
      </div>
    `;
    // TODO: Add styling for .view-btn, .edit-btn, .delete-btn (e.g., different colors) if desired
    // For now, they use the generic .action-btn style.
    container.appendChild(incidentDiv);
      });
    }
    updatePaginationUI(); // Call after data is loaded and list is rendered

  } catch (error) {
    console.error("Erreur lors du chargement des incidents:", error);
    container.innerHTML = `<div class="error-message">Impossible de charger les incidents: ${error.message}. Assurez-vous que le backend est en cours d'exécution.</div>`;
    updatePaginationUI(); // Also update (e.g., disable buttons) on error
  }
}


async function handleRegistrationSubmit(event) {
  event.preventDefault();
  if (!registrationForm || !registrationErrorMessage) return;

  const username = registrationForm.username.value.trim();
  const email = registrationForm.email.value.trim(); // Optional, can be empty
  const password = registrationForm.password.value;
  const confirmPassword = registrationForm.confirm_password.value;

  // Client-side validation
  if (!username || !password || !confirmPassword) {
    registrationErrorMessage.textContent = "Nom d'utilisateur, mot de passe et confirmation sont requis.";
    registrationErrorMessage.style.display = 'block';
    return;
  }
  if (password !== confirmPassword) {
    registrationErrorMessage.textContent = "Les mots de passe ne correspondent pas.";
    registrationErrorMessage.style.display = 'block';
    return;
  }
  registrationErrorMessage.style.display = 'none'; // Clear previous errors

  const userData = {
    username: username,
    email: email || null, // Send null if email is empty
    password: password,
  };

  try {
    const response = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json(); // Attempt to parse JSON for both success and error

    if (!response.ok) {
      registrationErrorMessage.textContent = data.detail || `Erreur HTTP: ${response.status}. Veuillez réessayer.`;
      registrationErrorMessage.style.display = 'block';
      return;
    }

    // Registration successful
    alert("Inscription réussie ! Vous pouvez maintenant vous connecter."); // Simple success message
    showLoginView(); // Redirect to login view

  } catch (error) {
    console.error("Erreur d'inscription:", error);
    registrationErrorMessage.textContent = "Erreur d'inscription. Vérifiez la console pour plus de détails.";
    registrationErrorMessage.style.display = 'block';
  }
}


async function handleNewIncidentSubmit(event) {
  event.preventDefault(); // Prevent default form submission (page reload)

  const titleInput = document.getElementById('incident-title');
  const typeInput = document.getElementById('incident-type');
  const sourceInput = document.getElementById('incident-source');

  // Basic client-side validation
  if (!titleInput.value.trim()) {
    modalErrorMessage.textContent = "Le titre de l'incident est requis.";
    modalErrorMessage.style.display = 'block';
    return;
  }
  if (!criticiteSelect.value) {
    modalErrorMessage.textContent = "Veuillez sélectionner une criticité.";
    modalErrorMessage.style.display = 'block';
    return;
  }
    if (!statutSelect.value) {
    modalErrorMessage.textContent = "Veuillez sélectionner un statut.";
    modalErrorMessage.style.display = 'block';
    return;
  }

  modalErrorMessage.style.display = 'none'; // Clear previous errors

  const incidentData = {
    title: titleInput.value.trim(),
    criticite: criticiteSelect.value,
    statut: statutSelect.value,
    type: typeInput.value.trim() || null, // Send null if empty, or backend handles empty string
    source: sourceInput.value.trim() || null // Send null if empty
  };

  try {
    const token = getToken();
    if (!token) {
      // Should not happen if UI is correctly managed, but as a safeguard
      modalErrorMessage.textContent = "Vous n'êtes pas connecté. Veuillez vous reconnecter.";
      modalErrorMessage.style.display = 'block';
      showLoginView();
      return;
    }

    const response = await fetch('/api/v1/incidents/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(incidentData),
    });

    if (!response.ok) {
      if (response.status === 401) { // Unauthorized
        clearToken();
        closeNewIncidentModal(); // Close modal before redirecting
        showLoginView();
        // Display a more general error or alert for session expiry if possible
        // For now, the login view will appear.
        throw new Error("Session expirée ou invalide. Création annulée. Veuillez vous reconnecter.");
      }
      const errorData = await response.json().catch(() => ({ detail: "Erreur inconnue lors de la création de l'incident." }));
      throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
    }

    // const newIncident = await response.json(); // If you need to use the created incident data
    await response.json();

    closeNewIncidentModal();
    await loadIncidentsList(); // Refresh the incidents list

    // Optional: Show a success message (e.g., using a temporary toast notification, not implemented here)
    console.log("Incident créé avec succès.");

  } catch (error) {
    console.error("Erreur lors de la création de l'incident:", error);
    modalErrorMessage.textContent = `Erreur: ${error.message}`;
    modalErrorMessage.style.display = 'block';
  }
}


// --- Navigation ---
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
  
  container.innerHTML = '<div class="loading-message">Chargement état des systèmes...</div>';

  try {
    const token = getToken();
    if (!token) {
      // This part of the dashboard shouldn't ideally be reached if not authenticated
      // but as a safeguard:
      container.innerHTML = '<div class="error-message">Authentification requise.</div>';
      return;
    }

    const response = await fetch('/api/v1/systems/', { // Using the CRUD API for systems
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken(); showLoginView();
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const systems = await response.json(); // Expects a List[schemas.SystemRead]
    container.innerHTML = ''; // Clear loading message

    if (!systems || systems.length === 0) {
      container.innerHTML = '<div class="empty-message">Aucun système à afficher.</div>';
      return;
    }

    systems.forEach(system => {
      const systemDiv = document.createElement('div');
      systemDiv.className = 'system-item';

      // Map status from SystemStateType enum to CSS class and display text
      let statusClass = 'offline'; // Default
      let statusText = 'Hors ligne';
      if (system.status === SystemStateType.ONLINE) {
        statusClass = 'online';
        statusText = 'En ligne';
      } else if (system.status === SystemStateType.WARNING) {
        statusClass = 'warning';
        statusText = 'Attention';
      }
      // OFFLINE is already default

      let statsHtml = [];
      if (system.cpu_usage_percent !== null) { // Check for null explicitly for numbers
        statsHtml.push(`CPU: ${system.cpu_usage_percent}%`);
      }
      if (system.memory_usage_percent !== null) {
         statsHtml.push(`RAM: ${system.memory_usage_percent}%`);
      }
      if (system.name === "Endpoints" && system.monitored_endpoints_count !== null) { // Example specific logic
         statsHtml.push(`${system.monitored_endpoints_count} endpoints surveillés`);
         if (system.endpoint_issues_count !== null && system.endpoint_issues_count > 0) {
            statsHtml.push(`${system.endpoint_issues_count} problèmes`);
         }
      }

      systemDiv.innerHTML = `
        <div class="system-info">
          <div class="system-name">${system.name}</div>
          <div class="system-stats">${statsHtml.join(' | ')}</div>
        </div>
        <div class="system-status ${statusClass}">${statusText}</div>
      `;
      container.appendChild(systemDiv);
    });

  } catch (error) {
    console.error("Erreur lors du chargement de l'état des systèmes:", error);
    container.innerHTML = `<div class="error-message">Impossible de charger l'état des systèmes: ${error.message}</div>`;
  }
}

// Make loadSystemsStatus async as it now contains fetch
async function loadSystemsStatus() { // Signature changed to async
  const container = document.getElementById('systems-status');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-message">Chargement état des systèmes...</div>';

  try {
    const token = getToken();
    if (!token) {
      container.innerHTML = '<div class="error-message">Authentification requise.</div>';
      return;
    }

    // Using /api/v1/dashboard/systems-status as it's designed for this display
    // and currently returns the static mock-like data structure.
    // If we want to list systems from the `systems` table, we'd use GET /api/v1/systems/
    // For now, let's assume the dashboard/systems-status is what we want for this specific UI element.
    const response = await fetch('/api/v1/dashboard/systems-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken(); showLoginView();
        // Error will be caught by the main catch block below
        throw new Error("Session expirée. Veuillez vous reconnecter pour voir l'état des systèmes.");
      }
      throw new Error(`Erreur HTTP: ${response.status} lors de la récupération de l'état des systèmes.`);
    }

    const systemsData = await response.json(); // Expects List[schemas.SystemStatus]
                                           // which matches the structure of mockData.systems
    container.innerHTML = ''; // Clear loading message

    if (!systemsData || systemsData.length === 0) {
      container.innerHTML = '<div class="empty-message">Aucun système à afficher.</div>';
      return;
    }

    systemsData.forEach(system => {
      const systemDiv = document.createElement('div');
      systemDiv.className = 'system-item';

      // system.status from API should directly match "Online", "Warning", "Offline"
      const statusClass = system.status ? system.status.toLowerCase() : 'offline';
      let statusText = 'Hors ligne';
      if (system.status === 'Online') statusText = 'En ligne';
      else if (system.status === 'Warning') statusText = 'Attention';

      // Build stats string carefully based on what SystemStatus schema provides
      // The SystemStatus schema has: name, status, cpu, memory, monitored, issues
      // These match the old mockData structure.
      let statsArray = [];
      if (system.cpu) statsArray.push(`CPU: ${system.cpu}`);
      if (system.memory) statsArray.push(`RAM: ${system.memory}`);
      if (system.monitored !== undefined) statsArray.push(`${system.monitored} endpoints surveillés`);
      if (system.issues !== undefined && system.issues > 0) statsArray.push(`${system.issues} problèmes`);

      systemDiv.innerHTML = `
        <div class="system-info">
          <div class="system-name">${system.name}</div>
          <div class="system-stats">${statsArray.join(' | ')}</div>
        </div>
        <div class="system-status ${statusClass}">${statusText}</div>
      `;
      container.appendChild(systemDiv);
    });

  } catch (error) {
    console.error("Erreur lors du chargement de l'état des systèmes:", error);
    if (container) { // Ensure container still exists
        container.innerHTML = `<div class="error-message">Impossible de charger l'état des systèmes: ${error.message}</div>`;
    }
  }
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

async function loadIncidentsList(pageNumber = 1, filters = currentIncidentFilters) {
  const container = document.getElementById('incidents-list');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-message">Chargement des incidents...</div>';
  currentIncidentsPage = pageNumber;
  currentIncidentFilters = filters; // Update global filters

  const skip = (pageNumber - 1) * incidentsPerPage;
  const limit = incidentsPerPage;

  const queryParams = new URLSearchParams({
    skip: skip,
    limit: limit,
  });

  if (filters.status && filters.status !== 'all') {
    queryParams.append('status', filters.status);
  }
  if (filters.criticite && filters.criticite !== 'all') {
    queryParams.append('criticite', filters.criticite);
  }

  try {
    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/incidents/?${queryParams.toString()}`, { headers });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        showLoginView();
        throw new Error("Session expirée ou invalide. Veuillez vous reconnecter.");
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json(); // schemas.IncidentList { items: [], total: 0 }
    allIncidentsData = data.items; // Store current page's items
    totalIncidents = data.total;   // Store total for pagination

    container.innerHTML = ''; // Clear loading message

    if (allIncidentsData.length === 0) {
      container.innerHTML = '<div class="empty-message">Aucun incident à afficher.</div>';
    } else {
      allIncidentsData.forEach(incident => {
        const incidentDiv = document.createElement('div');
        incidentDiv.className = 'incident-row';
        // ... (rest of the incident row creation logic remains the same)
    
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
          <button class="action-btn view-btn" data-incident-id="${incident.id}">Voir</button>
          <button class="action-btn edit-btn" data-incident-id="${incident.id}">Modifier</button>
          <button class="action-btn delete-btn" data-incident-id="${incident.id}">Supprimer</button>
        </div>
      </div>
    `;
    // TODO: Add styling for .view-btn, .edit-btn, .delete-btn (e.g., different colors) if desired
    // For now, they use the generic .action-btn style.
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
  
  const newFilters = {
    status: statusValue !== 'all' ? statusValue : null,
    criticite: criticiteValue !== 'all' ? criticiteValue : null,
  };

  // Call loadIncidentsList with the new filters, resetting to page 1
  loadIncidentsList(1, newFilters);
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