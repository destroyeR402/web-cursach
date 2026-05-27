/* ============ ADMIN SCREENS ============ */
/* 10. Channels  11. Users  12. Audit Log  13. Error */

/* ---- 10. Channels Management ---- */
function ChannelsScreen() {
  const channels = [
    { n: 1, name: "Первый эфир", slug: "pervy", cat: "Универсальный", active: true, d: "Главный канал сети, охват 24/7" },
    { n: 2, name: "Кругозор HD", slug: "krugozor", cat: "Познавательный", active: true, d: "Наука, история, документалистика" },
    { n: 3, name: "Кинопросмотр", slug: "cinema", cat: "Кино/Сериалы", active: true, d: "Полнометражные фильмы и сериалы" },
    { n: 4, name: "Юниор", slug: "junior", cat: "Детский", active: false, d: "Анимация, образовательные передачи для детей" },
    { n: 5, name: "Спорт Лайв", slug: "sportlive", cat: "Спорт", active: true, d: "Прямые трансляции и спортивные обзоры" },
  ];
  return (
    <Page role="admin" active="channels">
      <div className="row" style={{justifyContent:"space-between", alignItems:"end", marginBottom:24}}>
        <div>
          <div className="eyebrow">Администрирование · Каналы</div>
          <h1 style={{marginTop:6}}>Каналы <span style={{fontFamily:"var(--mono)", fontSize:22, color:"var(--muted)"}}>· всего 5</span></h1>
        </div>
        <button className="btn btn-primary">+ Добавить канал</button>
      </div>

      <div className="card" style={{padding:24, marginBottom:24, background:"var(--paper-2)", borderStyle:"dashed"}}>
        <div className="eyebrow" style={{marginBottom:14}}>Новый канал · форма</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16}}>
          <div>
            <label className="label">Название *</label>
            <input className="input" placeholder="Дискавери"/>
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input mono" placeholder="discovery"/>
          </div>
          <div>
            <label className="label">Категория</label>
            <select className="select"><option>Познавательный</option><option>Спорт</option><option>Детский</option></select>
          </div>
          <div>
            <label className="label">Активен</label>
            <select className="select"><option>Да</option><option>Нет</option></select>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label className="label">Описание</label>
            <textarea className="input" rows="2"></textarea>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label className="label">Логотип</label>
            <div style={{display:"grid", gridTemplateColumns:"96px 1fr", gap:14, alignItems:"start"}}>
              <div className="ph" style={{width:96, height:96}}>1:1</div>
              <div className="col" style={{gap:6}}>
                <button className="btn btn-sm">Выбрать файл…</button>
                <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>SVG / PNG · квадрат</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:8}}>
            <button className="btn btn-primary">Создать</button>
            <button className="btn">Сбросить</button>
          </div>
        </div>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width:60}}>Лого</th>
              <th style={{width:50}}>№</th>
              <th>Название</th>
              <th style={{width:120}}>Slug</th>
              <th style={{width:160}}>Категория</th>
              <th style={{width:100}}>Активен</th>
              <th>Описание</th>
              <th style={{width:90}}></th>
            </tr>
          </thead>
          <tbody>
            {channels.map(c => (
              <tr key={c.n}>
                <td><div className="ph" style={{width:42, height:42}}>{c.n}</div></td>
                <td className="num">{String(c.n).padStart(2,"0")}</td>
                <td><div style={{fontFamily:"var(--serif)", fontSize:18, lineHeight:1}}>{c.name}</div></td>
                <td className="mono" style={{fontSize:11}}>/{c.slug}</td>
                <td><span className="tag">{c.cat}</span></td>
                <td>
                  <label className="row" style={{gap:6, fontSize:11, fontFamily:"var(--mono)", textTransform:"uppercase", letterSpacing:".08em"}}>
                    <input type="checkbox" defaultChecked={c.active}/>
                    <span style={{color: c.active ? "var(--ok)" : "var(--muted)"}}>
                      {c.active ? "● онлайн" : "○ выкл."}
                    </span>
                  </label>
                </td>
                <td style={{color:"var(--ink-2)", maxWidth:300}}>{c.d}</td>
                <td>
                  <div className="row" style={{gap:4, justifyContent:"flex-end"}}>
                    <button className="btn btn-sm btn-ghost" style={{border:"1px solid var(--hair-strong)"}}>✎</button>
                    <button className="btn btn-sm btn-danger" style={{padding:"6px 8px"}}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}

/* ---- 11. Users Management ---- */
function UsersScreen() {
  const users = [
    { id: 4001, email: "a.ivanov@mail.ru", login: "a.ivanov", name: "Александр Иванов", role: "client", active: true, created: "14.03.2024", ch: null },
    { id: 4017, email: "redaktor1@tv.com", login: "redaktor1", name: "Мария Петрова", role: "editor", active: true, created: "02.06.2024", ch: "Первый эфир" },
    { id: 4032, email: "admin@tv.com", login: "admin", name: "Сергей Соколов", role: "admin", active: true, created: "01.01.2024", ch: null },
    { id: 4044, email: "k.smirnova@mail.ru", login: "ksmirn", name: "Ксения Смирнова", role: "client", active: true, created: "18.09.2025", ch: null },
    { id: 4051, email: "ed2@tv.com", login: "ed2", name: "Игорь Лебедев", role: "editor", active: false, created: "21.10.2025", ch: "Кругозор HD" },
    { id: 4068, email: "test@example.com", login: "test_user", name: "—", role: "client", active: false, created: "11.02.2026", ch: null },
  ];
  const roleColor = { client: "transparent", editor: "var(--paper-3)", admin: "var(--ink)" };
  const roleText = { client: "var(--ink)", editor: "var(--ink)", admin: "var(--paper)" };

  return (
    <Page role="admin" active="users">
      <div className="row" style={{justifyContent:"space-between", alignItems:"end", marginBottom:18}}>
        <div>
          <div className="eyebrow">Администрирование · Пользователи</div>
          <h1 style={{marginTop:6}}>Пользователи <span style={{fontFamily:"var(--mono)", fontSize:22, color:"var(--muted)"}}>· 1 247</span></h1>
        </div>
        <div className="row" style={{gap:10}}>
          <input className="input" placeholder="🔍 Email, логин, имя…" style={{width:280}}/>
          <select className="select" style={{width:160}}><option>Все роли</option><option>client</option><option>editor</option><option>admin</option></select>
          <select className="select" style={{width:160}}><option>Статус: все</option><option>Активные</option><option>Заблок.</option></select>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:0, border:"1px solid var(--rule)", marginBottom:24}}>
        <MiniStat n="1 247" t="всего"/>
        <MiniStat n="1 178" t="клиентов"/>
        <MiniStat n="64" t="редакторов"/>
        <MiniStat n="5" t="админов" accent/>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width:60}}>ID</th>
              <th>Email · Логин</th>
              <th>Имя</th>
              <th style={{width:120}}>Роль</th>
              <th style={{width:90}}>Активен</th>
              <th style={{width:110}}>Создан</th>
              <th style={{width:200}}>Закреплён канал</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="num">{u.id}</td>
                <td>
                  <div>{u.email}</div>
                  <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em", marginTop:3}}>@{u.login}</div>
                </td>
                <td>{u.name}</td>
                <td>
                  <select className="select" defaultValue={u.role} style={{
                    fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:".1em",
                    padding:"4px 8px",
                    background: roleColor[u.role],
                    color: roleText[u.role],
                    borderColor: u.role === "admin" ? "var(--ink)" : "var(--hair-strong)",
                  }}>
                    <option value="client">client</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <label className="row" style={{gap:6, fontSize:11, fontFamily:"var(--mono)", textTransform:"uppercase", letterSpacing:".08em"}}>
                    <input type="checkbox" defaultChecked={u.active}/>
                    <span style={{color: u.active ? "var(--ok)" : "var(--muted)"}}>
                      {u.active ? "ON" : "OFF"}
                    </span>
                  </label>
                </td>
                <td className="num">{u.created}</td>
                <td>
                  {u.role === "editor" ? (
                    <select className="select" defaultValue={u.ch} style={{padding:"6px 10px", fontSize:12}}>
                      <option>Первый эфир</option>
                      <option>Кругозор HD</option>
                      <option>Кинопросмотр</option>
                    </select>
                  ) : (
                    <span className="mono muted" style={{fontSize:11, textTransform:"uppercase", letterSpacing:".08em"}}>— н/п —</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row" style={{justifyContent:"space-between", marginTop:16}}>
        <div className="mono" style={{fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em"}}>
          Показаны 1–6 из 1 247
        </div>
        <div className="row" style={{gap:4}}>
          {["‹", "1", "2", "3", "…", "208", "›"].map((p, i) => (
            <button key={i} className={`btn btn-sm ${p === "1" ? "btn-primary" : ""}`} style={{padding:"6px 10px", minWidth:34, justifyContent:"center"}}>{p}</button>
          ))}
        </div>
      </div>
    </Page>
  );
}

function MiniStat({ n, t, accent }) {
  return (
    <div style={{
      padding:"18px 22px",
      borderRight:"1px solid var(--rule)",
      background: accent ? "var(--accent-soft)" : "transparent",
      color: accent ? "var(--accent)" : "var(--ink)",
      borderTop: accent ? "1px solid var(--accent)" : "none",
      marginTop: accent ? "-1px" : 0,
    }}>
      <div style={{fontFamily:"var(--display)", fontWeight:400, fontSize:38, lineHeight:1, color: accent ? "var(--accent)" : "var(--ink)"}}>{n}</div>
      <div className="mono" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".14em", marginTop:8, color: accent ? "var(--accent-2)" : "var(--muted)"}}>{t}</div>
    </div>
  );
}

/* ---- 12. Audit Log ---- */
function AuditScreen() {
  const events = [
    { dt: "27.05.2026 14:31:08", who: "redaktor1", role: "editor", act: "schedule.publish", ent: "schedule", id: "S-2026-05-27-CH01", ip: "10.0.4.21", level: "info" },
    { dt: "27.05.2026 14:18:42", who: "redaktor1", role: "editor", act: "slot.create",     ent: "slot", id: "SL-49021", ip: "10.0.4.21", level: "info" },
    { dt: "27.05.2026 14:18:01", who: "redaktor1", role: "editor", act: "slot.delete",     ent: "slot", id: "SL-49018", ip: "10.0.4.21", level: "warn" },
    { dt: "27.05.2026 12:04:55", who: "admin",     role: "admin",  act: "user.role_change",ent: "user", id: "U-4051",   ip: "10.0.0.2",  level: "warn" },
    { dt: "27.05.2026 11:50:11", who: "admin",     role: "admin",  act: "channel.deactivate", ent: "channel", id: "CH-4", ip: "10.0.0.2", level: "warn" },
    { dt: "27.05.2026 09:12:33", who: "a.ivanov",  role: "client", act: "auth.login",      ent: "session", id: "SE-99012", ip: "85.142.12.4", level: "info" },
    { dt: "27.05.2026 02:00:00", who: "system",    role: "system", act: "job.archive",     ent: "logs",   id: "JOB-117",  ip: "—",         level: "info" },
    { dt: "26.05.2026 22:44:09", who: "test_user", role: "client", act: "auth.fail",       ent: "session",id: "—",         ip: "203.0.113.7", level: "err" },
  ];
  const levelColor = { info: "var(--muted)", warn: "var(--warn)", err: "var(--signal)" };

  return (
    <Page role="admin" active="logs">
      <div className="row" style={{justifyContent:"space-between", alignItems:"end", marginBottom:18}}>
        <div>
          <div className="eyebrow">Администрирование · Аудит</div>
          <h1 style={{marginTop:6}}>Журнал <span className="italic">событий</span></h1>
        </div>
        <div className="row" style={{gap:10}}>
          <input className="input mono" defaultValue="2026-05-26" style={{width:140}}/>
          <span className="mono muted" style={{fontSize:11, textTransform:"uppercase", letterSpacing:".1em"}}>→</span>
          <input className="input mono" defaultValue="2026-05-27" style={{width:140}}/>
          <select className="select" style={{width:160}}><option>Все события</option><option>auth.*</option><option>schedule.*</option><option>user.*</option></select>
          <button className="btn">⤓ CSV</button>
        </div>
      </div>

      {/* Hourly chart */}
      <div className="card" style={{padding:"18px 22px", marginBottom:24}}>
        <div className="row" style={{justifyContent:"space-between", marginBottom:10}}>
          <div className="eyebrow">События по часам · последние 24 ч</div>
          <div className="mono muted" style={{fontSize:11, textTransform:"uppercase", letterSpacing:".1em"}}>
            всего <b style={{color:"var(--ink)"}}>1 482</b> · из них <b style={{color:"var(--signal)"}}>14 ошибок</b>
          </div>
        </div>
        <div style={{display:"flex", alignItems:"end", gap:3, height:64}}>
          {[12,8,5,3,2,1,2,4,18,32,44,58,72,88,84,92,68,46,38,22,18,15,10,7].map((v, i) => (
            <div key={i} style={{
              flex:1, height: `${(v / 92) * 100}%`,
              background: i === 12 ? "var(--signal)" : i % 6 === 5 ? "var(--ink)" : "var(--ink-2)",
              opacity: i === 12 ? 1 : 0.7,
            }}></div>
          ))}
        </div>
        <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
          {["00", "06", "12", "18", "24"].map(h => (
            <span key={h} className="mono" style={{fontSize:10, color:"var(--muted)"}}>{h}:00</span>
          ))}
        </div>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width:170}}>Дата · Время</th>
              <th style={{width:200}}>Пользователь</th>
              <th style={{width:200}}>Действие</th>
              <th style={{width:100}}>Сущность</th>
              <th style={{width:140}}>ID</th>
              <th>IP</th>
              <th style={{width:80}}></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td className="num">
                  <span style={{color:"var(--ink)"}}>{e.dt.split(" ")[0]}</span>
                  &nbsp;<span style={{color:"var(--muted)"}}>{e.dt.split(" ")[1]}</span>
                </td>
                <td>
                  <span>{e.who}</span>
                  <span className="tag" style={{marginLeft:8, fontSize:9}}>{e.role}</span>
                </td>
                <td>
                  <span className="mono" style={{
                    fontSize:11, padding:"2px 6px",
                    background: e.level === "err" ? "var(--signal-soft)" : e.level === "warn" ? "rgba(181,112,26,0.12)" : "var(--paper-2)",
                    color: levelColor[e.level],
                    borderRadius:2,
                    letterSpacing:".02em",
                  }}>{e.act}</span>
                </td>
                <td className="mono" style={{fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em"}}>{e.ent}</td>
                <td className="num">{e.id}</td>
                <td className="num">{e.ip}</td>
                <td>
                  <button className="btn btn-sm btn-ghost" style={{border:"1px solid var(--hair-strong)"}}>↳ см.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}

/* ---- 13. Error Page ---- */
function ErrorScreen() {
  return (
    <Page role="client" active="schedule">
      <div style={{minHeight:480, display:"grid", gridTemplateColumns:"1fr 1fr", alignItems:"center", gap:60, padding:"60px 0"}}>
        <div>
          <div className="eyebrow" style={{marginBottom:16}}>Ошибка · 404</div>
          <h1 style={{fontSize:140, lineHeight:0.9}}>
            Канал<br/>не <span className="italic">найден</span>.
          </h1>
          <p style={{maxWidth:420, marginTop:24, fontSize:16, lineHeight:1.55, color:"var(--ink-2)"}}>
            Запрашиваемая страница временно недоступна или не существует.
            Возможно, передача снята с эфира.
          </p>
          <div className="row" style={{gap:10, marginTop:32}}>
            <button className="btn btn-primary">← На главную</button>
            <button className="btn">Сообщить о проблеме</button>
          </div>
        </div>
        <div style={{position:"relative"}}>
          <div className="ph" style={{
            aspectRatio:"4/3", display:"grid", placeItems:"center", padding:32,
            background:"var(--surface-1)", color:"var(--ink-2)",
            border:"1px solid var(--hair-strong)",
            backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(94,240,255,0.04) 3px, rgba(94,240,255,0.04) 4px)",
            position:"relative",
          }}>
            <div style={{textAlign:"center", fontFamily:"var(--mono)", fontSize:11, letterSpacing:".18em", textTransform:"uppercase", lineHeight:2.2, color:"var(--muted)"}}>
              ─── <span style={{color:"var(--accent)"}}>NO SIGNAL</span> ───<br/>
              · · · · · · · · · ·<br/>
              <span style={{color:"var(--ink)"}}>ERR / 404</span><br/>
              · · · · · · · · · ·<br/>
              <span style={{color:"var(--signal)"}}>CH-007 OFFLINE</span><br/>
              · · · · · · · · · ·
            </div>
          </div>
          <div className="mono" style={{marginTop:14, fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".12em"}}>
            Тестовая таблица настройки · код 0xE404
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { ChannelsScreen, UsersScreen, AuditScreen, ErrorScreen });
