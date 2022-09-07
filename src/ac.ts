import { parse, Options } from 'csv-parse';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-jetpack';
import distance from '@turf/distance';

const kdTree = require('kdt');

export type Site = {
  site: string;
  country: string;
  longitude: number;
  latitude: number;
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

const distanceFunction = (
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
) => {
  return distance([from.lon, from.lat], [to.lon, to.lat], { units: 'meters' });
};

export const mergeAC = async (): Promise<Site[]> => {
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
          longitude: Number(site.longitude),
          latitude: Number(site.latitude),
        });
      }

      sitesMerged = [...sitesMerged, ...json];
    }
  }

  await fs.writeAsync(path.resolve(output, 'sitesMerged.json'), sitesMerged);

  const wholeAlpsData = await fs.readAsync(
    path.resolve(sourcePath, 'whole_alps.csv'),
  );
  if (wholeAlpsData) {
    const json = (await parseCsv(wholeAlpsData, {
      columns: true,
    })) as unknown as Site[];

    for (const item of json) {
      const found = sitesMerged.find((mitem) => {
        return mitem.site === item.site;
      });

      // if (!found) {
      //   console.log(item);
      // } else {
      //   console.log(item.site);
      // }
    }
  }

  const data = await fs.readAsync(path.resolve(output, 'pgedata.json'), 'json');
  let dimensions = ['lat', 'lon'];
  const tree = kdTree.createKdTree(data, distanceFunction, dimensions);

  for (const site of sitesMerged) {
    const res = tree.nearest({ lat: site.latitude, lon: site.longitude }, 1);
    const firstResult = res[0];

    const [found, dist] = firstResult;
    console.log(site.site, found?.name, dist);
  }

  return sitesMerged;
};
