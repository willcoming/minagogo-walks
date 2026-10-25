/* Merge only overlapping 48px circular markers; source coordinates do not move. */
(function (root) {
  function groupPoints(points, diameter = 48) {
    const center = members => ({
      x: members.reduce((sum, p) => sum + p.x, 0) / members.length,
      y: members.reduce((sum, p) => sum + p.y, 0) / members.length
    });
    const groups = points.map(p => ({members: [p], x: p.x, y: p.y}));
    // Nearest pairs first avoid folding a distant neighbor into a broad group.
    while (true) {
      let pair;
      let nearest = diameter;
      for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
        const distance = Math.hypot(groups[i].x - groups[j].x, groups[i].y - groups[j].y);
        if (distance < nearest) {nearest = distance; pair = [i, j];}
      }
      if (!pair) break;
      const [i, j] = pair;
      const members = [...groups[i].members, ...groups[j].members];
      const remaining = groups.filter((_, index) => index !== i && index !== j);
      const midpoint = center(members);
      // Anchor at an actual member, so an isolated shop cannot be swallowed
      // by a newly averaged center. Prefer the member covering fewest neighbors.
      const candidates = members.map(member => ({member,
        overlaps: remaining.filter(g => Math.hypot(g.x - member.x, g.y - member.y) < diameter).length,
        distance: Math.hypot(member.x - midpoint.x, member.y - midpoint.y)
      })).sort((a, b) => a.overlaps - b.overlaps || a.distance - b.distance);
      const {x, y} = candidates[0].member;
      groups[i] = {members, x, y}; groups.splice(j, 1);
    }
    return groups;
  }
  const api = {groupPoints};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WalkMapLayout = api;
})(typeof window === 'undefined' ? globalThis : window);
