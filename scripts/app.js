// Variables globales
let users = [];
let userCalendars = {};
let selectedUserId = null;
let editUserId = null;

// Cargar usuarios de localStorage al iniciar
function loadUsersFromLocalStorage() {
    users = JSON.parse(localStorage.getItem('users')) || [];
}

// Guardar usuarios en localStorage
function saveUsersToLocalStorage() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Cargar calendarios de usuarios de localStorage
function loadUserCalendarsFromLocalStorage() {
    const storedCalendars = JSON.parse(localStorage.getItem('userCalendars')) || {};
    for (const userId in storedCalendars) {
        userCalendars[userId] = new Set(storedCalendars[userId]);
    }
}

// Guardar calendarios de usuarios en localStorage
function saveUserCalendarsToLocalStorage() {
    const calendarsToStore = {};
    for (const userId in userCalendars) {
        calendarsToStore[userId] = Array.from(userCalendars[userId]);
    }
    localStorage.setItem('userCalendars', JSON.stringify(calendarsToStore));
}

// Función para habilitar o deshabilitar enlaces de navegación
function toggleNavLinks(disable) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(link => {
        link.classList.toggle("disabled", disable);
    });
}

// Mostrar formulario de usuario (creación/edición)
function showUserForm(userId = null) {
    editUserId = userId;
    toggleNavLinks(true);

    if (userId !== null) {
        const user = users.find(u => u.id === userId);
        document.getElementById('formTitle').textContent = 'Editar Usuario';
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
    } else {
        document.getElementById('formTitle').textContent = 'Crear Usuario';
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
    }

    document.getElementById('userFormSection').style.display = 'block';
    document.getElementById('userListSection').style.display = 'none';
}

// Cancelar y ocultar formulario de usuario
function cancelUserForm() {
    editUserId = null;
    toggleNavLinks(false);
    document.getElementById('userFormSection').style.display = 'none';
    document.getElementById('userListSection').style.display = 'block';
}

// Guardar usuario (nuevo o editado)
function saveUser() {
    const userName = document.getElementById('userName').value.trim();
    const userEmail = document.getElementById('userEmail').value.trim();

    if (userName && userEmail) {
        if (editUserId === null) {
            const newUser = {
                id: Date.now(),
                name: userName,
                email: userEmail
            };
            users.push(newUser);
            userCalendars[newUser.id] = new Set();
        } else {
            const user = users.find(u => u.id === editUserId);
            user.name = userName;
            user.email = userEmail;
            editUserId = null;
        }
        saveUsersToLocalStorage(); // Guarda los usuarios en localStorage
        updateUserSelect();
        updateUserList();
        cancelUserForm();
    } else {
        alert("Por favor, completa todos los campos.");
    }
}

// Actualizar lista de usuarios
function updateUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // Limpia la lista para volver a llenarla
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <button class="edit-btn" data-id="${user.id}">Editar</button>
                <button class="delete-btn" data-id="${user.id}">Borrar</button>
            </td>
        `;
        userList.appendChild(row);
    });

    // Asignar eventos a los botones de editar y borrar
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            showUserForm(Number(userId)); // Llama a showUserForm con el ID del usuario
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            deleteUser(Number(userId)); // Llama a deleteUser con el ID del usuario
        });
    });
}

// Eliminar usuario
function deleteUser(userId) {
    // Filtramos el usuario a eliminar y actualizamos la lista de usuarios
    users = users.filter(user => user.id !== userId);
    delete userCalendars[userId];
    saveUsersToLocalStorage(); // Guarda los cambios en localStorage
    saveUserCalendarsToLocalStorage(); // Guarda los calendarios en localStorage

    // Llamamos a updateUserList para refrescar la tabla en pantalla al instante
    updateUserList();
}

// Actualizar select de usuario en calendario
function updateUserSelect() {
    const userSelect = document.getElementById("userSelect");
    userSelect.innerHTML = '';
    users.forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        userSelect.appendChild(option);
    });
    if (users.length > 0) {
        selectedUserId = users[0].id;
        userSelect.value = selectedUserId;
    }
    loadUserCalendar();
}

// Seleccionar o deseleccionar un día en el calendario del usuario
function toggleDaySelection(monthIndex, day) {
    if (!selectedUserId) return;
    const selectedYear = document.getElementById("calendarYearSelect").value;
    const dayId = `${selectedYear}-${monthIndex}-${day}`;
    const userCalendar = userCalendars[selectedUserId] || new Set();

    if (userCalendar.has(dayId)) {
        userCalendar.delete(dayId);
    } else {
        userCalendar.add(dayId);
    }

    userCalendars[selectedUserId] = userCalendar;
    saveUserCalendarsToLocalStorage(); // Guarda el calendario en localStorage
    loadUserCalendar(); // Recarga la visualización del calendario del usuario
}

// Cargar el calendario del usuario seleccionado
function loadUserCalendar() {
    resetCalendar("calendarContainer");
    const userCalendar = userCalendars[selectedUserId];
    const selectedYear = document.getElementById("calendarYearSelect").value;

    if (userCalendar) {
        userCalendar.forEach(dayId => {
            const [year, monthIndex, day] = dayId.split("-").map(Number);
            if (year == selectedYear) {
                const dayElement = document.querySelector(
                    `#calendarContainer .month:nth-child(${monthIndex + 1}) .days .day:nth-child(${day + new Date(year, monthIndex, 1).getDay() - 1})`
                );
                if (dayElement) dayElement.classList.add("selected");
            }
        });
    }
}

// Reiniciar el calendario a su estado inicial
function resetCalendar(containerId) {
    document.getElementById(containerId).querySelectorAll(".day").forEach(day => {
        day.classList.remove("selected", "conflict");
        const tooltip = day.querySelector(".tooltip");
        if (tooltip) tooltip.remove();
    });
}

// Generar calendario anual
function generateAnnualCalendar(containerId, isAdmin = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const selectedYear = document.getElementById(isAdmin ? 'adminYearSelect' : 'calendarYearSelect').value;
    const months = [
        { name: "Enero", days: 31 },
        { name: "Febrero", days: (selectedYear % 4 === 0) ? 29 : 28 },
        { name: "Marzo", days: 31 },
        { name: "Abril", days: 30 },
        { name: "Mayo", days: 31 },
        { name: "Junio", days: 30 },
        { name: "Julio", days: 31 },
        { name: "Agosto", days: 31 },
        { name: "Septiembre", days: 30 },
        { name: "Octubre", days: 31 },
        { name: "Noviembre", days: 30 },
        { name: "Diciembre", days: 31 },
    ];

    months.forEach((month, monthIndex) => {
        const monthDiv = document.createElement("div");
        monthDiv.classList.add("month");

        const monthName = document.createElement("div");
        monthName.classList.add("month-name");
        monthName.textContent = month.name;
        monthDiv.appendChild(monthName);

        const dayNamesDiv = document.createElement("div");
        dayNamesDiv.classList.add("day-names");
        ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach(day => {
            const dayName = document.createElement("div");
            dayName.textContent = day;
            dayNamesDiv.appendChild(dayName);
        });
        monthDiv.appendChild(dayNamesDiv);

        const daysDiv = document.createElement("div");
        daysDiv.classList.add("days");

        const firstDayOffset = new Date(selectedYear, monthIndex, 1).getDay() || 7;
        for (let i = 1; i < firstDayOffset; i++) {
            daysDiv.appendChild(document.createElement("div"));
        }

        for (let day = 1; day <= month.days; day++) {
            const dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.textContent = day;

            // Agregar el evento onclick para los días en el calendario del usuario (no en el de administración)
            if (!isAdmin) {
                dayElement.onclick = () => toggleDaySelection(monthIndex, day);
            }
            
            daysDiv.appendChild(dayElement);
        }

        monthDiv.appendChild(daysDiv);
        container.appendChild(monthDiv);
    });
}

// Cargar calendario de administrador con colores de usuarios
function loadAdminCalendar() {
    // Genera el calendario de administración
    generateAnnualCalendar("adminCalendarContainer", true);
    resetCalendar("adminCalendarContainer");

    // Lista de colores para los usuarios (10 colores)
    const colors = [
        "#FFFF33", "#FF5733", "#33FF57", "#3357FF", "#F39C12", "#8E44AD", 
        "#1ABC9C", "#3498DB", "#E74C3C", "#9B59B6", "#FFFF00"  // amarillo chillón
    ];

    // Contenedor para la leyenda de colores de usuarios
    const legendContainer = document.getElementById("legend");
    legendContainer.innerHTML = ''; // Limpia la leyenda anterior

    // Mapa para rastrear conflictos en los días seleccionados
    const dayConflictMap = new Map();
    const selectedYear = document.getElementById("adminYearSelect").value;

    // Asignación de colores y llenado de los días seleccionados por usuario
    users.forEach((user, index) => {
        const color = colors[index % colors.length];
        const userCalendar = userCalendars[user.id] || new Set();

        // Recorre cada día seleccionado por el usuario
        userCalendar.forEach(dayId => {
            const [year, monthIndex, day] = dayId.split("-").map(Number);
            if (year == selectedYear) {
                const dayKey = `${monthIndex}-${day}`;

                // Inicializa una lista de usuarios en conflicto para el día específico si no existe
                if (!dayConflictMap.has(dayKey)) {
                    dayConflictMap.set(dayKey, []);
                }
                // Agrega el usuario actual a la lista de conflictos para el día específico
                dayConflictMap.get(dayKey).push({ name: user.name, color });
            }
        });

        // Crea la leyenda de usuario y color
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");
        const legendColor = document.createElement("div");
        legendColor.classList.add("legend-color");
        legendColor.style.backgroundColor = color;
        legendItem.appendChild(legendColor);
        legendItem.appendChild(document.createTextNode(user.name));
        legendContainer.appendChild(legendItem);
    });

    // Colorear los días en el calendario con sus colores y conflictos
    dayConflictMap.forEach((userData, dayKey) => {
        const [monthIndex, day] = dayKey.split("-").map(Number);
        const dayElement = document.querySelector(
            `#adminCalendarContainer .month:nth-child(${monthIndex + 1}) .days .day:nth-child(${day + new Date(selectedYear, monthIndex, 1).getDay() - 1})`
        );

        // Si solo un usuario ha seleccionado el día, aplica su color sin conflicto
        if (userData.length === 1) {
            dayElement.style.backgroundColor = userData[0].color;
        } 
        // Si hay múltiples usuarios, marca como conflicto
        else if (userData.length > 1) {
            dayElement.style.backgroundColor = "black";
            dayElement.classList.add("conflict");

            // Crea el tooltip de conflicto
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.textContent = "Conflicto entre: " + userData.map(u => u.name).join(", ");
            dayElement.appendChild(tooltip);
        }
    });
}


// Cambiar el usuario seleccionado
function changeSelectedUser() {
    selectedUserId = document.getElementById("userSelect").value;
    loadUserCalendar();
}

// Mostrar la sección seleccionada
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    if (sectionId === "admin") {
        loadAdminCalendar();
    } else if (sectionId === "calendario") {
        generateAnnualCalendar("calendarContainer");
    } else if (sectionId === "usuarios") {
        document.getElementById('userFormSection').style.display = 'none';
        document.getElementById('userListSection').style.display = 'block';
    }
}

// Inicialización de la lista de usuarios y calendarios desde localStorage y actualización en pantalla
loadUsersFromLocalStorage();
loadUserCalendarsFromLocalStorage();
updateUserList();
updateUserSelect();
