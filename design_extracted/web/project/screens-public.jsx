/* ============ PUBLIC SCREENS ============ */
/* 1. Schedule  2. Login  3. Register */

/* ---- 1. Schedule (showpiece) ---- */
function ScheduleScreen() {
  const channels = [
    {
      n: "01", name: "Первый эфир", cat: "Универсальный", slug: "PERVY",
      now: { t: "14:00", title: "Полуденные новости", tag: "Новости" },
      slots: [
        { t: "12:00", title: "Утренний кофе с Виктором", g: "Ток-шоу", age: "12+", past: true },
        { t: "13:30", title: "Кулинарный класс: бретонские блины", g: "Кулинария", age: "0+", past: true },
        { t: "14:00", title: "Полуденные новости", g: "Новости · в эфире", age: "12+", live: true },
        { t: "15:00", title: "Документальный фильм «Великие реки»", g: "Док · 95 мин", age: "6+", upcoming: true },
        { t: "16:35", title: "Прогноз погоды", g: "Информ.", age: "0+" },
        { t: "16:45", title: "Сериал «Северные ветра», эпизод 12", g: "Драма · 50 мин", age: "16+" },
      ]
    },
    {
      n: "02", name: "Кругозор HD", cat: "Познавательный", slug: "CIRCLE",
      now: { t: "13:45", title: "Космические одиссеи", tag: "Док.серия" },
      slots: [
        { t: "13:45", title: "Космические одиссеи: Юпитер", g: "Док · 50 мин · в эфире", age: "6+", live: true },
        { t: "14:35", title: "Профессии будущего", g: "Образоват.", age: "12+", upcoming: true },
        { t: "15:30", title: "Археология России", g: "Док · 45 мин", age: "12+" },
      ]
    },
    {
      n: "03", name: "Кинопросмотр", cat: "Кино / Сериалы", slug: "CINEMA",
      now: { t: "12:20", title: "«Тихая комната»", tag: "Фильм" },
      slots: [
        { t: "12:20", title: "«Тихая комната»", g: "Фильм · 118 мин · в эфире", age: "18+", live: true },
        { t: "14:30", title: "«Аттракцион небывалых широт»", g: "Фильм · 102 мин", age: "16+", upcoming: true },
      ], collapsed: true
    },
    {
      n: "04", name: "Юниор", cat: "Детский", slug: "JR",
      now: { t: "14:10", title: "Мульти-мир: Эпизод 8", tag: "Анимация" },
      collapsed: true,
    },
    {
      n: "05", name: "Спорт Лайв", cat: "Спорт", slug: "SPORTL",
      now: { t: "14:00", title: "Чемпионат: 1/4 финала", tag: "Live" },
      collapsed: true,
    },
  ];

  return (
    <Page role="client" active="schedule">
      {/* Editorial masthead */}
      <section style={{display:"grid", gridTemplateColumns:"1fr auto", alignItems:"end", gap:32, paddingBottom:24, borderBottom:"1px solid var(--rule)"}}>
        <div>
          <div className="eyebrow" style={{marginBottom:14}}>Главный выпуск · Программа передач</div>
          <h1 style={{fontSize:96}}>
            Среда, <span className="italic">двадцать&nbsp;седьмое</span><br/>
            мая&nbsp;2026
          </h1>
          <p style={{maxWidth:520, marginTop:18, fontSize:15, lineHeight:1.55, color:"var(--ink-2)"}}>
            Полная сетка вещания на сегодня по пяти каналам. Подсветка
            эфира обновляется автоматически. Раскройте канал, чтобы увидеть
            расписание до полуночи.
          </p>
        </div>
        <div className="col" style={{alignItems:"flex-end", gap:16}}>
          <div className="stamp">● Сейчас в эфире · 14:32 MSK</div>
          <div className="date-bar">
            <button className="date-arrow">‹</button>
            <div className="card" style={{padding:"10px 18px"}}>
              <div className="mono" style={{fontSize:10, letterSpacing:".12em", color:"var(--muted)", textTransform:"uppercase"}}>Дата</div>
              <div style={{fontFamily:"var(--serif)", fontSize:22, lineHeight:1, marginTop:2}}>27 / 05 / 2026</div>
            </div>
            <button className="date-arrow">›</button>
            <button className="btn btn-sm">Сегодня</button>
          </div>
          <div style={{display:"flex", gap:6}}>
            <button className="btn btn-sm">⬇ Развернуть все</button>
            <button className="btn btn-sm btn-ghost" style={{border:"1px solid var(--hair-strong)"}}>⬆ Свернуть</button>
          </div>
        </div>
      </section>

      {/* Search rail */}
      <section style={{display:"grid", gridTemplateColumns:"1.6fr 1fr 1fr auto auto", gap:10, alignItems:"end", padding:"22px 0 8px"}}>
        <div>
          <label className="label">Поиск передачи</label>
          <input className="input" placeholder="Название, ведущий, ключевое слово…" />
        </div>
        <div>
          <label className="label">Жанр</label>
          <select className="select"><option>Все жанры</option><option>Новости</option><option>Документальный</option><option>Кино</option></select>
        </div>
        <div>
          <label className="label">Время</label>
          <select className="select"><option>В любое время</option><option>Утро</option><option>День</option><option>Вечер</option></select>
        </div>
        <button className="btn btn-primary">Найти</button>
        <button className="btn btn-ghost" style={{borderColor:"var(--hair-strong)"}}>Сбросить</button>
      </section>

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0 0"}}>
        <label className="row" style={{fontSize:13, gap:8, cursor:"pointer"}}>
          <input type="checkbox" /> Только избранные каналы
        </label>
        <div className="mono" style={{fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em"}}>
          5 каналов · 84 передачи · 3 в эфире
        </div>
      </div>

      {/* Channel programme */}
      <section style={{paddingTop:18}}>
        {channels.map((c, i) => (
          <div className="channel" key={c.n}>
            <div className="channel-head">
              <div className="num">{c.n}</div>
              <div>
                <div className="channel-name">{c.name}</div>
                <div className="channel-sub">{c.cat} · /{c.slug.toLowerCase()}</div>
              </div>
              <div className="channel-now">
                <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em"}}>
                  <span className="tag live" style={{background:"transparent", border:"none", color:"var(--signal)", padding:0, marginRight:6}}></span>
                  Сейчас · {c.now.t}
                </div>
                <b style={{display:"block", fontSize:14, marginTop:4}}>{c.now.title}</b>
                <small>{c.now.tag}</small>
              </div>
              <div className="row" style={{gap:8}}>
                <button className="btn btn-icon" title="В избранное">♡</button>
                <button className="btn btn-icon">{c.collapsed ? "▾" : "▴"}</button>
              </div>
            </div>

            {!c.collapsed && c.slots && (
              <div style={{paddingBottom:14}}>
                {c.slots.map((s, j) => (
                  <div key={j} className={`slot ${s.past ? "past" : ""} ${s.live ? "live" : ""}`}>
                    <div className="t">{s.t}</div>
                    <div>
                      <div className="title">{s.title}</div>
                      <div className="meta">
                        {s.live && <span className="tag signal live">В эфире</span>}
                        {s.upcoming && <span className="tag" style={{borderColor:"var(--ink)"}}>Далее</span>}
                        <span>{s.g}</span>
                      </div>
                    </div>
                    <div className="row" style={{gap:6}}>
                      <span className="tag age">{s.age}</span>
                      <button className="btn btn-icon btn-ghost" style={{border:"1px solid var(--hair)"}}>♡</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div style={{borderTop:"1px solid var(--rule)"}}></div>
      </section>
    </Page>
  );
}

/* ---- 2. Login ---- */
function LoginScreen() {
  return (
    <Page role="guest" active="schedule" padX={32}>
      <div style={{display:"grid", gridTemplateColumns:"1.1fr 1fr", gap:48, padding:"40px 0", minHeight: 560}}>
        <div>
          <div className="eyebrow" style={{marginBottom:18}}>Вход в систему</div>
          <h1 style={{fontSize:84, lineHeight:0.92}}>
            Добро<br/><span className="italic">пожаловать</span><br/>обратно.
          </h1>
          <p style={{maxWidth:380, marginTop:24, color:"var(--ink-2)", fontSize:15, lineHeight:1.55}}>
            Войдите, чтобы продолжить отслеживать любимые каналы,
            получать уведомления о премьерах и управлять подписками.
          </p>
          <div style={{marginTop:48, paddingTop:24, borderTop:"1px solid var(--hair-strong)", display:"flex", gap:40}}>
            <div>
              <div className="mono" style={{fontSize:32, fontWeight:500}}>12<span style={{color:"var(--signal)"}}>k+</span></div>
              <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".12em", marginTop:6}}>читателей</div>
            </div>
            <div>
              <div className="mono" style={{fontSize:32, fontWeight:500}}>84/<span className="italic" style={{fontFamily:"var(--serif)"}}>сут</span></div>
              <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".12em", marginTop:6}}>передач в эфире</div>
            </div>
          </div>
        </div>

        <div className="card" style={{padding:36, alignSelf:"center"}}>
          <div className="eyebrow">Form-01</div>
          <h2 style={{marginTop:4, marginBottom:24}}>Войти</h2>
          <div className="col" style={{gap:18}}>
            <div>
              <label className="label">Email или логин</label>
              <input className="input" placeholder="ivanov@mail.ru" defaultValue="a.ivanov" />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password" defaultValue="••••••••" />
              <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
                <label className="row" style={{fontSize:12, gap:6}}><input type="checkbox" defaultChecked /> Запомнить меня</label>
                <a href="#" style={{fontSize:12, color:"var(--ink-2)"}}>Забыли пароль?</a>
              </div>
            </div>
            <button className="btn btn-primary" style={{width:"100%", justifyContent:"center", padding:"13px"}}>Войти →</button>
            <div style={{textAlign:"center", fontSize:13, color:"var(--muted)", marginTop:4}}>
              Нет аккаунта? <a href="#" style={{color:"var(--ink)", borderBottom:"1px solid var(--ink)"}}>Зарегистрируйтесь</a>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ---- 3. Register ---- */
function RegisterScreen() {
  return (
    <Page role="guest" active="schedule">
      <div style={{display:"grid", gridTemplateColumns:"1fr 1.1fr", gap:48, padding:"40px 0", minHeight: 620}}>
        <div className="card" style={{padding:36, alignSelf:"center"}}>
          <div className="eyebrow">Form-02</div>
          <h2 style={{marginTop:4, marginBottom:24}}>Регистрация</h2>
          <div className="col" style={{gap:16}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
              <div>
                <label className="label">Email</label>
                <input className="input" placeholder="you@mail.ru" />
              </div>
              <div>
                <label className="label">Логин</label>
                <input className="input" placeholder="username" />
              </div>
            </div>
            <div>
              <label className="label">Отображаемое имя</label>
              <input className="input" placeholder="Анна Иванова" />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
              <div>
                <label className="label">Пароль</label>
                <input className="input" type="password" defaultValue="••••••" />
              </div>
              <div>
                <label className="label">Повторите</label>
                <input className="input" type="password" defaultValue="••••••" />
              </div>
            </div>
            <div style={{display:"flex", gap:4, marginTop:4}}>
              <div style={{flex:1, height:3, background:"var(--ink)"}}></div>
              <div style={{flex:1, height:3, background:"var(--ink)"}}></div>
              <div style={{flex:1, height:3, background:"var(--ink)"}}></div>
              <div style={{flex:1, height:3, background:"var(--paper-3)"}}></div>
            </div>
            <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em"}}>
              Надёжность: достаточно
            </div>
            <label className="row" style={{fontSize:12, gap:8, marginTop:4}}>
              <input type="checkbox" defaultChecked /> Соглашаюсь с условиями и политикой
            </label>
            <button className="btn btn-primary" style={{width:"100%", justifyContent:"center", padding:"13px", marginTop:8}}>Создать аккаунт →</button>
            <div style={{textAlign:"center", fontSize:13, color:"var(--muted)"}}>
              Уже зарегистрированы? <a href="#" style={{color:"var(--ink)", borderBottom:"1px solid var(--ink)"}}>Войти</a>
            </div>
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{marginBottom:18}}>Новый читатель</div>
          <h1 style={{fontSize:80, lineHeight:0.92}}>
            Создайте<br/>свой <span className="italic">эфирный</span><br/>билет.
          </h1>
          <ul style={{marginTop:32, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:14, maxWidth:380}}>
            {[
              ["I", "Подписка на любимые каналы и оповещения о премьерах"],
              ["II", "Персональная лента «Сегодня в эфире»"],
              ["III", "Сохранение передач и каналов в избранное"],
            ].map(([n, t]) => (
              <li key={n} style={{display:"grid", gridTemplateColumns:"40px 1fr", gap:16, paddingBottom:14, borderBottom:"1px solid var(--hair)"}}>
                <span style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:32, lineHeight:1}}>{n}.</span>
                <span style={{fontSize:14, color:"var(--ink-2)", lineHeight:1.5, paddingTop:4}}>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { ScheduleScreen, LoginScreen, RegisterScreen });
