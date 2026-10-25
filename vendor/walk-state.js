/* Pure route/filter rules shared by the page and its drawer. */
const WalkState = (() => {
  const query = p => `${p.name} ${p.address}`;
  const url = (path, params) => `https://www.google.com/maps/${path}?${new URLSearchParams({api: '1', ...params})}`;
  const mapUrl = p => url('search/', {query: query(p), ...(p.googleMapsPlaceId ? {query_place_id: p.googleMapsPlaceId} : {})});
  function directions(list) {
    if (!list.length) return null;
    const params = {travelmode: 'walking', destination: query(list.at(-1))};
    if (list.length > 1) params.origin = query(list[0]);
    if (list.length > 2) params.waypoints = list.slice(1, -1).map(query).join('|');
    return url('dir/', params);
  }
  function routeGroups(list, {maxWaypoints = 3} = {}) {
    const limit = Number.isInteger(maxWaypoints) && maxWaypoints >= 0 && maxWaypoints <= 9 ? maxWaypoints + 2 : 5;
    const groups = []; let current = [];
    for (const place of list) {
      // Mobile browsers support three waypoints, other platforms nine. Preserve the handoff stop.
      if (current.length && (current.length === limit || directions([...current, place]).length > 2048)) {
        groups.push(current); current = [current.at(-1)];
      }
      current.push(place);
    }
    if (current.length) groups.push(current);
    return groups;
  }
  function saveGroups(list) {
    if (list.some(p => !p.googleMapsPlaceId)) return list.map(place => ({items: [place], href: mapUrl(place)}));
    const groups = [];
    for (let i = 0; i < list.length; i += 20) {
      const items = list.slice(i, i + 20);
      groups.push({items, href: items.length === 1 ? mapUrl(items[0]) : url('@', {map_action: 'shortlist', place_ids: items.map(p => p.googleMapsPlaceId).join(',')})});
    }
    return groups;
  }
  function filterPlaces(places, chosen, filter, term) {
    const needle = term.trim().toLocaleLowerCase();
    const ordered = filter === 'selected' ? selectedPlaces(places, chosen) : places;
    return ordered.filter(p => (filter === 'all' || (filter === 'selected' ? chosen.has(p.id) : p.group === filter))
      && `${p.name} ${p.address} ${p.categoryLabel}`.toLocaleLowerCase().includes(needle));
  }
  const selectedPlaces = (places, chosen) => [...chosen].map(id => places.find(p => p.id === id)).filter(Boolean);
  function move(chosen, id, offset) {
    const ids = [...chosen]; const from = ids.indexOf(id); const to = from + offset;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    chosen.clear(); ids.forEach(value => chosen.add(value));
  }
  return {directions, routeGroups, saveGroups, filterPlaces, selectedPlaces, move};
})();
if (typeof module !== 'undefined') module.exports = WalkState;
