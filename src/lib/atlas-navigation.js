export function atlasDestination(detail, payload, knownIds) {
  if (detail !== "compare") {
    return { tab: detail === "observer" ? "observer" : "atlas", cloudId: null, comparisonIds: [] };
  }
  const ids = [...new Set((payload || "").split(","))]
    .filter((id) => knownIds.includes(id))
    .slice(0, 3);
  if (ids.length === 1) return { tab: "atlas", cloudId: ids[0], comparisonIds: [] };
  return { tab: ids.length ? "compare" : "atlas", cloudId: null, comparisonIds: ids };
}
