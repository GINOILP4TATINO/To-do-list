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
const uid = localStorage.getItem("uid");
localStorage.removeItem("uid");
localStorage.removeItem("firstLog");

let projects = [];
let tasks = [];
let selectedProjectId = null;
let sortOrder = "asc";

const projectList = document.getElementById("projectList");
const taskList = document.getElementById("taskList");
const openModalBtn = document.getElementById("openModalBtn");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const taskInput = document.getElementById("taskInput");
const descInput = document.getElementById("descInput");
const dueDateInput = document.getElementById("dueDateInput");
const addTaskBtn = document.getElementById("addTaskBtn");

const openProjectModal = document.getElementById("openProjectModal");
const projectModal = document.getElementById("projectModal");
const closeProjectModal = document.getElementById("closeProjectModal");
const projectInput = document.getElementById("projectInput");
const addProjectBtn = document.getElementById("addProjectBtn");

const sortSelect = document.getElementById("sortSelect");
const filterSelect = document.getElementById("filterSelect");

const themeCheckbox = document.getElementById("themeCheckbox");
themeCheckbox.checked = localStorage.getItem("theme") === "true";
document.body.classList.toggle("dark", themeCheckbox.checked);
localStorage.removeItem("theme");

const toggleSortOrderBtn = document.getElementById("toggleSortOrderBtn"); // pulsante cambia ordine

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
  selectedProjectId = projects[0].id;
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
      const newName = prompt("Modifica il nome del progetto:", proj.name);
      if (newName) {
        proj.name = newName;
        updateProjects();
        renderProjects();
      }
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
  let tasksRef = ref(db, "tasks/" + selectedProjectId);
  await get(tasksRef).then((snapshot) => {
    tasks = snapshot.val() || [];
  });
  taskList.innerHTML = "";
  // let filtered = tasks.filter((t) => t.projectId === selectedProjectId);

  const filter = filterSelect.value;
  if (filter === "completed") tasks = tasks.filter((t) => t.completed);
  if (filter === "pending") tasks = tasks.filter((t) => !t.completed);

  const sort = sortSelect.value;
  tasks.sort((a, b) => {
    let comp;
    if (sort === "title") comp = a.title.localeCompare(b.title);
    else comp = new Date(a[sort]) - new Date(b[sort]);
    return sortOrder === "asc" ? comp : -comp; // applico ordine asc/desc
  });

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
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
      tasks.splice(index, 1);
      updateTasks();
      renderTasks();
    };

    header.appendChild(label);
    header.appendChild(removeBtn);

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

openModalBtn.onclick = () => modal.classList.add("show");
closeModal.onclick = () => modal.classList.remove("show");
openProjectModal.onclick = () => projectModal.classList.add("show");
closeProjectModal.onclick = () => projectModal.classList.remove("show");

addProjectBtn.onclick = () => {
  const name = projectInput.value.trim();
  if (!name) return;
  const id = crypto.randomUUID();
  projects.push({ id, name });
  updateProjects();
  selectedProjectId = id;
  projectInput.value = "";
  projectModal.classList.remove("show");
  renderProjects();
};

addTaskBtn.onclick = () => {
  const title = taskInput.value.trim();
  const desc = descInput.value.trim();
  const due = dueDateInput.value;

  if (!selectedProjectId) {
    alert(
      "Non è possibile creare una task senza aver selezionato un progetto. Crea o seleziona un progetto prima."
    );
    return;
  }

  if (!title) return;

  const task = {
    id: crypto.randomUUID(),
    title,
    desc,
    due,
    createdAt: new Date().toISOString(),
    completed: false,
    projectId: selectedProjectId,
    notified: false,
  };

  tasks.push(task);
  updateTasks();
  modal.classList.remove("show");
  taskInput.value = "";
  descInput.value = "";
  dueDateInput.value = "";
  renderTasks();
};

// Aggiorna le tasks al cambiare filtro o ordinamento
filterSelect.addEventListener("change", renderTasks);
sortSelect.addEventListener("change", renderTasks);

// Gestione toggle ordine asc/desc
toggleSortOrderBtn.onclick = () => {
  if (sortOrder === "asc") {
    sortOrder = "desc";
    toggleSortOrderBtn.textContent = "⬇️";
  } else {
    sortOrder = "asc";
    toggleSortOrderBtn.textContent = "⬆️";
  }
  renderTasks();
};

window.onclick = (event) => {
  if (event.target === modal) modal.classList.remove("show");
  if (event.target === projectModal) projectModal.classList.remove("show");
};

themeCheckbox.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});
function updateTasks() {
  set(ref(db, "tasks/" + selectedProjectId), tasks);
}
function updateProjects() {
  set(ref(db, "projects/" + uid), projects);
}
