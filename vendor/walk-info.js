/* Static, checked walking estimates apply only to the exact proposal order. */
const WalkInfo = (() => {
  function describe(places, routes) {
    if (!places.length) return null;
    const route = routes.find(item => item.ids.length === places.length
      && item.ids.every((id, index) => id === places[index].id));
    const walking = route?.walking;
    const walkingMinutes = walking ? Math.max(5, Math.ceil(walking.durationSeconds / 300) * 5) : null;
    const totalHours = route?.totalMinutes ? [...new Set(route.totalMinutes.map(minutes => minutes / 60))] : walking && route.visitMinutes
      ? route.visitMinutes.map(minutes => Math.ceil((minutes + walkingMinutes) / 30) / 2) : null;
    return {route, walking, walkingMinutes, totalHours, start: route?.start || places[0], end: route?.end || places.at(-1)};
  }
  function render(container, places, routes, {showStops = false} = {}) {
    const info = describe(places, routes);
    container.replaceChildren();
    container.hidden = !info;
    if (!info) return;
    const metrics = document.createElement('p'); metrics.className = 'route-metrics';
    metrics.textContent = info.walking
      ? `${places.length} 站 · 步行約 ${info.walkingMinutes} 分 · ${(info.walking.distanceMeters / 1000).toFixed(1)} 公里`
      : places.length === 1 ? '1 站 · 單點停留' : `${places.length} 站 · 自訂路線`;
    const budget = document.createElement('p'); budget.className = 'route-time-budget';
    budget.textContent = info.totalHours ? `建議預留 ${info.totalHours.join('–')} 小時（店內停留約 ${info.route.visitMinutes.join('–')} 分）`
      : places.length === 1 ? '開啟導航確認前往這一站的步行時間。' : '店家順序已更新；步行距離與時間請由導航確認。';
    container.append(metrics, budget);
    const note = document.createElement('p'); note.className = 'route-estimate-note';
    note.textContent = info.walking
      ? `步行估算查核於 ${info.walking.checkedAt.replaceAll('-', '.')}；停留為編輯建議，未含候位與額外購物時間。實際路線以導航與當日路況為準。`
      : '依目前加入與調整後的順序出發；可在「我的散策」繼續調整。';
    if (info.walking) {
      const source = document.createElement('a'); source.href = '#route-estimate-sources';
      source.textContent = '估算來源與說明'; source.className = 'route-estimate-source';
      source.addEventListener('click', event => {
        const dialog = container.closest('dialog');
        if (!dialog) return;
        event.preventDefault(); dialog.close();
        requestAnimationFrame(() => {
          const target = document.getElementById('route-estimate-sources');
          target.focus({preventScroll: true}); target.scrollIntoView({block: 'start', behavior: 'instant'});
        });
      });
      note.append(' ', source);
    }
    if (showStops) {
      const details = document.createElement('details'); details.className = 'route-sequence';
      const summary = document.createElement('summary'); summary.textContent = '路線順序與起終點';
      const list = document.createElement('ol');
      places.forEach((place, index) => {
        const item = document.createElement('li');
        const label = places.length === 1 ? '起終點' : index === 0 ? '起點' : index === places.length - 1 ? '終點' : `第 ${index + 1} 站`;
        item.textContent = `${label} · ${place.name}`; list.append(item);
      });
      details.append(summary, list, note); container.append(details);
    } else container.append(note);
  }
  return {describe, render};
})();
if (typeof module !== 'undefined') module.exports = WalkInfo;
