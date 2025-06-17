document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("taskForm");
  const taskName = document.getElementById("taskName");
  const taskDate = document.getElementById("taskDate");
  const taskPriority = document.getElementById("taskPriority");
  const searchInput = document.getElementById("search");
  const searchResultsBox = document.getElementById("searchResults");
  const searchList = document.querySelector(".search-list");

  const deleteBtn = document.getElementById("deleteSelected");
  const archiveBtn = document.getElementById("archiveSelected");
  const unarchiveBtn = document.getElementById("unarchiveSelected");

  const confirmBox = document.getElementById("confirm-box");
  const confirmYes = document.getElementById("confirm-yes");
  const confirmNo = document.getElementById("confirm-no");
  const confirmMsg = document.getElementById("confirm-message");

  let confirmCallback = null;

  const sections = {
    faible: document.querySelector("#faible .task-list"),
    moyenne: document.querySelector("#moyenne .task-list"),
    élevée: document.querySelector("#élevée .task-list"),
    archive: document.querySelector("#archive .task-list"),
  };

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function showConfirm(message, callback) {
    confirmMsg.textContent = message;
    confirmBox.style.display = "flex";
    confirmCallback = callback;
  }

  confirmYes.onclick = () => {
    confirmBox.style.display = "none";
    if (confirmCallback) confirmCallback();
  };

  confirmNo.onclick = () => {
    confirmBox.style.display = "none";
  };

  function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";
    if (task.done) li.classList.add("done");

    const label = document.createElement("label");
    label.className = "task-label";

    const doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.className = "done-checkbox";
    doneCheckbox.checked = task.done;

    const nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = task.name;

    const dateSpan = document.createElement("span");
    dateSpan.className = "date";
    dateSpan.textContent = task.date;

    label.append(doneCheckbox, nameSpan, dateSpan);

    const selectBox = document.createElement("input");
    selectBox.type = "checkbox";
    selectBox.className = "select-checkbox";

    li.append(label, selectBox);

    // Toggle done
    doneCheckbox.addEventListener("change", () => {
      task.done = doneCheckbox.checked;
      render();
      saveTasks();
    });

    return li;
  }

  function render() {
    Object.values(sections).forEach(ul => (ul.innerHTML = ""));

    const grouped = {
      faible: [],
      moyenne: [],
      élevée: [],
      archive: [],
    };

    tasks.forEach(t => grouped[t.archived ? "archive" : t.priority].push(t));

    Object.entries(grouped).forEach(([key, taskArray]) => {
      const container = sections[key];
      taskArray.forEach((task, index) => {
        const el = createTaskElement(task);
        if (index > 0) el.style.display = "none";
        container.appendChild(el);
      });
    });

    saveTasks();
  }

  // Ajouter une tâche
  taskForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = taskName.value.trim();
    const date = taskDate.value;
    const priority = taskPriority.value;

    if (!name || !date || !priority) return;

    const newTask = {
      id: Date.now(),
      name,
      date,
      priority,
      done: false,
      archived: false,
    };

    tasks.push(newTask);
    taskForm.reset();
    render();
    saveTasks();
  });

  // Voir tout / Voir moins
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const list = btn.previousElementSibling;
      const items = list.querySelectorAll(".task-item");
      const hidden = list.querySelector(".task-item[style*='none']");
      const allVisible = !hidden;

      items.forEach((item, i) => {
        if (i > 0) item.style.display = allVisible ? "none" : "flex";
      });

      btn.textContent = allVisible ? "Voir tout" : "Voir moins";
    });
  });

  // Recherche
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    searchResultsBox.style.display = query ? "block" : "none";
    searchList.innerHTML = "";

    if (!query) return;

    const matches = tasks
      .filter(t => t.name.toLowerCase().includes(query) || t.date.includes(query))
      .slice(0, 2);

    matches.forEach(task => {
      const el = createTaskElement(task);
      searchList.appendChild(el);
    });
  });

  document.body.addEventListener("click", e => {
    if (!searchResultsBox.contains(e.target) && e.target !== searchInput) {
      searchResultsBox.style.display = "none";
    }
  });

  // Action groupée
  function getSelectedTasks() {
    return tasks.filter(t =>
      document.querySelector(`.task-item input.select-checkbox[data-id="${t.id}"]`)?.checked
    );
  }

  function confirmAndApply(actionName, filterFn, updateFn) {
    const selected = [];
    document.querySelectorAll(".select-checkbox:checked").forEach(cb => {
      const name = cb.closest(".task-item").querySelector(".name").textContent;
      selected.push(name);
    });

    if (!selected.length) return;

    showConfirm(`Confirmer ${actionName} des tâches sélectionnées ?`, () => {
      tasks = tasks.map(t => {
        const match = document
          .querySelectorAll(".select-checkbox:checked")
          .some(cb => cb.closest(".task-item").querySelector(".name").textContent === t.name);
        return match && filterFn(t) ? updateFn(t) : t;
      });
      render();
    });
  }

  deleteBtn.addEventListener("click", () => {
    confirmAndApply("la suppression", t => true, () => null);
    tasks = tasks.filter(t =>
      !document
        .querySelectorAll(".select-checkbox:checked")
        .some(cb => cb.closest(".task-item").querySelector(".name").textContent === t.name)
    );
    render();
    saveTasks();
  });

  archiveBtn.addEventListener("click", () => {
    confirmAndApply("l'archivage", t => !t.archived, t => ({ ...t, archived: true }));
  });

  unarchiveBtn.addEventListener("click", () => {
    confirmAndApply("la désarchivage", t => t.archived, t => ({ ...t, archived: false }));
  });

  // Appliquer un data-id pour sélection future
  function updateCheckboxIDs() {
    tasks.forEach(t => {
      const els = document.querySelectorAll(".task-item");
      els.forEach(el => {
        if (
          el.querySelector(".name")?.textContent === t.name &&
          el.querySelector(".date")?.textContent === t.date
        ) {
          const cb = el.querySelector(".select-checkbox");
          if (cb) cb.setAttribute("data-id", t.id);
        }
      });
    });
  }

  // À chaque rendu, on met à jour les id
  const observer = new MutationObserver(() => updateCheckboxIDs());
  observer.observe(document.body, { childList: true, subtree: true });

  // Initialisation
  render();
});
