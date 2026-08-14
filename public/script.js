const $ = id => document.getElementById(id);
let token = localStorage.getItem("taskflow_token");
let currentUser = null;
let tasks = [];
let activeFilter = "All";

function headers() {
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function api(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function toast(message) {
  $("toast").textContent = message; $("toast").style.display = "block";
  setTimeout(() => $("toast").style.display = "none", 2500);
}
function showApp() {
  $("authScreen").classList.add("hidden"); $("app").classList.remove("hidden");
}
function showAuth() {
  $("authScreen").classList.remove("hidden"); $("app").classList.add("hidden");
}
function setUser(user) {
  currentUser = user;
  $("welcomeName").textContent = user.name;
  $("userNameTop").textContent = user.name;
  $("profileName").textContent = user.name;
  $("profileEmail").textContent = user.email;
  $("profileAvatar").textContent = user.name.charAt(0).toUpperCase();
  $("avatar") && ($("avatar").textContent = user.name.charAt(0).toUpperCase());
}
function switchAuthMode() {
  const register = $("nameField").classList.toggle("hidden") === false;
  $("authTitle").textContent = register ? "Create your account" : "Welcome back";
  $("authSubtitle").textContent = register ? "Create an account to start managing tasks." : "Sign in to manage your tasks.";
  $("authButton").textContent = register ? "Create Account" : "Sign In";
  $("switchAuth").textContent = register ? "Sign in instead" : "Create one";
  $("authForm").dataset.mode = register ? "register" : "login";
}
$("switchAuth").addEventListener("click", switchAuthMode);
$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const mode = e.currentTarget.dataset.mode || "login";
  try {
    const data = await api(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify({
      name: $("name").value, email: $("email").value, password: $("password").value
    })});
    token = data.token; localStorage.setItem("taskflow_token", token); setUser(data.user);
    showApp(); await loadTasks(); toast("Welcome to TaskFlow!");
  } catch (err) { $("authMessage").textContent = err.message; }
});

async function loadTasks() {
  tasks = await api("/api/tasks"); renderTasks(); updateStats();
}
function updateStats() {
  $("totalCount").textContent = tasks.length;
  $("completedCount").textContent = tasks.filter(t => t.status === "Completed").length;
  $("progressCount").textContent = tasks.filter(t => t.status === "In Progress").length;
  $("pendingCount").textContent = tasks.filter(t => t.status === "Pending").length;
  $("notificationCount").textContent = tasks.filter(t => t.status !== "Completed").length;
}
function visibleTasks() {
  const q = $("search").value.toLowerCase().trim();
  return tasks.filter(t => (activeFilter === "All" || t.status === activeFilter) &&
    (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)));
}
function taskHTML(t) {
  const statusClass = t.status.replace(" ", "-");
  const date = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date";
  return `<article class="task">
    <div class="check ${t.status === "Completed" ? "done" : ""}">${t.status === "Completed" ? "✓" : ""}</div>
    <div><h3>${escapeHTML(t.title)}</h3><p>${escapeHTML(t.description || "No description")}</p></div>
    <span class="badge ${statusClass}">${t.status}</span>
    <span class="date">📅 ${date}</span>
    <div class="actions"><button onclick="editTask('${t._id}')">Edit</button><button onclick="deleteTask('${t._id}')">Delete</button></div>
  </article>`;
}
function renderTasks() {
  const html = visibleTasks().map(taskHTML).join("");
  $("taskList").innerHTML = html;
  $("allTaskList").innerHTML = tasks.map(taskHTML).join("");
  $("emptyState").classList.toggle("hidden", !!html);
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
$("search").addEventListener("input", renderTasks);
document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
  btn.classList.add("active"); activeFilter = btn.dataset.filter; renderTasks();
}));
$("taskForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/api/tasks", { method:"POST", body: JSON.stringify({
      title:$("taskTitle").value, description:$("taskDescription").value,
      status:$("taskStatus").value, dueDate:$("taskDueDate").value || null
    })});
    e.target.reset(); await loadTasks(); showView("dashboard"); toast("Task created!");
  } catch (err) { toast(err.message); }
});
window.editTask = id => {
  const t = tasks.find(x => x._id === id); if (!t) return;
  $("editId").value=id; $("editTitle").value=t.title; $("editDescription").value=t.description;
  $("editStatus").value=t.status; $("editDueDate").value=t.dueDate ? t.dueDate.slice(0,10) : "";
  $("editModal").classList.remove("hidden");
};
$("closeModal").onclick = () => $("editModal").classList.add("hidden");
$("editForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api(`/api/tasks/${$("editId").value}`, { method:"PUT", body:JSON.stringify({
      title:$("editTitle").value, description:$("editDescription").value,
      status:$("editStatus").value, dueDate:$("editDueDate").value || null
    })});
    $("editModal").classList.add("hidden"); await loadTasks(); toast("Task updated!");
  } catch(err){ toast(err.message); }
});
window.deleteTask = async id => {
  if (!confirm("Delete this task?")) return;
  try { await api(`/api/tasks/${id}`, {method:"DELETE"}); await loadTasks(); toast("Task deleted."); }
  catch(err){ toast(err.message); }
};
function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $(`${view}View`).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === view));
  if (view === "tasks") renderTasks();
}
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-view]");
  if (btn) showView(btn.dataset.view);
});
$("logout").onclick = () => { localStorage.removeItem("taskflow_token"); token=null; showAuth(); };
$("mobileMenu").onclick = () => document.querySelector(".sidebar").classList.toggle("open");

(async function init(){
  if (!token) return showAuth();
  try { setUser(await api("/api/auth/me")); showApp(); await loadTasks(); }
  catch { localStorage.removeItem("taskflow_token"); token=null; showAuth(); }
})();
