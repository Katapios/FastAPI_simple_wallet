import { api } from "./api.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let wallets = [];

function showToast(message, type = "success") {
  const container = $("#toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatAmount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function operationTypeLabel(type) {
  const map = { income: "Доход", expense: "Расход", transfer: "Перевод" };
  return map[type] || type;
}

function operationTypeClass(type) {
  return `type-${type}`;
}

function showAuth() {
  $("#auth-screen").classList.remove("hidden");
  $("#app-screen").classList.add("hidden");
}

function showApp() {
  $("#auth-screen").classList.add("hidden");
  $("#app-screen").classList.remove("hidden");
}

function fillWalletSelects() {
  const selects = ["#income-wallet", "#expense-wallet", "#filter-wallet", "#transfer-from", "#transfer-to"];
  selects.forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    const current = el.value;
    const isFilter = sel === "#filter-wallet";
    el.innerHTML = isFilter ? '<option value="">Все кошельки</option>' : "";
    wallets.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = isFilter || sel.includes("transfer") ? w.id : w.name;
      opt.textContent = `${w.name} (${formatAmount(w.balance)} ${w.currency.toUpperCase()})`;
      el.appendChild(opt);
    });
    if (current) el.value = current;
  });
}

function renderWallets() {
  const list = $("#wallet-list");
  if (!wallets.length) {
    list.innerHTML = '<li class="empty-state">Кошельков пока нет. Создайте первый.</li>';
    return;
  }

  list.innerHTML = wallets
    .map(
      (w) => `
    <li class="wallet-item">
      <div>
        <span class="name">${escapeHtml(w.name)}</span>
        <span class="currency-badge">${w.currency.toUpperCase()}</span>
        <div class="meta">ID: ${w.id}</div>
      </div>
      <span class="balance">${formatAmount(w.balance)}</span>
    </li>`
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderOperations(operations) {
  const tbody = $("#ops-body");
  if (!operations || !operations.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Операций нет</td></tr>';
    return;
  }

  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w.name]));

  tbody.innerHTML = operations
    .map(
      (op) => `
    <tr>
      <td>${formatDate(op.created_at)}</td>
      <td><span class="type-badge ${operationTypeClass(op.type)}">${operationTypeLabel(op.type)}</span></td>
      <td>${escapeHtml(walletMap[op.wallet_id] || `#${op.wallet_id}`)}</td>
      <td>${formatAmount(op.amount)}</td>
      <td>${op.currency.toUpperCase()}</td>
      <td>${escapeHtml(op.category || "—")}</td>
    </tr>`
    )
    .join("");
}

async function loadBalance() {
  const data = await api.getBalance();
  $("#total-balance").textContent = `${formatAmount(data.total_balance)} ₽`;
}

async function loadWallets() {
  wallets = await api.getWallets();
  renderWallets();
  fillWalletSelects();
}

async function loadOperations() {
  const walletId = $("#filter-wallet").value;
  const dateFrom = $("#filter-date-from").value;
  const dateTo = $("#filter-date-to").value;

  const params = {};
  if (walletId) params.wallet_id = Number(walletId);
  if (dateFrom) params.date_from = `${dateFrom}T00:00:00`;
  if (dateTo) params.date_to = `${dateTo}T23:59:59`;

  const operations = await api.getOperations(params);
  renderOperations(operations);
}

async function refreshDashboard() {
  await Promise.all([loadBalance(), loadWallets(), loadOperations()]);
}

async function handleLogin(e) {
  e.preventDefault();
  const login = $("#login-input").value.trim();
  if (!login) return;

  try {
    api.setToken(login);
    await api.getMe();
    showApp();
    await onAppReady();
    showToast(`Добро пожаловать, ${login}!`);
  } catch {
    try {
      await api.createUser(login);
      api.setToken(login);
      showApp();
      await onAppReady();
      showToast(`Аккаунт ${login} создан`);
    } catch (err) {
      api.clearToken();
      showToast(err.message, "error");
    }
  }
}

function handleLogout() {
  api.clearToken();
  showAuth();
  $("#login-input").value = "";
}

async function onAppReady() {
  const me = await api.getMe();
  $("#user-login").textContent = me.login;
  await refreshDashboard();
}

async function handleCreateWallet(e) {
  e.preventDefault();
  const name = $("#wallet-name").value.trim();
  const initial_balance = $("#wallet-balance").value || "0";
  const currency = $("#wallet-currency").value;

  try {
    await api.createWallet({ name, initial_balance, currency });
    showToast(`Кошелёк «${name}» создан`);
    e.target.reset();
    await refreshDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleIncome(e) {
  e.preventDefault();
  const wallet_name = $("#income-wallet").value;
  const amount = $("#income-amount").value;
  const description = $("#income-desc").value.trim() || null;

  try {
    await api.addIncome({ wallet_name, amount, description });
    showToast("Доход добавлен");
    e.target.reset();
    await refreshDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleExpense(e) {
  e.preventDefault();
  const wallet_name = $("#expense-wallet").value;
  const amount = $("#expense-amount").value;
  const description = $("#expense-desc").value.trim() || null;

  try {
    await api.addExpense({ wallet_name, amount, description });
    showToast("Расход добавлен");
    e.target.reset();
    await refreshDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleTransfer(e) {
  e.preventDefault();
  const from_wallet_id = Number($("#transfer-from").value);
  const to_wallet_id = Number($("#transfer-to").value);
  const amount = $("#transfer-amount").value;

  try {
    await api.transfer({ from_wallet_id, to_wallet_id, amount });
    showToast("Перевод выполнен");
    e.target.reset();
    await refreshDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function initTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const group = tab.closest(".card");
      group.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      group.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      group.querySelector(`#${tab.dataset.panel}`).classList.add("active");
    });
  });
}

async function init() {
  initTabs();

  $("#login-form").addEventListener("submit", handleLogin);
  $("#logout-btn").addEventListener("click", handleLogout);
  $("#create-wallet-form").addEventListener("submit", handleCreateWallet);
  $("#income-form").addEventListener("submit", handleIncome);
  $("#expense-form").addEventListener("submit", handleExpense);
  $("#transfer-form").addEventListener("submit", handleTransfer);
  $("#filter-btn").addEventListener("click", () => loadOperations().catch((e) => showToast(e.message, "error")));
  $("#refresh-btn").addEventListener("click", () => refreshDashboard().catch((e) => showToast(e.message, "error")));

  if (getToken()) {
    try {
      showApp();
      await onAppReady();
    } catch {
      api.clearToken();
      showAuth();
    }
  } else {
    showAuth();
  }
}

function getToken() {
  return api.getToken();
}

init();
