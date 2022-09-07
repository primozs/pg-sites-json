import { parse, Options } from 'csv-parse';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-jetpack';

export type Site = {
  site: string;
  country: string;
  name: string;
  lat: number;
  lon: number;
  // ...
};

const output = './data';
const sourcePath = './src-data/ac';
const files = [
  'austria.csv',
  'france.csv',
  'germany.csv',
  'italy.csv',
  'pyrenees.csv',
  'slovenia.csv',
  'switzerland.csv',
];

export const mergeAC = async () => {
  const parseCsv = promisify<string, Options>(parse);

  let sitesMerged: Site[] = [];

  for (const filePath of files) {
    const data = await fs.readAsync(path.resolve(sourcePath, filePath));

    if (data) {
      const json = (await parseCsv(data, {
        columns: true,
      })) as unknown as Site[];

      for (const site of json) {
        sitesMerged.push({
          ...site,
          name: site.site,
          // @ts-ignore
          lon: Number(site.longitude),
          // @ts-ignore
          lat: Number(site.latitude),
        });
      }
    }
  }

  await fs.writeAsync(path.resolve(output, 'sitesMerged.json'), sitesMerged);
};
