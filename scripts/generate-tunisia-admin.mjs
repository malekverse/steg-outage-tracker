import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const hierarchyPath = path.join(
  process.env.HIERARCHY_JSON ||
    'C:/Users/malek/.cursor/projects/c-Users-malek-OneDrive-Attachments-Documents-GitHub-steg-outage-tracker/agent-tools/5df4f25c-b78e-472b-8aa9-c5965e9fec47.txt',
)

const GOV_ALIASES = {
  Manubah: 'Manouba',
  'Le Kef': 'Kef',
  Kassérine: 'Kasserine',
  'Sidi Bou Zid': 'Sidi Bouzid',
}

const GOV_ORDER = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Kef',
  'Siliana',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Gabès',
  'Médenine',
  'Tataouine',
  'Gafsa',
  'Tozeur',
  'Kebili',
]

const EXTRA_KEYWORDS = {
  Tunis: ['tunis', 'تونس'],
  Ariana: ['ariana', 'أريانة', 'aryana'],
  'Ben Arous': ['ben arous', 'بن عروس'],
  Manouba: ['manouba', 'manubah', 'منوبة'],
  Nabeul: ['nabeul', 'نابل'],
  Zaghouan: ['zaghouan', 'زغوان'],
  Bizerte: ['bizerte', 'بنزرت'],
  Béja: ['béja', 'beja', 'باجة'],
  Jendouba: ['jendouba', 'جندوبة'],
  Kef: ['kef', 'le kef', 'الكاف'],
  Siliana: ['siliana', 'سليانة'],
  Kairouan: ['kairouan', 'القيروان'],
  Kasserine: ['kasserine', 'kassérine', 'القصرين'],
  'Sidi Bouzid': ['sidi bouzid', 'sidi bou zid', 'سيدي بوزيد'],
  Sousse: ['sousse', 'سوسة'],
  Monastir: ['monastir', 'المنستير'],
  Mahdia: ['mahdia', 'المهدية'],
  Sfax: ['sfax', 'صفاقس'],
  Gabès: ['gabès', 'gabes', 'قابس'],
  Médenine: ['médenine', 'medenine', 'مدنين'],
  Tataouine: ['tataouine', 'تطاوين'],
  Gafsa: ['gafsa', 'قفصة'],
  Tozeur: ['tozeur', 'توزر'],
  Kebili: ['kebili', 'قبلي'],
}

async function main() {
  const hierarchy = JSON.parse(fs.readFileSync(hierarchyPath, 'utf8'))

  // Governorate coordinates from open admin data API file
  const govRes = await fetch(
    'https://raw.githubusercontent.com/open-admin-data/tunisia-administrative-divisions/master/data/all-governorate.json',
  )
  const govGeoList = await govRes.json()
  const geoByName = Object.fromEntries(
    govGeoList.map(g => {
      const display = GOV_ALIASES[g.name.en] || g.name.en
      return [
        display,
        {
          lat: parseFloat(g.geo.lat),
          lng: parseFloat(g.geo.lon),
          zoom: 10,
        },
      ]
    }),
  )

  const delegationByGovernorate = {}
  const delegationKeywords = {}

  for (const region of hierarchy.data) {
    for (const gov of region.governorate || []) {
      const display = GOV_ALIASES[gov.name.en] || gov.name.en
      const delegations = (gov.delegation || [])
        .map(d => d.name.en)
        .sort((a, b) => a.localeCompare(b, 'fr'))
      delegationByGovernorate[display] = delegations
      for (const d of gov.delegation || []) {
        delegationKeywords[d.name.en] = display
      }
    }
  }

  const tunisianGovernorates = GOV_ORDER.filter(g => delegationByGovernorate[g])
  let totalDelegations = 0
  for (const g of tunisianGovernorates) totalDelegations += delegationByGovernorate[g].length

  const out = `// Auto-generated from Open Admin Data (CC-BY-4.0)
// https://github.com/open-admin-data/tunisia-administrative-divisions
// ${tunisianGovernorates.length} governorates, ${totalDelegations} delegations

export const tunisianGovernorates = ${JSON.stringify(tunisianGovernorates, null, 2)} as const

export type TunisianGovernorate = (typeof tunisianGovernorates)[number]

export const delegationByGovernorate: Record<TunisianGovernorate, readonly string[]> = ${JSON.stringify(delegationByGovernorate, null, 2)} as const

/** Maps delegation name → governorate for search */
export const delegationToGovernorate: Record<string, TunisianGovernorate> = ${JSON.stringify(delegationKeywords, null, 2)}

export const governorateCenters: Record<TunisianGovernorate, { lat: number; lng: number; zoom: number }> = ${JSON.stringify(geoByName, null, 2)}

export const governorateKeywords: Record<TunisianGovernorate, string[]> = ${JSON.stringify(
    Object.fromEntries(
      tunisianGovernorates.map(g => [g, EXTRA_KEYWORDS[g] || [g.toLowerCase()]]),
    ),
    null,
    2,
  )}
`

  const outPath = path.join(root, 'src/lib/tunisia-admin-data.ts')
  fs.writeFileSync(outPath, out, 'utf8')
  console.log(`Wrote ${outPath}`)
  console.log(`${tunisianGovernorates.length} governorates, ${totalDelegations} delegations`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
