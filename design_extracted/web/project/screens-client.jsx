/* ============ CLIENT SCREENS ============ */
/* 4. Profile  5. Dashboard  6. Favorites  7. Subscriptions */

/* ---- 4. Profile ---- */
function ProfileScreen() {
  return (
    <Page role="client" active="dashboard">
      <div className="eyebrow">Аккаунт</div>
      <h1 style={{marginTop:6, marginBottom:24}}>Личные <span className="italic">данные</span></h1>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24}}>
        {/* Identity card */}
        <div className="card" style={{padding:28}}>
          <div className="eyebrow" style={{marginBottom:14}}>Карточка читателя · ID 04417</div>
          <div style={{display:"grid", gridTemplateColumns:"96px 1fr", gap:20, alignItems:"start"}}>
            <div className="ph" style={{width:96, height:96, borderRadius:"50%"}}>фото</div>
            <div style={{display:"grid", gridTemplateColumns:"110px 1fr", rowGap:10, columnGap:14, fontSize:13}}>
              <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>Email</span>
              <span>a.ivanov@mail.ru</span>
              <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>Логин</span>
              <span>a.ivanov</span>
              <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>Имя</span>
              <span>Александр Иванов</span>
              <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>Роль</span>
              <span><span className="tag">CLIENT</span></span>
              <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>Создан</span>
              <span className="mono" style={{fontSize:12}}>14.03.2024 · 09:24</span>
            </div>
          </div>
          <hr className="divider-thin"/>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0}}>
            <Stat n="12" t="избранных каналов"/>
            <Stat n="38" t="избранных передач"/>
            <Stat n="04" t="активных подписки"/>
          </div>
        </div>

        {/* Update form */}
        <div className="card" style={{padding:28}}>
          <div className="eyebrow" style={{marginBottom:14}}>Редактировать профиль</div>
          <div className="col" style={{gap:16}}>
            <div>
              <label className="label">Отображаемое имя</label>
              <input className="input" defaultValue="Александр Иванов"/>
            </div>
            <div>
              <label className="label">Email (только для чтения)</label>
              <input className="input" defaultValue="a.ivanov@mail.ru" disabled style={{opacity:0.6}}/>
            </div>
            <div>
              <label className="label">Аватар</label>
              <div style={{display:"grid", gridTemplateColumns:"72px 1fr", gap:14, alignItems:"center"}}>
                <div className="ph" style={{width:72, height:72, borderRadius:"50%"}}>72×72</div>
                <div className="col" style={{gap:6}}>
                  <button className="btn btn-sm">Выбрать файл…</button>
                  <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>PNG / JPG · до 2 МБ</span>
                </div>
              </div>
            </div>
            <hr className="divider-thin"/>
            <div>
              <label className="label">Сменить пароль</label>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                <input className="input" type="password" placeholder="Текущий"/>
                <input className="input" type="password" placeholder="Новый"/>
              </div>
            </div>
            <div className="row" style={{justifyContent:"space-between", marginTop:8}}>
              <button className="btn btn-danger btn-sm">Удалить аккаунт</button>
              <div className="row" style={{gap:8}}>
                <button className="btn btn-sm">Отмена</button>
                <button className="btn btn-primary btn-sm">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

function Stat({ n, t }) {
  return (
    <div style={{paddingRight:14, borderRight:"1px solid var(--hair)"}}>
      <div style={{fontFamily:"var(--serif)", fontSize:38, lineHeight:1}}>{n}</div>
      <div className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em", marginTop:6}}>{t}</div>
    </div>
  );
}

/* ---- 5. Client Dashboard ---- */
function DashboardScreen() {
  const today = [
    { t: "14:00", title: "Полуденные новости", ch: "Первый эфир", age: "12+", live: true },
    { t: "14:35", title: "Профессии будущего", ch: "Кругозор HD", age: "12+", soon: true },
    { t: "15:00", title: "Док. фильм «Великие реки»", ch: "Первый эфир", age: "6+" },
    { t: "15:30", title: "Археология России", ch: "Кругозор HD", age: "12+" },
    { t: "16:30", title: "Сериал «Северные ветра», эп. 12", ch: "Первый эфир", age: "16+" },
    { t: "18:00", title: "Вечерние новости", ch: "Первый эфир", age: "12+" },
    { t: "19:00", title: "Большое интервью", ch: "Первый эфир", age: "12+" },
  ];
  const channels = [
    ["01", "Первый эфир", "Универсальный", true],
    ["02", "Кругозор HD", "Познавательный", true],
    ["03", "Кинопросмотр", "Кино", false],
    ["04", "Юниор", "Детский", false],
    ["05", "Спорт Лайв", "Спорт", true],
  ];

  return (
    <Page role="client" active="dashboard">
      <div className="eyebrow">Личный кабинет</div>
      <h1 style={{marginTop:6, marginBottom:30}}>
        Здравствуйте, <span className="italic">Александр</span>.
      </h1>

      <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:36}}>
        {/* Today on favorites */}
        <section>
          <SectionHead num="I" title="Сегодня на ваших каналах" sub="7 передач · ближайшие 6 часов"/>
          <div style={{borderTop:"1px solid var(--rule)"}}>
            {today.map((s, i) => (
              <div key={i} className={`slot ${s.live ? "live" : ""}`} style={{gridTemplateColumns:"58px 1fr auto"}}>
                <div className="t">{s.t}</div>
                <div>
                  <div className="title">{s.title}</div>
                  <div className="meta">
                    {s.live && <span className="tag signal live">В эфире</span>}
                    {s.soon && <span className="tag">Через 3 мин</span>}
                    <span>{s.ch}</span>
                  </div>
                </div>
                <div className="row" style={{gap:6}}>
                  <span className="tag age">{s.age}</span>
                  <button className="btn btn-icon btn-ghost" style={{border:"1px solid var(--hair)"}}>♡</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center", marginTop:14}}>
            <a href="#" className="mono" style={{fontSize:11, letterSpacing:".12em", textTransform:"uppercase", borderBottom:"1px solid var(--ink)", paddingBottom:2}}>
              Открыть полное расписание →
            </a>
          </div>
        </section>

        {/* Channel grid */}
        <section>
          <SectionHead num="II" title="Все каналы" sub="5 каналов · подключите больше"/>
          <div className="col" style={{gap:0, borderTop:"1px solid var(--rule)"}}>
            {channels.map(([n, name, cat, fav]) => (
              <div key={n} style={{display:"grid", gridTemplateColumns:"54px 1fr auto", gap:14, padding:"18px 0", borderBottom:"1px solid var(--hair)", alignItems:"center"}}>
                <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:32, color:"var(--ink)", textAlign:"right", lineHeight:1}}>{n}</div>
                <div>
                  <div style={{fontFamily:"var(--serif)", fontSize:22, lineHeight:1}}>{name}</div>
                  <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".12em", marginTop:6}}>{cat}</div>
                </div>
                <div className="row" style={{gap:6}}>
                  <button className="btn btn-sm">Расписание</button>
                  <button className={`btn btn-sm ${fav ? "btn-danger" : ""}`} style={fav ? {} : {borderColor:"var(--hair-strong)"}}>
                    {fav ? "♥ В избранном" : "♡ В избранное"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}

function SectionHead({ num, title, sub, action }) {
  return (
    <div style={{display:"flex", alignItems:"end", justifyContent:"space-between", marginBottom:14}}>
      <div style={{display:"flex", alignItems:"end", gap:14}}>
        {num && <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:42, lineHeight:0.9, color:"var(--ink)"}}>{num}.</div>}
        <div>
          <h2 style={{fontSize:28}}>{title}</h2>
          {sub && <div className="mono" style={{fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginTop:6}}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ---- 6. Favorites ---- */
function FavoritesScreen() {
  const favChannels = [
    { n: "01", name: "Первый эфир", cat: "Универсальный" },
    { n: "02", name: "Кругозор HD", cat: "Познавательный" },
    { n: "05", name: "Спорт Лайв", cat: "Спорт" },
  ];
  const favPrograms = [
    { t: "Северные ветра", g: "Драма · сериал", age: "16+" },
    { t: "Космические одиссеи", g: "Документальный", age: "6+" },
    { t: "Кулинарный класс", g: "Кулинария", age: "0+" },
    { t: "Большое интервью", g: "Ток-шоу", age: "12+" },
    { t: "Археология России", g: "Документальный", age: "12+" },
  ];

  return (
    <Page role="client" active="favorites">
      <div className="eyebrow">Закладки</div>
      <h1 style={{marginTop:6, marginBottom:30}}>
        В <span className="italic">избранном</span>
      </h1>

      <SectionHead num="I" title="Любимые каналы" sub={`${favChannels.length} канала`}/>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14, marginBottom:46}}>
        {favChannels.map(c => (
          <div key={c.n} className="card" style={{padding:22, display:"grid", gridTemplateColumns:"54px 1fr", gap:14, alignItems:"center"}}>
            <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:36, color:"var(--ink)", textAlign:"right", lineHeight:1}}>{c.n}</div>
            <div>
              <div style={{fontFamily:"var(--serif)", fontSize:22, lineHeight:1}}>{c.name}</div>
              <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginTop:6}}>{c.cat}</div>
              <div className="row" style={{gap:6, marginTop:14}}>
                <button className="btn btn-sm">Смотреть</button>
                <button className="btn btn-sm btn-danger">★ Убрать</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionHead num="II" title="Любимые передачи" sub={`${favPrograms.length} передач`}/>
      <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:14}}>
        {favPrograms.map((p, i) => (
          <div key={i} className="card" style={{padding:14, display:"flex", flexDirection:"column", gap:10}}>
            <div className="ph" style={{aspectRatio:"3 / 4"}}>постер<br/>3:4</div>
            <div>
              <div style={{fontFamily:"var(--serif)", fontSize:18, lineHeight:1.05}}>{p.t}</div>
              <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginTop:6}}>{p.g}</div>
            </div>
            <div className="row" style={{justifyContent:"space-between", marginTop:"auto"}}>
              <span className="tag age">{p.age}</span>
              <button className="btn btn-icon btn-sm btn-danger" style={{padding:"4px 8px"}}>★</button>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

/* ---- 7. Subscriptions ---- */
function SubscriptionsScreen() {
  const subs = [
    { n: "01", name: "Первый эфир", cat: "Универсальный", since: "01.01.2026", email: true, push: true },
    { n: "02", name: "Кругозор HD", cat: "Познавательный", since: "14.02.2026", email: true, push: false },
    { n: "05", name: "Спорт Лайв", cat: "Спорт", since: "03.05.2026", email: false, push: true },
  ];
  return (
    <Page role="client" active="subs">
      <div className="eyebrow">Оповещения</div>
      <h1 style={{marginTop:6, marginBottom:30}}>
        Подписки и <span className="italic">уведомления</span>
      </h1>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:36}}>
        <div className="card" style={{padding:28, alignSelf:"start"}}>
          <div className="eyebrow" style={{marginBottom:14}}>Новая подписка</div>
          <div className="col" style={{gap:16}}>
            <div>
              <label className="label">Канал</label>
              <select className="select">
                <option>Кинопросмотр</option>
                <option>Юниор</option>
                <option>Первый эфир</option>
              </select>
            </div>
            <div>
              <label className="label">Каналы доставки</label>
              <div className="col" style={{gap:10}}>
                <label className="row" style={{gap:10, fontSize:13, padding:"10px 12px", border:"1px solid var(--hair-strong)", borderRadius:2}}>
                  <input type="checkbox" defaultChecked/>
                  <span style={{flex:1}}>Email · a.ivanov@mail.ru</span>
                  <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>дайджест 1×/день</span>
                </label>
                <label className="row" style={{gap:10, fontSize:13, padding:"10px 12px", border:"1px solid var(--hair-strong)", borderRadius:2}}>
                  <input type="checkbox"/>
                  <span style={{flex:1}}>Push-уведомления</span>
                  <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>мгновенно</span>
                </label>
              </div>
            </div>
            <button className="btn btn-primary" style={{justifyContent:"center", padding:"13px"}}>Подписаться</button>
          </div>
        </div>

        <div>
          <SectionHead num="" title={`Активные подписки`} sub={`${subs.length} канала · обновлены сегодня`}/>
          <div style={{borderTop:"1px solid var(--rule)"}}>
            {subs.map(s => (
              <div key={s.n} style={{display:"grid", gridTemplateColumns:"60px 1fr auto auto", gap:18, padding:"22px 0", borderBottom:"1px solid var(--hair)", alignItems:"center"}}>
                <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:36, color:"var(--ink)", textAlign:"right", lineHeight:1}}>{s.n}</div>
                <div>
                  <div style={{fontFamily:"var(--serif)", fontSize:22, lineHeight:1}}>{s.name}</div>
                  <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginTop:6}}>
                    {s.cat} · с {s.since}
                  </div>
                </div>
                <div className="row" style={{gap:6}}>
                  {s.email && <span className="tag">✉ Email</span>}
                  {s.push && <span className="tag">⌁ Push</span>}
                </div>
                <button className="btn btn-sm btn-danger">Отписаться</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { ProfileScreen, DashboardScreen, FavoritesScreen, SubscriptionsScreen });
