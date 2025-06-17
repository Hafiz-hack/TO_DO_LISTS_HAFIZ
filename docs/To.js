// JavaScript Complet - To-Do List Fonctionnelle avec recherche avancée

document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("taskForm");
  const taskName = document.getElementById("taskName");
  const taskDate = document.getElementById("taskDate");
  const taskPriority = document.getElementById("taskPriority");
  const searchInput = document.getElementById("search");
  const searchResultsBlock = document.getElementById("searchResults"); // <- corrigé ici
  const searchList = document.querySelector(".search-list");

  const confirmBox = document.getElementById("confirm-box");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmYes = document.getElementById("confirm-yes");
  const confirmNo = document.getElementById("confirm-no");

  const taskSections = {
    faible: document.querySelector("#faible .task-list"),
    moyenne: document.querySelector("#moyenne .task-list"),
    élevée: document.querySelector("#élevée .task-list"),
    archive: document.querySelector("#archive .task-list")
  };

  function saveTasks() {
    const tasks = [];
    document.querySelectorAll(".task-item").forEach(task => {
      tasks.push({
        name: task.querySelector(".name").value,
        date: task.querySelector(".date").value,
        priority: task.dataset.priority,
        done: task.querySelector(".done-checkbox").checked,
        archived: task.closest("section").id === "archive"
      });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function loadTasks() {
    const saved = JSON.parse(localStorage.getItem("tasks")) || [];
    saved.forEach(task =>
      createTask(task.name, task.date, task.priority, task.done, task.archived)
    );
  }

  function createTask(name, date, priority, done = false, archived = false) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.priority = priority;

    li.innerHTML = `
      <label class="task-label">
        <input type="checkbox" class="done-checkbox" ${done ? "checked" : ""} />
        <input class="name" value="${name}" />
        <input type="date" class="date" value="${date}" />
      </label>
      <input type="checkbox" class="select-checkbox" title="Sélectionner pour action" />
    `;

    if (done) li.classList.add("done");

    const section = archived ? taskSections.archive : taskSections[priority];
    section.appendChild(li);

    li.querySelector('.done-checkbox').addEventListener('change', e => updateTaskStyle(e.target));
    li.querySelector('.name').addEventListener('input', saveTasks);
    li.querySelector('.date').addEventListener('input', saveTasks);

    saveTasks();
    updateVisibility();
  }

  function updateTaskStyle(checkbox) {
    const task = checkbox.closest(".task-item");
    task.classList.toggle("done", checkbox.checked);
    saveTasks();
  }

  function getSelected() {
    return [...document.querySelectorAll(".task-item .select-checkbox:checked")].map(cb =>
      cb.closest(".task-item")
    );
  }

  function updateVisibility() {
    document.querySelectorAll(".task-list").forEach(list => {
      const items = list.querySelectorAll("li");
      items.forEach((el, i) => {
        el.style.display = list.classList.contains("show-all") || i === 0 ? "flex" : "none";
      });
    });
  }

  function confirmAction(message, callback) {
    confirmMessage.textContent = message;
    confirmBox.style.display = "flex";

    const onYes = () => {
      confirmBox.style.display = "none";
      confirmYes.removeEventListener("click", onYes);
      confirmNo.removeEventListener("click", onNo);
      callback();
    };

    const onNo = () => {
      confirmBox.style.display = "none";
      confirmYes.removeEventListener("click", onYes);
      confirmNo.removeEventListener("click", onNo);
    };

    confirmYes.addEventListener("click", onYes);
    confirmNo.addEventListener("click", onNo);
  }

  taskForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = taskName.value.trim();
    const date = taskDate.value;
    const priority = taskPriority.value;
    if (!name || !date || !priority) return;
    createTask(name, date, priority);
    taskName.value = "";
    taskDate.value = "";
    taskPriority.value = "";
  });

  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const list = btn.previousElementSibling;
      list.classList.toggle("show-all");
      btn.textContent = list.classList.contains("show-all") ? "Voir moins" : "Voir tout";
      updateVisibility();
    });
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    searchList.innerHTML = "";

    if (!query) {
      searchResultsBlock.style.display = "none";
      return;
    }

    const allTasks = Array.from(document.querySelectorAll(".task-item"));

    const results = allTasks
      .map(task => {
        const name = task.querySelector(".name").value.toLowerCase();
        const date = task.querySelector(".date").value;
        let score = 0;

        if (name.includes(query)) score += 1;
        if (date.includes(query)) score += 1;

        return { task, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (results.length === 0) {
      searchResultsBlock.style.display = "none";
      return;
    }

    results.forEach(({ task }) => {
      const clone = task.cloneNode(true);
      clone.classList.add("search-result");
      clone.dataset.origin = task.closest("section").id;

      clone.querySelector(".name").addEventListener("input", saveTasks);
      clone.querySelector(".date").addEventListener("input", saveTasks);
      clone.querySelector(".done-checkbox").addEventListener("change", (e) => {
        clone.classList.toggle("done", e.target.checked);
        saveTasks();
      });

      searchList.appendChild(clone);
    });

    searchResultsBlock.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    const insideSearch = searchInput.contains(e.target) || searchResultsBlock.contains(e.target);
    if (!insideSearch) {
      searchResultsBlock.style.display = "none";
    }
  });

  document.getElementById("deleteSelected").addEventListener("click", () => {
    const toDelete = getSelected();
    if (toDelete.length === 0) return;
    confirmAction("Supprimer les tâches sélectionnées ?", () => {
      toDelete.forEach(task => {
        task.classList.add("fade-out");
        setTimeout(() => task.remove(), 300);
      });
      setTimeout(saveTasks, 350);
    });
  });

  document.getElementById("archiveSelected").addEventListener("click", () => {
    const selected = getSelected();
    if (selected.length === 0) return;
    confirmAction("Archiver les tâches sélectionnées ?", () => {
      selected.forEach(task => taskSections.archive.appendChild(task));
      updateVisibility();
      saveTasks();
    });
  });

  document.getElementById("unarchiveSelected").addEventListener("click", () => {
    const selected = getSelected();
    if (selected.length === 0) return;
    confirmAction("Désarchiver les tâches sélectionnées ?", () => {
      selected.forEach(task => {
        const p = task.dataset.priority;
        taskSections[p].appendChild(task);
      });
      updateVisibility();
      saveTasks();
    });
  });

  document.addEventListener("change", e => {
    if (e.target.matches(".done-checkbox")) {
      updateTaskStyle(e.target);
    }
  });

  loadTasks();
  updateVisibility();
});
