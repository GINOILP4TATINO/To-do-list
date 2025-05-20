import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBw9_oMxgI1QwMqgkfiIYy0iQ1Lm7O1b7M",
  authDomain: "to-do-list-29fb3.firebaseapp.com",
  projectId: "to-do-list-29fb3",
  storageBucket: "to-do-list-29fb3.firebasestorage.app",
  messagingSenderId: "299539065118",
  appId: "1:299539065118:web:a4214710258d27f552010f",
  measurementId: "G-V8DRJPHY47",
  databaseURL:
    "https://to-do-list-29fb3-default-rtdb.europe-west1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const firstLog = localStorage.getItem("firstLog");
let uid;
if (localStorage.getItem("uid")) {
  uid = localStorage.getItem("uid");
  localStorage.removeItem("uid");
  sessionStorage.setItem("uid", uid);
} else if (sessionStorage.getItem("uid")) uid = sessionStorage.getItem("uid");
localStorage.removeItem("firstLog");

let projects = [];
let tasks = [];
let selectedProjectId = null;
let sortOrder = "asc";

let editingTaskId = null; // id della task in modifica o null
let editingProjId = null;

const projectList = document.getElementById("projectList");
const taskList = document.getElementById("taskList");
const openModalBtn = document.getElementById("openModalBtn");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const taskInput = document.getElementById("taskInput");
const descInput = document.getElementById("descInput");
const dueDateInput = document.getElementById("dueDateInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskTitle = document.getElementById("taskTitle");
const projTitle = document.getElementById("projTitle");

const openProjectModal = document.getElementById("openProjectModal");
const projectModal = document.getElementById("projectModal");
const closeProjectModal = document.getElementById("closeProjectModal");
const projectInput = document.getElementById("projectInput");
const addProjectBtn = document.getElementById("addProjectBtn");

const sortSelect = document.getElementById("sortSelect");
const filterSelect = document.getElementById("filterSelect");

const themeCheckbox = document.getElementById("themeCheckbox");
if (localStorage.getItem("theme")) {
  themeCheckbox.checked = localStorage.getItem("theme") === "true";
  localStorage.removeItem("theme");
  sessionStorage.setItem("theme", themeCheckbox.checked);
} else if (sessionStorage.getItem("theme"))
  themeCheckbox.checked = sessionStorage.getItem("theme");
document.body.classList.toggle("dark", themeCheckbox.checked);

const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("sidebarToggle");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

if (firstLog) {
  const defaultProject = {
    id: crypto.randomUUID(),
    name: "Progetto Predefinito",
  };

  projects.push(defaultProject);
  updateProjects();
  selectedProjectId = defaultProject.id;
}

const projectRef = ref(db, "projects/" + uid);
get(projectRef).then((snapshot) => {
  if (snapshot.val()) projects = snapshot.val();
  selectedProjectId = projects.length ? projects[0].id : null;
  renderProjects();
  renderTasks();
});

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

function isDueSoon(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  return due.toDateString() === today.toDateString();
}

function renderProjects() {
  projectList.innerHTML = "";
  projects.forEach((proj) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const span = document.createElement("span");
    span.textContent = proj.name;
    span.style.flexGrow = "1";
    span.style.cursor = "pointer";
    span.onclick = () => {
      selectedProjectId = proj.id;
      renderProjects();
      renderTasks();
    };

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "5px";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      openEditProjectModal(proj);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (
        confirm(
          "Sei sicuro di voler eliminare questo progetto? Tutte le task associate saranno eliminate."
        )
      ) {
        const index = projects.findIndex((p) => p.id === proj.id);
        if (index > -1) projects.splice(index, 1);
        for (let i = tasks.length - 1; i >= 0; i--) {
          if (tasks[i].projectId === proj.id) tasks.splice(i, 1);
        }
        if (selectedProjectId === proj.id)
          selectedProjectId = projects.length ? projects[0].id : null;
        updateProjects();
        renderProjects();
        renderTasks();
      }
    };

    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);

    li.classList.toggle("active", proj.id === selectedProjectId);
    li.appendChild(span);
    li.appendChild(buttonContainer);
    projectList.appendChild(li);
  });
}

async function renderTasks() {
  if (!selectedProjectId) {
    taskList.innerHTML = "<li>Nessun progetto selezionato</li>";
    return;
  }

  let tasksRef = ref(db, "tasks/" + selectedProjectId);
  await get(tasksRef).then((snapshot) => {
    tasks = snapshot.val() || [];
  });
  taskList.innerHTML = "";

  const filter = filterSelect.value;
  let filteredTasks = tasks;
  if (filter === "completed") filteredTasks = tasks.filter((t) => t.completed);
  else if (filter === "pending")
    filteredTasks = tasks.filter((t) => !t.completed);

  const sort = sortSelect.value;
  filteredTasks.sort((a, b) => {
    let comp;
    if (sort === "title") comp = a.title.localeCompare(b.title);
    else comp = new Date(a[sort]) - new Date(b[sort]);
    return sortOrder === "asc" ? comp : -comp;
  });

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.classList.toggle("completed", task.completed);
    const header = document.createElement("div");
    header.className = "task-header";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.onchange = () => {
      task.completed = checkbox.checked;
      updateTasks();
      renderTasks();
    };
    const titleSpan = document.createElement("span");
    titleSpan.textContent = task.title;
    if (task.completed) titleSpan.classList.add("completed");

    label.appendChild(checkbox);
    label.appendChild(titleSpan);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.onclick = () => {
      if (confirm("Sei sicuro di voler eliminare questa task?")) {
        tasks.splice(
          tasks.findIndex((t) => t.id === task.id),
          1
        );
        updateTasks();
        renderTasks();
      }
    };

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.className = "edit-btn";
    editBtn.onclick = () => {
      openEditTaskModal(task);
    };

    const controls = document.createElement("span");
    controls.appendChild(editBtn);
    controls.appendChild(removeBtn);

    header.appendChild(label);
    header.appendChild(controls);

    const details = document.createElement("div");
    details.className = "task-details";
    details.innerHTML = `Descrizione: ${task.desc || "Nessuna"}<br>Creato: ${
      task.createdAt
    }<br>Scadenza: ${task.due || "Nessuna"}`;

    li.appendChild(header);
    li.appendChild(details);

    if (isDueSoon(task.due) && !task.completed) {
      li.style.borderLeft = "5px solid red";
      li.style.backgroundColor = "#ffe6e6";

      if (!task.notified && Notification.permission === "granted") {
        new Notification("Task in scadenza!", {
          body: `${task.title} scade oggi.`,
        });
        task.notified = true;
      }
    }

    taskList.appendChild(li);
  });
}

function openEditTaskModal(task) {
  editingTaskId = task.id;
  taskInput.value = task.title;
  descInput.value = task.desc || "";
  dueDateInput.value = task.due || "";
  taskTitle.textContent = "Modifica Task";
  addTaskBtn.textContent = "Salva Modifiche";
  modal.classList.add("show");
}

function openEditProjectModal(proj) {
  editingProjId = proj.id;
  projectInput.value = proj.name;
  projTitle.textContent = "Modifica Progetto";
  addProjectBtn.textContent = "Salva Modifiche";
  projectModal.classList.add("show");
}

openModalBtn.onclick = () => {
  editingTaskId = null;
  taskInput.value = "";
  descInput.value = "";
  dueDateInput.value = "";
  taskTitle.textContent = "Nuova Task";
  addTaskBtn.textContent = "Aggiungi Task";
  modal.classList.add("show");
};

closeModal.onclick = () => {
  modal.classList.remove("show");
};

addTaskBtn.onclick = () => {
  const title = taskInput.value.trim();
  if (!title) {
    alert("Il titolo è obbligatorio.");
    return;
  }

  if (editingTaskId) {
    // Modifica task esistente
    const task = tasks.find((t) => t.id === editingTaskId);
    if (task) {
      task.title = title;
      task.desc = descInput.value.trim();
      task.due = dueDateInput.value;
    }
  } else {
    // Nuova task
    const newTask = {
      id: crypto.randomUUID(),
      title,
      desc: descInput.value.trim(),
      due: dueDateInput.value,
      createdAt: new Date().toLocaleDateString(),
      completed: false,
      projectId: selectedProjectId,
      notified: false,
    };
    tasks.push(newTask);
  }

  updateTasks();
  renderTasks();
  modal.classList.remove("show");
};

function updateProjects() {
  const projectRef = ref(db, "projects/" + uid);
  set(projectRef, projects);
}

function updateTasks() {
  if (!selectedProjectId) return;
  const tasksRef = ref(db, "tasks/" + selectedProjectId);
  set(tasksRef, tasks);
}

sortSelect.onchange = () => renderTasks();
filterSelect.onchange = () => renderTasks();

themeCheckbox.onchange = () => {
  document.body.classList.toggle("dark", themeCheckbox.checked);
  sessionStorage.setItem("theme", themeCheckbox.checked);
};

openProjectModal.onclick = () => {
  editingProjId = null;
  projectModal.classList.add("show");
  projectInput.value = "";
  projTitle.textContent = "Nuovo Progetto";
  addProjectBtn.textContent = "Crea";
};

closeProjectModal.onclick = () => {
  projectModal.classList.remove("show");
};

addProjectBtn.onclick = () => {
  const name = projectInput.value.trim();
  if (editingProjId) {
    // Modifica proj esistente
    const proj = projects.find((t) => t.id === editingProjId);
    if (proj) {
      proj.name = name;
    }
  } else {
    if (!name) {
      alert("Il nome del progetto è obbligatorio.");
      return;
    }

    let id = crypto.randomUUID();
    projects.push({ id, name });
    selectedProjectId = id;
    renderTasks();
  }

  updateProjects();
  renderProjects();
  projectModal.classList.remove("show");
};

renderProjects();
renderTasks();
