import { clouds, getCloud } from "../data/clouds.js";
import { getCloudProfile, getTaxonomyTerm } from "../data/encyclopedia.js";

const allCloudIds = clouds.map((cloud) => cloud.id);

export const specialCloudRules = [
  {
    id: "flammagenitus",
    label: "pożar, erupcja lub inne naturalne źródło ciepła",
    genera: ["cumulus", "cumulonimbus"],
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "homogenitus",
    label: "działalność człowieka",
    genera: allCloudIds,
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "homomutatus",
    label: "przemiana trwałej chmury homogenitus",
    genera: ["cirrus", "cirrocumulus", "cirrostratus"],
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "cataractagenitus",
    label: "rozbryzg dużego wodospadu",
    genera: ["cumulus", "stratus"],
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "silvagenitus",
    label: "zwiększona wilgotność nad lasem",
    genera: ["stratus"],
    sourceIds: ["wmoSpecialClouds"],
  },
];

export const nomenclaturePresets = [
  {
    id: "layered-altocumulus",
    label: "Wiele odmian",
    hint: "perlucidus może współistnieć z translucidus",
    selection: {
      cloudId: "altocumulus",
      speciesId: "stratiformis",
      varietyIds: ["perlucidus", "translucidus"],
      featureIds: [],
      accessoryIds: [],
      originId: null,
      evidenceConfirmed: false,
    },
  },
  {
    id: "variety-conflict",
    label: "Znajdź sprzeczność",
    hint: "dwie odmiany opisują przeciwne własności optyczne",
    selection: {
      cloudId: "altocumulus",
      speciesId: "stratiformis",
      varietyIds: ["translucidus", "opacus"],
      featureIds: [],
      accessoryIds: [],
      originId: null,
      evidenceConfirmed: false,
    },
  },
  {
    id: "mother-cloud",
    label: "Historia przemiany",
    hint: "formalna nazwa potrzebuje dowodu pochodzenia",
    selection: {
      cloudId: "cirrus",
      speciesId: "spissatus",
      varietyIds: [],
      featureIds: [],
      accessoryIds: [],
      originId: "mother:genitus:cumulonimbogenitus",
      evidenceConfirmed: false,
    },
  },
  {
    id: "contrail",
    label: "Wyjątek smugi",
    hint: "trwała świeża smuga ma nazwę bez dodatków morfologicznych",
    selection: {
      cloudId: "cirrus",
      speciesId: null,
      varietyIds: [],
      featureIds: [],
      accessoryIds: [],
      originId: "contrail",
      evidenceConfirmed: true,
    },
  },
];

export const emptyNomenclatureSelection = {
  cloudId: "altocumulus",
  speciesId: null,
  varietyIds: [],
  featureIds: [],
  accessoryIds: [],
  originId: null,
  evidenceConfirmed: false,
};

function unique(values = []) {
  return [...new Set(values)];
}

function selectedTerms(ids) {
  return unique(ids).map(getTaxonomyTerm).filter(Boolean);
}

function originName(origin) {
  if (!origin) return null;
  if (origin.type === "contrail") return "homogenitus";
  return origin.name;
}

export function getNomenclatureOrigins(cloudId) {
  const profile = getCloudProfile(cloudId);
  if (!profile) return [];

  const motherClouds = [
    ...profile.motherClouds.genitus.map((name) => ({
      id: `mother:genitus:${name}`,
      type: "mother",
      mode: "genitus",
      name,
      label: `${name} · część chmury macierzystej`,
      sourceIds: ["wmoMotherClouds"],
    })),
    ...profile.motherClouds.mutatus.map((name) => ({
      id: `mother:mutatus:${name}`,
      type: "mother",
      mode: "mutatus",
      name,
      label: `${name} · przemiana całej chmury`,
      sourceIds: ["wmoMotherClouds"],
    })),
  ];
  const specialClouds = specialCloudRules
    .filter((rule) => rule.genera.includes(cloudId))
    .map((rule) => ({
      ...rule,
      type: "special",
      name: rule.id,
      label: `${rule.id} · ${rule.label}`,
    }));
  const contrail = cloudId === "cirrus"
    ? [{
        id: "contrail",
        type: "contrail",
        name: "homogenitus",
        label: "Cirrus homogenitus · świeża smuga trwająca co najmniej 10 minut",
        sourceIds: ["wmoContrails"],
      }]
    : [];

  return [...motherClouds, ...specialClouds, ...contrail];
}

export function nomenclatureOptions(cloudId) {
  const cloud = getCloud(cloudId);
  if (!cloud) return null;

  return {
    cloud,
    species: selectedTerms(cloud.species),
    varieties: selectedTerms(cloud.varieties),
    features: selectedTerms(cloud.features),
    accessory: selectedTerms(cloud.accessoryClouds),
    origins: getNomenclatureOrigins(cloudId),
  };
}
export function normalizeNomenclatureSelection(selection) {
  const cloud = getCloud(selection?.cloudId) || clouds[0];
  const includes = (field, id) => id && cloud[field].includes(id);
  const filter = (field, ids) => unique(ids).filter((id) => cloud[field].includes(id));
  const origins = getNomenclatureOrigins(cloud.id);

  return {
    cloudId: cloud.id,
    speciesId: includes("species", selection?.speciesId) ? selection.speciesId : null,
    varietyIds: filter("varieties", selection?.varietyIds || []),
    featureIds: filter("features", selection?.featureIds || []),
    accessoryIds: filter("accessoryClouds", selection?.accessoryIds || []),
    originId: origins.some((origin) => origin.id === selection?.originId)
      ? selection.originId
      : null,
    evidenceConfirmed: Boolean(selection?.evidenceConfirmed),
  };
}

export function evaluateNomenclature(selection) {
  const normalized = normalizeNomenclatureSelection(selection);
  const cloud = getCloud(normalized.cloudId);
  const origins = getNomenclatureOrigins(cloud.id);
  const origin = origins.find((item) => item.id === normalized.originId) || null;
  const species = normalized.speciesId ? getTaxonomyTerm(normalized.speciesId) : null;
  const varieties = selectedTerms(normalized.varietyIds);
  const features = selectedTerms(normalized.featureIds);
  const accessory = selectedTerms(normalized.accessoryIds);
  const conflicts = [];

  if (
    normalized.varietyIds.includes("translucidus")
    && normalized.varietyIds.includes("opacus")
  ) {
    conflicts.push(
      "translucidus i opacus wzajemnie się wykluczają: warstwa nie może jednocześnie odsłaniać i całkowicie zasłaniać tarczy Słońca lub Księżyca.",
    );
  }

  if (
    origin?.type === "contrail"
    && (
      species
      || varieties.length
      || features.length
      || accessory.length
    )
  ) {
    conflicts.push(
      "Świeża trwała smuga kondensacyjna otrzymuje wyłącznie nazwę Cirrus homogenitus, bez gatunku, odmiany i cech dodatkowych.",
    );
  }

  const name = [
    cloud.name,
    species?.name,
    ...varieties.map((term) => term.name),
    ...features.map((term) => term.name),
    ...accessory.map((term) => term.name),
    originName(origin),
  ].filter(Boolean).join(" ");
  const requiresEvidence = Boolean(origin);
  const status = conflicts.length
    ? "conflict"
    : requiresEvidence && !normalized.evidenceConfirmed
      ? "needs-evidence"
      : "valid";
  const sourceIds = unique([
    "wmoSummary",
    "wmoPrinciples",
    ...(origin?.sourceIds || []),
  ]);

  return {
    normalized,
    cloud,
    origin,
    name,
    status,
    conflicts,
    requiresEvidence,
    sourceIds,
    explanation: status === "conflict"
      ? "Nazwa zawiera elementy, których reguły WMO nie pozwalają użyć razem."
      : status === "needs-evidence"
        ? "Składnia jest dopuszczalna, ale końcówka opisuje historię lub przyczynę powstania, której zwykle nie da się ustalić z pojedynczego kadru."
        : requiresEvidence
          ? "Nazwa jest spójna, a obserwacja historii lub źródła powstania została świadomie potwierdzona."
          : "Nazwa jest spójna z tabelą zgodności rodzaju i wybranych określeń WMO.",
    layers: [
      { label: "Rodzaj", value: cloud.name },
      { label: "Gatunek", value: species?.name || "nie wybrano" },
      {
        label: "Odmiany",
        value: varieties.length ? varieties.map((term) => term.name).join(", ") : "nie wybrano",
      },
      {
        label: "Cechy",
        value: [...features, ...accessory].length
          ? [...features, ...accessory].map((term) => term.name).join(", ")
          : "nie wybrano",
      },
      { label: "Pochodzenie", value: originName(origin) || "nie podano" },
    ],
  };
}
