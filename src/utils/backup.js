import dbStorage from '@/db/storage';
import browser from 'webextension-polyfill';

export async function exportData() {
  try {
    const storage = await browser.storage.local.get(null);
    const storageDb = {};
    dbStorage.tables.forEach(function (table) {
      storageDb[table.name] = table.toArray();
    });
    return { storage, storageDb };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
}

export async function importData({ storage, storageDb }) {
  if (!storage || !storageDb) {
    return false;
  }
  try {
    await browser.storage.local.clear();
    await browser.storage.local.set(storage);
    await dbStorage.transaction('rw', dbStorage.tables, async function () {
      Object.keys(storageDb).forEach(async function (tableName) {
        const table = dbStorage.table(tableName);
        await table.clear();
        await table.bulkAdd(storageDb[tableName]);
      });
    });
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}
