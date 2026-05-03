import { useEffect, useMemo, useState } from "react";

//Test Ngrok


const API_URL = "/api";
const roles = ["Technical Support", "Network", "HR", "System Analysis", "Administration"];
const priorities = ["too High", "High", "Normal", "low", "too low"];
const statuses = ["Opened", "Follow up", "Finished"];

const priorityColor = {
  "too High": "#d62828",
  High: "#ff8800",
  Normal: "#2a9d8f",
  low: "#f4d35e",
  "too low": "#3a86ff"
};

const statusColor = {
  Finished: "#111111",
  Opened: "#2dc653",
  "Follow up": "#f4d35e"
};

const i18n = {
  pt: {
    app: "Sistema de Gerenciamento de Chamados da ByteSolutions",
    description: "Plataforma interna de chamados, filas e acompanhamento técnico.",
    login: "Entrar",
    email: "Email",
    password: "Senha",
    ownerAdmin: "Admin (Proprietário)",
    tickets: "Chamados",
    dashboard: "Dashboard",
    employees: "Funcionários",
    homeQueue: "Minha Fila",
    mainQueue: "Fila Principal",
    myDesk: "Minha Área",
    createTicket: "Criar Chamados",
    save: "Salvar",
    followUp: "Acompanhamento",
    logout: "Sair",
    deleteSelected: "Deletar Selecionados",
    deleteAll: "Deletar Todos",
    confirmDelete: "Tem certeza que deseja deletar o(s) ticket(s)?"
  },
  en: {
    app: "ByteSolutions Ticket Management",
    description: "Internal platform for managing tickets, queues, and technical follow-up.",
    login: "Login",
    email: "Email",
    password: "Password",
    ownerAdmin: "Owner Admin",
    tickets: "Tickets",
    dashboard: "Dashboard",
    employees: "Employees",
    homeQueue: "My Queue",
    mainQueue: "Main Queue",
    myDesk: "My Desk",
    createTicket: "Create Ticket",
    save: "Save",
    followUp: "Follow-up",
    logout: "Logout",
    deleteSelected: "Delete Selected",
    deleteAll: "Delete All",
    confirmDelete: "Are you sure you want to delete ticket(s)?"
  },
  es: {
    app: "Gestión de Tickets ByteSolutions",
    description: "Plataforma interna para solicitudes de servicio, colas de espera y soporte técnico.",
    login: "Iniciar sesión",
    email: "Email",
    password: "Contraseña",
    ownerAdmin: "Admin Owner",
    tickets: "Tickets",
    dashboard: "Panel",
    employees: "Empleados",
    homeQueue: "Mi Cola",
    mainQueue: "Cola Principal",
    myDesk: "Mi Área",
    createTicket: "Crear Ticket",
    save: "Guardar",
    followUp: "Seguimiento",
    logout: "Salir",
    deleteSelected: "Eliminar Seleccionados",
    deleteAll: "Eliminar Todos",
    confirmDelete: "¿Seguro que deseas eliminar los ticket(s)?"
  }
};

async function api(path, method = "GET", token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro na API" }));
    throw new Error(err.error || "Erro na API");
  }
  return res.json();
}

function Badge({ value, colorMap }) {
  return <span className="badge" style={{ backgroundColor: colorMap[value] || "#ccc" }}>{value}</span>;
}

export default function App() {
  const [lang, setLang] = useState("pt");
  const t = i18n[lang];
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("tickets");
  const [period, setPeriod] = useState("month");
  const [mainTickets, setMainTickets] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [searchTickets, setSearchTickets] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [followUpInput, setFollowUpInput] = useState({});
  const [followUpItems, setFollowUpItems] = useState({});
  const [filters, setFilters] = useState({});
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketEditorForm, setTicketEditorForm] = useState(null);
  const [returnView, setReturnView] = useState("tickets");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [employeeForm, setEmployeeForm] = useState({ username: "", email: "", password: "", role: roles[0], jobTitle: "", employmentStatus: "active" });
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: priorities[2],
    roleGroup: roles[0],
    requesterEmployeeId: "",
    requesterGroup: roles[0],
    status: statuses[0],
    appliedByEmployeeId: "",
    assignToMe: false
  });

  async function fetchTickets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await api(`/tickets${query ? `?${query}` : ""}`, "GET", token);
    return data;
  }

  async function refreshQueues() {
    const [mainData, myData] = await Promise.all([
      fetchTickets({ scope: "all" }),
      fetchTickets({ scope: "mine" })
    ]);
    setMainTickets(mainData);
    setMyTickets(myData);
  }

  async function refreshSearch() {
    const data = await fetchTickets({ ...filters, scope: "all" });
    setSearchTickets(data);
  }

  async function refreshEmployees() {
    const data = await api("/tickets/meta/requesters", "GET", token);
    setEmployees(data);
  }

  async function refreshDashboard() {
    if (user?.role !== "Owner") return;
    const data = await api(`/dashboard/employee-metrics?period=${period}`, "GET", token);
    setMetrics(data);
  }

  useEffect(() => {
    if (!token) return;
    refreshQueues().catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token || !isSearchMode) return;
    refreshSearch().catch(() => {});
  }, [token, filters, isSearchMode]);

  useEffect(() => {
    if (!token) return;
    refreshEmployees().catch(() => {});
    refreshDashboard().catch(() => {});
  }, [token, period, user?.role]);

  const myQueue = useMemo(() => myTickets.filter((tk) => tk.applied_by_employee_id === user?.id), [myTickets, user]);

  async function onLogin(e) {
    e.preventDefault();
    const data = await api("/auth/login", "POST", null, loginForm);
    setToken(data.token);
    setUser(data.user);
  }

  async function onCreateEmployee(e) {
    e.preventDefault();
    await api("/employees", "POST", token, employeeForm);
    setEmployeeForm({ username: "", email: "", password: "", role: roles[0], jobTitle: "", employmentStatus: "active" });
    refreshEmployees();
  }

  async function onCreateTicket(e) {
    e.preventDefault();
    const appliedByEmployeeId = ticketForm.assignToMe
      ? user.id
      : ticketForm.appliedByEmployeeId
        ? Number(ticketForm.appliedByEmployeeId)
        : null;
    const requesterEmployeeId = ticketForm.requesterEmployeeId ? Number(ticketForm.requesterEmployeeId) : null;
    await api("/tickets", "POST", token, {
      ...ticketForm,
      requesterEmployeeId,
      appliedByEmployeeId
    });
    setTicketForm({
      title: "",
      description: "",
      priority: priorities[2],
      roleGroup: roles[0],
      requesterEmployeeId: "",
      requesterGroup: roles[0],
      status: statuses[0],
      appliedByEmployeeId: "",
      assignToMe: false
    });
    refreshQueues();
    if (isSearchMode) refreshSearch();
    if (view === "newTicket") {
      setView(returnView);
    }
  }

  async function updateTicket(id, payload) {
    const updated = await api(`/tickets/${id}`, "PUT", token, payload);
    refreshQueues();
    if (isSearchMode) refreshSearch();
    return updated;
  }

  async function addFollowUp(ticketId) {
    const message = followUpInput[ticketId];
    if (!message) return;
    await api(`/tickets/${ticketId}/follow-up`, "POST", token, { message });
    const data = await api(`/tickets/${ticketId}/follow-up`, "GET", token);
    setFollowUpItems((prev) => ({ ...prev, [ticketId]: data }));
    setFollowUpInput((prev) => ({ ...prev, [ticketId]: "" }));
    try {
      await updateTicket(ticketId, { status: "Follow up" });
    } catch {
      // Follow-up already saved; status update is best-effort.
    }
  }

  async function loadFollowUp(ticketId) {
    const data = await api(`/tickets/${ticketId}/follow-up`, "GET", token);
    setFollowUpItems((prev) => ({ ...prev, [ticketId]: data }));
  }

  async function deleteTickets(mode) {
    if (!window.confirm(t.confirmDelete)) return;
    await api("/tickets/bulk-delete", "POST", token, mode === "all" ? { mode: "all" } : { mode: "selected", ids: selectedIds });
    setSelectedIds([]);
    refreshQueues();
    if (isSearchMode) refreshSearch();
  }

  function openTicketEditor(ticket) {
    setReturnView(view);
    setActiveTicket(ticket);
    setTicketEditorForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      roleGroup: ticket.role_group,
      requesterEmployeeId: ticket.requester_employee_id ?? "",
      requesterGroup: ticket.requester_group,
      appliedByEmployeeId: ticket.applied_by_employee_id ?? ""
    });
    loadFollowUp(ticket.id);
    setView("ticketDetail");
  }

  async function saveTicketEditor(e) {
    e.preventDefault();
    if (!activeTicket || !ticketEditorForm) return;
    const updated = await updateTicket(activeTicket.id, {
      title: ticketEditorForm.title,
      description: ticketEditorForm.description,
      priority: ticketEditorForm.priority,
      status: ticketEditorForm.status,
      roleGroup: ticketEditorForm.roleGroup,
      requesterEmployeeId: ticketEditorForm.requesterEmployeeId ? Number(ticketEditorForm.requesterEmployeeId) : null,
      requesterGroup: ticketEditorForm.requesterGroup,
      appliedByEmployeeId: ticketEditorForm.appliedByEmployeeId ? Number(ticketEditorForm.appliedByEmployeeId) : null
    });
    setActiveTicket(updated);
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-panel">
          <p className="brand-kicker">ByteSolutions</p>
          <h1>{t.app}</h1>
          <p className="muted">{t.description}</p>
          <div className="lang-row">
            <button className={lang === "pt" ? "active" : ""} onClick={() => setLang("pt")}>PT</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "es" ? "active" : ""} onClick={() => setLang("es")}>ES</button>
          </div>
          <form onSubmit={onLogin} className="form-grid auth-form">
            <input placeholder={t.email} value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            <input type="password" placeholder={t.password} value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            <button type="submit" className="primary">{t.login}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p>ByteSolutions</p>
          <strong>Service Desk</strong>
        </div>
        <nav className="sidebar-nav">
          <button className={view === "tickets" ? "active" : ""} onClick={() => setView("tickets")}>{t.tickets}</button>
          {user.role === "Owner" && <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>{t.ownerAdmin}</button>}
          {user.role === "Owner" && <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>{t.dashboard}</button>}
        </nav>
        <div className="sidebar-footer">
          <p>{user.username}</p>
          <span>{user.role}</span>
          <button onClick={() => { setToken(""); setUser(null); }}>{t.logout}</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>{t.app}</h2>
            <p className="muted">Painel operacional inspirado em service desk corporativo.</p>
          </div>
          <div className="stats-row">
            <div className="stat-card"><span>Total</span><strong>{mainTickets.length}</strong></div>
            <div className="stat-card"><span>Minha fila</span><strong>{myQueue.length}</strong></div>
            <div className="stat-card"><span>Abertos</span><strong>{mainTickets.filter((tk) => tk.status === "Opened").length}</strong></div>
          </div>
        </header>

        {view === "admin" && user.role === "Owner" && (
          <section className="card section-card">
            <h3>{t.employees}</h3>
            <form className="form-grid" onSubmit={onCreateEmployee}>
              <input placeholder="Username" value={employeeForm.username} onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })} />
              <input placeholder={t.email} value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} />
              <input type="password" placeholder={t.password} value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} />
              <select value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</select>
              <input placeholder="Job title" value={employeeForm.jobTitle} onChange={(e) => setEmployeeForm({ ...employeeForm, jobTitle: e.target.value })} />
              <select value={employeeForm.employmentStatus} onChange={(e) => setEmployeeForm({ ...employeeForm, employmentStatus: e.target.value })}>
                <option value="active">active</option>
                <option value="deactivated">deactivated</option>
              </select>
              <button className="primary">{t.save}</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Job</th><th>Status</th></tr></thead>
                <tbody>{employees.map((e) => <tr key={e.id}><td>{e.id}</td><td>{e.username}</td><td>{e.email}</td><td>{e.role}</td><td>{e.job_title}</td><td>{e.employment_status}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        )}

        {view === "dashboard" && user.role === "Owner" && (
          <section className="card section-card">
            <div className="section-head">
              <h3>{t.dashboard}</h3>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="today">today</option>
                <option value="week">week</option>
                <option value="month">month</option>
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Employee</th><th>Email</th><th>Role</th><th>Status</th><th>Closed</th><th>Assigned</th><th>In progress</th></tr></thead>
                <tbody>{metrics.map((m) => <tr key={m.id}><td>{m.username}</td><td>{m.email}</td><td>{m.role}</td><td>{m.employment_status}</td><td>{m.closed_tickets}</td><td>{m.assigned_tickets}</td><td>{m.in_progress_tickets}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        )}

        {view === "tickets" && (
          <section className="card section-card">
            <div className="section-head">
              <h3>{t.mainQueue}</h3>
              <div className="actions">
                <button className="primary" onClick={() => { setReturnView("tickets"); setView("newTicket"); }}>{t.createTicket}</button>
                <button onClick={() => setView("myDesk")}>{t.myDesk}</button>
                <button title="Busca avançada" onClick={() => setIsSearchMode((s) => !s)}>🔎</button>
              </div>
            </div>
            <p className="muted">Use o botão acima para abrir a página de criação de ticket.</p>

            {isSearchMode && (
              <>
                <div className="section-head">
                  <h4>Busca Avançada</h4>
                  <button onClick={() => setIsSearchMode(false)}>Voltar para fila principal</button>
                </div>
                <div className="form-grid">
                  <input placeholder="ID" onChange={(e) => setFilters((f) => ({ ...f, id: e.target.value }))} />
                  <input placeholder="Title" onChange={(e) => setFilters((f) => ({ ...f, title: e.target.value }))} />
                  <input placeholder="Description" onChange={(e) => setFilters((f) => ({ ...f, description: e.target.value }))} />
                  <input type="date" onChange={(e) => setFilters((f) => ({ ...f, createdAt: e.target.value }))} />
                  <select onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}><option value="">Priority</option>{priorities.map((p) => <option key={p}>{p}</option>)}</select>
                  <input type="date" onChange={(e) => setFilters((f) => ({ ...f, updatedAt: e.target.value }))} />
                  <select onChange={(e) => setFilters((f) => ({ ...f, roleGroup: e.target.value }))}><option value="">Role Group</option>{roles.map((r) => <option key={r}>{r}</option>)}</select>
                  <input placeholder="Requester" onChange={(e) => setFilters((f) => ({ ...f, requester: e.target.value }))} />
                  <select onChange={(e) => setFilters((f) => ({ ...f, requesterGroup: e.target.value }))}><option value="">Requester Group</option>{roles.map((r) => <option key={r}>{r}</option>)}</select>
                  <input placeholder="Applied by" onChange={(e) => setFilters((f) => ({ ...f, appliedBy: e.target.value }))} />
                  <select onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}><option value="">Status</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
              </>
            )}

            {user.role === "Owner" && (
              <div className="actions">
                <button className="warn" onClick={() => deleteTickets("selected")} disabled={!selectedIds.length}>{t.deleteSelected}</button>
                <button className="danger" onClick={() => deleteTickets("all")}>{t.deleteAll}</button>
              </div>
            )}

            <h4>{isSearchMode ? "Fila de Busca de Chamados" : t.mainQueue}</h4>
            <TicketTable
              data={isSearchMode ? searchTickets : mainTickets}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              canSelect={user.role === "Owner"}
              onStatusChange={updateTicket}
              loadFollowUp={loadFollowUp}
              followUpItems={followUpItems}
              followUpInput={followUpInput}
              setFollowUpInput={setFollowUpInput}
              addFollowUp={addFollowUp}
              readOnlyStatus
              hideFollowUp
              onTitleClick={openTicketEditor}
            />
          </section>
        )}

        {view === "myDesk" && (
          <section className="card section-card">
            <div className="section-head">
              <h3>{t.myDesk}</h3>
              <div className="actions">
                <button className="primary" onClick={() => { setReturnView("tickets"); setView("newTicket"); }}>{t.createTicket}</button>
                <button onClick={() => setView("tickets")}>Voltar para {t.mainQueue}</button>
              </div>
            </div>
            <p className="muted">Aqui ficam apenas os chamados atribuídos para você.</p>

            <h4>{t.homeQueue}</h4>
            <TicketTable data={myQueue} selectedIds={selectedIds} setSelectedIds={setSelectedIds} canSelect={user.role === "Owner"} readOnlyStatus loadFollowUp={loadFollowUp} followUpItems={followUpItems} followUpInput={followUpInput} setFollowUpInput={setFollowUpInput} addFollowUp={addFollowUp} hideFollowUp onTitleClick={openTicketEditor} />
          </section>
        )}

        {view === "newTicket" && (
          <section className="card section-card">
            <div className="section-head">
              <h3>{t.createTicket}</h3>
              <button onClick={() => setView(returnView)}>Voltar</button>
            </div>
            <p className="muted">Página dedicada para criar um novo ticket de forma mais organizada.</p>
            <form className="detail-form" onSubmit={onCreateTicket}>
              <div className="field-block">
                <label>Título</label>
                <input
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="field-block field-block-full">
                <label>Descrição</label>
                <textarea
                  rows={6}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="field-block">
                <label>Prioridade</label>
                <select value={ticketForm.priority} onChange={(e) => setTicketForm((f) => ({ ...f, priority: e.target.value }))}>
                  {priorities.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Status</label>
                <select value={ticketForm.status} onChange={(e) => setTicketForm((f) => ({ ...f, status: e.target.value }))}>
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Role Group</label>
                <select value={ticketForm.roleGroup} onChange={(e) => setTicketForm((f) => ({ ...f, roleGroup: e.target.value }))}>
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Requester Group</label>
                <select value={ticketForm.requesterGroup} onChange={(e) => setTicketForm((f) => ({ ...f, requesterGroup: e.target.value }))}>
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Requester</label>
                <select value={ticketForm.requesterEmployeeId} onChange={(e) => setTicketForm((f) => ({ ...f, requesterEmployeeId: e.target.value }))}>
                  <option value="">No requester</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.username}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Aplicado para</label>
                {user.role === "Owner" ? (
                  <select
                    value={ticketForm.appliedByEmployeeId}
                    onChange={(e) => setTicketForm((f) => ({ ...f, appliedByEmployeeId: e.target.value }))}
                  >
                    <option value="">No one</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.username}</option>)}
                  </select>
                ) : (
                  <label className="checkbox-row">
                    <input type="checkbox" checked={ticketForm.assignToMe} onChange={(e) => setTicketForm((f) => ({ ...f, assignToMe: e.target.checked }))} />
                    Atribuir para mim ao criar
                  </label>
                )}
              </div>

              <div className="field-actions">
                <button className="primary" type="submit">{t.save}</button>
              </div>
            </form>
          </section>
        )}

        {view === "ticketDetail" && activeTicket && ticketEditorForm && (
          <section className="card section-card">
            <div className="section-head">
              <h3>Edição do Chamado #{activeTicket.id}</h3>
              <button onClick={() => setView(returnView)}>Voltar</button>
            </div>
            <p className="muted">Página dedicada para leitura completa, edição e acompanhamento técnico.</p>

            <form className="detail-form" onSubmit={saveTicketEditor}>
              <div className="field-block">
                <label>Título</label>
                <small>Nome curto para identificar o chamado.</small>
                <input
                  value={ticketEditorForm.title}
                  onChange={(e) => setTicketEditorForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="field-block field-block-full">
                <label>Descrição</label>
                <small>Descreva com detalhes o problema, contexto e ações esperadas.</small>
                <textarea
                  rows={8}
                  value={ticketEditorForm.description}
                  onChange={(e) => setTicketEditorForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="field-block">
                <label>Prioridade</label>
                <small>Nível de urgência do chamado.</small>
                <select value={ticketEditorForm.priority} onChange={(e) => setTicketEditorForm((f) => ({ ...f, priority: e.target.value }))}>
                  {priorities.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Status</label>
                <small>Estado atual de execução.</small>
                <select value={ticketEditorForm.status} onChange={(e) => setTicketEditorForm((f) => ({ ...f, status: e.target.value }))}>
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Grupo de função</label>
                <small>Área responsável principal.</small>
                <select value={ticketEditorForm.roleGroup} onChange={(e) => setTicketEditorForm((f) => ({ ...f, roleGroup: e.target.value }))}>
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Requester Group</label>
                <small>Role/cargo do requerente.</small>
                <select value={ticketEditorForm.requesterGroup} onChange={(e) => setTicketEditorForm((f) => ({ ...f, requesterGroup: e.target.value }))}>
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Requester</label>
                <small>Funcionário solicitante do chamado.</small>
                <select
                  value={ticketEditorForm.requesterEmployeeId}
                  onChange={(e) => setTicketEditorForm((f) => ({ ...f, requesterEmployeeId: e.target.value }))}
                >
                  <option value="">No requester</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.username}</option>)}
                </select>
              </div>

              <div className="field-block">
                <label>Aplicado para</label>
                <small>Técnico responsável pelo chamado.</small>
                {(
                  <select
                    value={ticketEditorForm.appliedByEmployeeId}
                    onChange={(e) => setTicketEditorForm((f) => ({ ...f, appliedByEmployeeId: e.target.value }))}
                  >
                    <option value="">No one</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.username}</option>)}
                  </select>
                )}
              </div>

              <div className="field-actions">
                <button className="primary" type="submit">Salvar alterações</button>
              </div>
            </form>

            <h4>{t.followUp}</h4>
            <div className="followup-list">
              {(followUpItems[activeTicket.id] || []).map((item) => (
                <div key={item.id} className="followup-item">
                  <strong>{item.username}</strong> ({item.email} | {item.role})<br />
                  {item.message}
                </div>
              ))}
            </div>
            <div className="followup-editor">
              <input
                placeholder="Mensagem de follow-up"
                value={followUpInput[activeTicket.id] || ""}
                onChange={(e) => setFollowUpInput((f) => ({ ...f, [activeTicket.id]: e.target.value }))}
              />
              <button className="primary" onClick={() => addFollowUp(activeTicket.id)}>Enviar</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TicketTable({
  data,
  selectedIds,
  setSelectedIds,
  canSelect,
  onStatusChange,
  loadFollowUp,
  followUpItems,
  followUpInput,
  setFollowUpInput,
  addFollowUp,
  readOnlyStatus = false,
  hideFollowUp = false,
  onTitleClick
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {canSelect && <th>Sel</th>}
            <th>ID</th><th>Title</th><th>Created</th><th>Priority</th><th>Updated</th><th>Role</th><th>Requester</th><th>Requester Group</th><th>Applied by</th><th>Status</th>{!hideFollowUp && <th>Follow-up</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((tk) => (
            <tr key={tk.id}>
              {canSelect && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tk.id)}
                    onChange={(e) => setSelectedIds((old) => (e.target.checked ? [...old, tk.id] : old.filter((id) => id !== tk.id)))}
                  />
                </td>
              )}
              <td>{tk.id}</td>
              <td>
                <button className="ticket-title-btn" title={tk.description} onClick={() => onTitleClick?.(tk)}>
                  {tk.title}
                </button>
              </td>
              <td>{new Date(tk.created_at).toLocaleString()}</td>
              <td><Badge value={tk.priority} colorMap={priorityColor} /></td>
              <td>{new Date(tk.updated_at).toLocaleString()}</td>
              <td>{tk.role_group}</td>
              <td>{tk.requester_username || "-"}</td>
              <td>{tk.requester_group || "-"}</td>
              <td>{tk.applied_by_username || "-"}</td>
              <td>
                {!readOnlyStatus ? (
                  <select value={tk.status} onChange={(e) => onStatusChange(tk.id, { status: e.target.value })}>
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <Badge value={tk.status} colorMap={statusColor} />
                )}
                {!readOnlyStatus && <Badge value={tk.status} colorMap={statusColor} />}
              </td>
              {!hideFollowUp && (
                <td>
                  <button onClick={() => loadFollowUp(tk.id)}>Ver</button>
                  <div className="followup-list">
                    {(followUpItems[tk.id] || []).map((item) => (
                      <div key={item.id} className="followup-item">
                        <strong>{item.username}</strong> ({item.email} | {item.role})<br />
                        {item.message}
                      </div>
                    ))}
                  </div>
                  <input
                    placeholder="Mensagem"
                    value={followUpInput[tk.id] || ""}
                    onChange={(e) => setFollowUpInput((f) => ({ ...f, [tk.id]: e.target.value }))}
                  />
                  <button className="primary" onClick={() => addFollowUp(tk.id)}>Enviar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
