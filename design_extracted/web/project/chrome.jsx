/* Shared chrome: header, footer, page frame */

function TVHeader({ role = "client", active = "schedule", name = "А.Иванов" }) {
  const links = {
    guest: [["Расписание", "schedule"]],
    client: [
      ["Расписание", "schedule"],
      ["Кабинет", "dashboard"],
      ["Избранное", "favorites"],
      ["Подписки", "subs"],
    ],
    editor: [
      ["Расписание", "schedule"],
      ["Кабинет", "dashboard"],
      ["Избранное", "favorites"],
      ["Сетка", "grid"],
      ["Передачи", "programs"],
    ],
    admin: [
      ["Расписание", "schedule"],
      ["Сетка", "grid"],
      ["Передачи", "programs"],
      ["Каналы", "channels"],
      ["Пользователи", "users"],
      ["Журнал", "logs"],
    ],
  };
  const today = "СРЕДА · 27.05.2026 · 14:32 MSK";
  return (
    <header className="tv-header">
      <div className="tv-header-strip">
        <div><span className="dot"></span>NODE.01 // ONLINE · {today}</div>
        <div>FEEDS: 5 · UPLINK: STABLE · LATENCY 28ms · UTC+3</div>
      </div>
      <div className="tv-header-main">
        <div className="tv-logo">
          <span className="lg">РАСПИСАНИЕ<span className="dot">/</span>ТВ</span>
          <small>BROADCAST.OPS &nbsp;//&nbsp; v 3.41.0</small>
        </div>
        <nav className="tv-nav">
          {(links[role] || []).map(([label, k]) => (
            <a key={k} href="#" className={active === k ? "active" : ""}>{label}</a>
          ))}
        </nav>
        <div className="tv-user">
          {role === "guest" ? (
            <>
              <a className="btn btn-ghost" href="#">Регистрация</a>
              <a className="btn btn-sm" href="#">Войти</a>
            </>
          ) : (
            <>
              <div className="who" style={{textAlign:"right"}}>
                <b>{name}</b>
                <span>{role}</span>
              </div>
              <div className="av">{name[0]}</div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function TVFooter() {
  return (
    <footer className="tv-footer">
      <div>© MMXXVI · Расписание ТВ · Bulletin</div>
      <div>Помощь · Контакты · Условия</div>
      <div>v 3.41.0</div>
    </footer>
  );
}

/* Page frame — full artboard chrome */
function Page({ role = "client", active, width = 1280, children, padX = 32 }) {
  return (
    <div className="tv" style={{ width, position: "relative" }}>
      <div className="tv-grain"></div>
      <TVHeader role={role} active={active} />
      <main className="tv-container" style={{ paddingLeft: padX, paddingRight: padX }}>
        {children}
      </main>
      <TVFooter />
    </div>
  );
}

Object.assign(window, { TVHeader, TVFooter, Page });
