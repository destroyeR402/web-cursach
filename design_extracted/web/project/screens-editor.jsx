/* ============ EDITOR SCREENS ============ */
/* 8. Grid Editor  9. Programs Management */

/* ---- 8. Grid Editor ---- */
function GridEditorScreen() {
  const pool = [
    ["Полуденные новости", 30, "Новости"],
    ["Северные ветра, эп. 12", 50, "Драма"],
    ["Космические одиссеи: Юпитер", 50, "Док."],
    ["Большое интервью", 60, "Ток-шоу"],
    ["Прогноз погоды", 10, "Информ."],
    ["Археология России", 45, "Док."],
    ["Кулинарный класс", 30, "Кулинария"],
    ["Профессии будущего", 55, "Образоват."],
  ];
  const hours = Array.from({length:24}, (_, i) => i);
  const placed = {
    8: { title: "Утренний кофе", from: "08:00", to: "09:00", color: "var(--paper-3)" },
    11: { title: "Кулинарный класс", from: "11:30", to: "12:00", color: "var(--paper-3)" },
    12: { title: "Полдник", from: "12:00", to: "13:30", color: "var(--paper-2)", span: 1.5 },
    14: { title: "Полуденные новости", from: "14:00", to: "14:30", color: "var(--signal-soft)", live: true, signal: true },
    15: { title: "Великие реки", from: "15:00", to: "16:35", color: "var(--paper-2)", span: 1.5 },
    18: { title: "Вечерний эфир", from: "18:00", to: "19:00", color: "var(--paper-3)" },
    19: { title: "Большое интервью", from: "19:00", to: "20:00", color: "var(--paper-3)" },
  };

  return (
    <Page role="editor" active="grid">
      <div className="row" style={{justifyContent:"space-between", marginBottom:18}}>
        <div>
          <div className="eyebrow">Редактор сетки</div>
          <h1 style={{marginTop:6, fontSize:48}}>Программирование <span className="italic">эфира</span></h1>
        </div>
        <div className="row" style={{gap:8}}>
          <select className="select" style={{width:200}}><option>Канал · Первый эфир</option><option>Канал · Кругозор HD</option></select>
          <input className="input" defaultValue="2026-05-27" style={{width:140}}/>
          <button className="btn">Открыть</button>
          <button className="btn btn-primary">Опубликовать сетку</button>
        </div>
      </div>

      <div className="card" style={{display:"grid", gridTemplateColumns:"300px 1fr", overflow:"hidden", border:"1px solid var(--rule)"}}>
        {/* Left rail: program pool */}
        <aside style={{borderRight:"1px solid var(--rule)", background:"var(--paper-2)"}}>
          <div style={{padding:"16px 18px", borderBottom:"1px solid var(--rule)"}}>
            <div className="eyebrow">Пул передач · 37</div>
            <input className="input" placeholder="🔍 Поиск передачи…" style={{marginTop:10}}/>
          </div>
          <div style={{maxHeight:660, overflow:"auto"}}>
            {pool.map(([n, m, g], i) => (
              <div key={i} style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--hair)",
                cursor: "grab",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                background: i === 2 ? "var(--paper)" : "transparent",
                borderLeft: i === 2 ? "3px solid var(--ink)" : "3px solid transparent",
              }}>
                <div>
                  <div style={{fontSize:13, fontWeight:500, lineHeight:1.25}}>{n}</div>
                  <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em", marginTop:4}}>
                    {g} · {m} мин
                  </div>
                </div>
                <div style={{color:"var(--muted)", fontSize:14}}>⋮⋮</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: hour timeline */}
        <div style={{position:"relative", background:"var(--paper)"}}>
          <div style={{display:"flex", justifyContent:"space-between", padding:"14px 22px", borderBottom:"1px solid var(--rule)"}}>
            <div>
              <div style={{fontFamily:"var(--serif)", fontSize:24, lineHeight:1}}>Первый эфир · среда 27.05</div>
              <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginTop:6}}>
                18 слотов · 22 ч 30 мин занято · 1 ч 30 мин окон
              </div>
            </div>
            <div className="row" style={{gap:8}}>
              <button className="btn btn-sm">⎘ Скопировать с пред.</button>
              <button className="btn btn-sm">Очистить день</button>
            </div>
          </div>

          <div style={{maxHeight:580, overflow:"auto", padding:"6px 22px 22px"}}>
            {hours.map(h => {
              const p = placed[h];
              const isCurrent = h === 14;
              return (
                <div key={h} style={{
                  display:"grid",
                  gridTemplateColumns:"58px 1fr",
                  alignItems:"start",
                  borderTop: h === 0 ? "none" : "1px solid var(--hair)",
                  position: "relative",
                  minHeight: 56,
                }}>
                  <div className="mono" style={{
                    padding:"10px 0",
                    fontSize:12,
                    color: isCurrent ? "var(--signal)" : "var(--muted)",
                    fontWeight: isCurrent ? 600 : 400,
                  }}>{String(h).padStart(2,"0")}:00</div>
                  <div style={{padding:"6px 0", minHeight:56, position:"relative"}}>
                    {p && (
                      <div style={{
                        background: p.color,
                        border: p.signal ? "1px solid var(--signal)" : "1px solid var(--ink)",
                        borderRadius: 2,
                        padding: "8px 12px",
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                        minHeight: (p.span ? 56 * p.span : 44),
                      }}>
                        <div>
                          <div style={{fontSize:13, fontWeight:500}}>{p.title}</div>
                          <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em", marginTop:3}}>
                            {p.from} – {p.to}{p.live && <span style={{color:"var(--signal)", marginLeft:8}}>● В ЭФИРЕ</span>}
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-icon" style={{padding:"2px 6px", fontSize:14}}>×</button>
                      </div>
                    )}
                    {!p && h === 16 && (
                      /* drag-target hint */
                      <div style={{
                        border:"1.5px dashed var(--ink)", borderRadius:2, padding:"8px 12px",
                        display:"flex", justifyContent:"space-between",
                        background:"rgba(20,17,14,0.03)",
                      }}>
                        <span className="mono" style={{fontSize:11, textTransform:"uppercase", letterSpacing:".1em"}}>↳ Отпустите, чтобы добавить · 16:00</span>
                        <span className="mono" style={{fontSize:11, color:"var(--muted)"}}>пусто</span>
                      </div>
                    )}
                    {isCurrent && (
                      <div style={{position:"absolute", left:-22, right:-22, top: 6 + 22, height:1, background:"var(--signal)", pointerEvents:"none"}}>
                        <span style={{
                          position:"absolute", left:-2, top:-4, width:8, height:8, background:"var(--signal)", borderRadius:"50%"
                        }}></span>
                        <span className="mono" style={{
                          position:"absolute", right:0, top:-18, fontSize:9, color:"var(--signal)", letterSpacing:".1em", textTransform:"uppercase",
                          background:"var(--paper)", padding:"0 4px"
                        }}>14:32 NOW</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }).slice(7, 21)}
          </div>

          {/* Conflict bar */}
          <div style={{
            margin:"0 22px 18px",
            padding:"12px 14px",
            background:"var(--signal-soft)",
            border:"1px solid var(--signal)",
            borderRadius:2,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            fontSize:13,
          }}>
            <div>
              <b style={{color:"var(--signal)"}}>1 конфликт:</b> «Кулинарный класс» (11:30–12:00) пересекается с «Полдником» (12:00–13:30). Время начала: <span className="mono">11:30</span>.
            </div>
            <div className="row" style={{gap:6}}>
              <button className="btn btn-sm">Сдвинуть</button>
              <button className="btn btn-sm btn-danger">Удалить</button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating slot modal */}
      <div style={{
        position:"absolute", right:64, top:380, width:340, zIndex:5,
        background:"var(--paper)", border:"1px solid var(--rule)", boxShadow:"8px 8px 0 var(--ink)",
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid var(--rule)"}}>
          <div className="eyebrow">Добавить слот · drop-target</div>
          <button className="btn btn-ghost btn-icon">×</button>
        </div>
        <div style={{padding:16}} className="col">
          <div>
            <label className="label">Передача</label>
            <input className="input" defaultValue="Космические одиссеи: Юпитер"/>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div>
              <label className="label">Начало</label>
              <input className="input mono" defaultValue="16:00"/>
            </div>
            <div>
              <label className="label">Конец (авто)</label>
              <input className="input mono" defaultValue="16:50" style={{opacity:0.7}}/>
            </div>
          </div>
          <div className="row" style={{justifyContent:"space-between", marginTop:6}}>
            <button className="btn btn-sm">Отмена</button>
            <button className="btn btn-primary btn-sm">Добавить слот</button>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ---- 9. Programs Management ---- */
function ProgramsScreen() {
  const programs = [
    { id: 12, title: "Северные ветра", g: "Драма", age: "16+", m: 50, d: "Сериал о жителях прибрежного посёлка…" },
    { id: 18, title: "Космические одиссеи", g: "Док.", age: "6+", m: 50, d: "Путешествие по планетам Солнечной системы…" },
    { id: 21, title: "Кулинарный класс", g: "Кулинария", age: "0+", m: 30, d: "Бретонские блины с морепродуктами…" },
    { id: 24, title: "Полуденные новости", g: "Новости", age: "12+", m: 30, d: "Главные события дня каждые 30 минут…" },
    { id: 27, title: "Большое интервью", g: "Ток-шоу", age: "12+", m: 60, d: "Беседа с приглашённым гостем…" },
    { id: 32, title: "Археология России", g: "Док.", age: "12+", m: 45, d: "Открытия года, экспедиции…" },
  ];
  return (
    <Page role="editor" active="programs">
      <div className="row" style={{justifyContent:"space-between", alignItems:"end", marginBottom:24}}>
        <div>
          <div className="eyebrow">Каталог</div>
          <h1 style={{marginTop:6}}>Передачи <span className="mono" style={{fontFamily:"var(--mono)", fontSize:22, color:"var(--muted)", verticalAlign:"middle"}}>· всего 37</span></h1>
        </div>
        <button className="btn btn-primary">+ Добавить передачу</button>
      </div>

      {/* Add form (expanded) */}
      <div className="card" style={{padding:24, marginBottom:24, background:"var(--paper-2)", borderStyle:"dashed"}}>
        <div className="eyebrow" style={{marginBottom:14}}>Новая передача · форма</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16}}>
          <div>
            <label className="label">Название *</label>
            <input className="input" placeholder="«Великие реки»"/>
          </div>
          <div>
            <label className="label">Длительность (мин) *</label>
            <input className="input mono" placeholder="95"/>
          </div>
          <div>
            <label className="label">Возраст</label>
            <select className="select"><option>6+</option><option>12+</option><option>16+</option><option>18+</option></select>
          </div>
          <div>
            <label className="label">Жанр</label>
            <select className="select"><option>Документальный</option><option>Драма</option><option>Новости</option></select>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label className="label">Описание</label>
            <textarea className="input" rows="2" placeholder="Краткое описание для расписания…"></textarea>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label className="label">Постер</label>
            <div style={{display:"grid", gridTemplateColumns:"96px 1fr", gap:14, alignItems:"start"}}>
              <div className="ph" style={{aspectRatio:"3 / 4", width:96}}>3:4</div>
              <div className="col" style={{gap:6}}>
                <button className="btn btn-sm">Выбрать файл…</button>
                <span className="mono muted" style={{fontSize:10, textTransform:"uppercase", letterSpacing:".1em"}}>PNG / JPG · до 5 МБ · оптим. 600×800</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:8}}>
            <button className="btn btn-primary">Создать</button>
            <button className="btn">Сбросить</button>
          </div>
        </div>
      </div>

      {/* Search + paginator */}
      <div className="row" style={{justifyContent:"space-between", marginBottom:10}}>
        <input className="input" placeholder="🔍 Поиск по названию…" style={{maxWidth:360}}/>
        <div className="row" style={{gap:4}}>
          {["‹", "1", "2", "3", "…", "9", "›"].map((p, i) => (
            <button key={i} className={`btn btn-sm ${p === "2" ? "btn-primary" : ""}`} style={{padding:"6px 10px", minWidth:34, justifyContent:"center"}}>{p}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width:60}}>Постер</th>
              <th>Название</th>
              <th style={{width:120}}>Жанр</th>
              <th style={{width:80}}>Возраст</th>
              <th style={{width:90}}>Длит.</th>
              <th>Описание</th>
              <th style={{width:120}}></th>
            </tr>
          </thead>
          <tbody>
            {programs.map(p => (
              <tr key={p.id}>
                <td><div className="ph" style={{width:40, height:54}}>3:4</div></td>
                <td>
                  <div style={{fontFamily:"var(--serif)", fontSize:18, lineHeight:1}}>{p.title}</div>
                  <div className="mono" style={{fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginTop:4}}>ID·{String(p.id).padStart(4,"0")}</div>
                </td>
                <td><span className="tag">{p.g}</span></td>
                <td><span className="tag age">{p.age}</span></td>
                <td className="num">{p.m} мин</td>
                <td style={{color:"var(--ink-2)", maxWidth:280}}>{p.d}</td>
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

Object.assign(window, { GridEditorScreen, ProgramsScreen });
