import {
  getOperatingSystemByCode,
  addOperatingSystem,
  getOperatingSubsystemByCode,
  addOperatingSubsystem
} from '@/lib/utils/db';

const systemsToPopulate = [
"alpine;netboot",
"alpine;standard",
"alpine;extended",
"alpine;virt",
"alpine;remote",
"archlabs;http",
"archlabs;nfs",
"archlabs;iso",
"archlabs;test",
"archlinux;zet",
"archlinux;new",
"archlinux;old",
"archlinux;mini",
"archlinux;cloud",
"archlinux;rem",
"archlinux;test",
"archlinux;console",
"archlinux;cinnamon",
"archlinux;deepin",
"archlinux;gnome",
"archlinux;i3",
"archlinux;kde",
"archlinux;lxqt",
"archlinux;mate",
"archlinux;sway",
"archlinux;xfce",
"atomic;stable",
"atomic;$ver",
"atomic;test",
"breakin;${ver}",
"breakin;4.26",
"clearlinux;$ver",
"clearlinux;old",
"clearlinux-kn;$ver",
"clearlinux-kn;old",
"coreos;testing",
"coreos;stable",
"coreos;next",
"coreos;old",
"coreos;remote",
"coreos;kub",
"coreos;test",
"debian;new",
"debian;old",
"debian;test",
"fedora;raw",
"fedora;rel",
"fedora;net",
"grml;daily",
"grml;2024.02",
"grml;small",
"grml;zetis",
"manjaro;gnome",
"manjaro;kde",
"manjaro;sway",
"manjaro;xface",
"manjaro;text",
"manjaro;#",
"manjaro;21.3.3",
"mfsbsd;14",
"mfsbsd;13",
"mfsbsd;12",
"mfsbsd;#",
"mfsbsd;14.0",
"mfsbsd;13.1",
"mfsbsd;12.2",
"mfslinux;8",
"mfslinux;7",
"mfslinux;r",
"pfsense;dev",
"pfsense;new",
"pfsense;old",
"photon;new",
"photon;old",
"proxmox;ve",
"proxmox;mail",
"proxmox;test",
"rancheros;$ver",
"rancheros;old",
"rancheros;remote",
"smartos;new",
"smartos;old",
"systemrescue;new",
"systemrescue;old",
"systemrescue;beta",
"systemrescue;iso",
"ubuntu;24",
"ubuntu;24s",
"ubuntu;24n",
"ubuntu;23",
"ubuntu;23s",
"ubuntu;22",
"ubuntu;22s",
"ubuntu;22.04",
"ubuntu;zetis",
"ubuntu;test",
"vmware;8.0.1",
"vmware;7.0.2",
"vmware;6.7",
"vmware;6.5",
"vmware;5.5",
"vmware;test",
"wimboot;10",
"wimboot;10i",
"wimboot;10t",
"wimboot;8",
"wimboot;8i",
];

// Helper function to "prettify" codes into names (e.g., capitalize)
function prettifyCode(code: string) {
  if (!code || typeof code !== 'string') return '';
  // Handle special codes like '$ver' or '#' if needed, or just capitalize
  if (code.startsWith('$') || code.startsWith('#')) return code; // Keep as is
  return code.charAt(0).toUpperCase() + code.slice(1);
}

async function populateDatabase() {
  console.log('Starting database population...');
  let osAddedCount = 0;
  let subSysAddedCount = 0;

  for (const entry of systemsToPopulate) {
      const parts = entry.split(';');
      const systemCode = parts[0].trim();
      const subSystemCode = parts.length > 1 ? parts[1].trim() : null;

      if (!systemCode) {
          console.warn(`Skipping empty system code in entry: "${entry}"`);
          continue;
      }

      // 1. Handle Operating System
      let osRecord = await getOperatingSystemByCode(systemCode);

      if (!osRecord) {
          const systemName = prettifyCode(systemCode);
          console.log(`  Adding Operating System: code='${systemCode}', name='${systemName}'`);
          await addOperatingSystem(systemName, systemCode); // Your function: addOperatingSystem(name, code)
          osRecord = await getOperatingSystemByCode(systemCode); // Re-fetch to get the ID

          if (!osRecord) {
              console.error(`  ERROR: Failed to add or retrieve OS after insert: ${systemCode}`);
              continue; // Skip to next entry if OS couldn't be established
          }
          osAddedCount++;
      }
      const operatingSystemId = osRecord.id;

      // 2. Handle SubSystem (if it exists)
      if (subSystemCode && subSystemCode.length > 0) {
          // Check if subsystem already exists for this OS
          const subSystemRecord = await getOperatingSubsystemByCode(subSystemCode, operatingSystemId);

          if (!subSystemRecord) {
              const subSystemName = prettifyCode(subSystemCode);
              console.log(`    Adding SubSystem: code='${subSystemCode}', name='${subSystemName}' for OS ID ${operatingSystemId} (${systemCode})`);
              // Your function: addOperatingSubsystem(code, name, operatingSystemId)
              await addOperatingSubsystem(subSystemCode, subSystemName, operatingSystemId);
              subSysAddedCount++;
          }
      }
  }

  console.log('------------------------------------------');
  console.log('Database population process complete.');
  console.log(`Operating Systems added: ${osAddedCount}`);
  console.log(`SubSystems added: ${subSysAddedCount}`);
  console.log('Note: Existing entries were skipped.');
  console.log('------------------------------------------');
}

populateDatabase().catch(err => {
  console.error("An error occurred during database population:", err);
});
