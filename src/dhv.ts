import qs from 'qs';
import path from 'path';
import fs from 'fs-jetpack';
const tj = require('@tmcw/togeojson');
import { DOMParser } from 'xmldom';
import { FeatureCollection, Point } from '@turf/helpers';
import distance from '@turf/distance';
const kdTree = require('kdt');

const output = './data';
const sourcePath = './src-data';

type Properties = {
  name: string;
  desc: string;
  links: { href: string; text: string }[];
};

type DhvSite = {
  dhv_id: string | null;
  name: string;
  desc: string;
  dhv_link: string | null;
  lat: number;
  lon: number;
  alt: number;
};

export const getDhvData = async () => {
  const data = await fs.readAsync(
    path.resolve(sourcePath, 'dhvgelaende_gpx_alle.gpx'),
    'utf8',
  );

  const dhvData: DhvSite[] = [];
  const dhvTakeoffs: DhvSite[] = [];
  const dhvLandings: DhvSite[] = [];

  if (data) {
    const gpx = new DOMParser().parseFromString(data);

    const geojson = tj.gpx(gpx) as FeatureCollection<Point, Properties>;

    for (const item of geojson.features) {
      const firstLink = item.properties.links[0];
      let linkData: Record<string, any> = {};

      if (firstLink) {
        linkData = qs.parse(firstLink.href) as Record<string, any>;
      }

      const isTakeoff = item.properties.name.includes('Startplatz');
      let name = item.properties.name.replace('Startplatz', '');
      name = name.replace('Landeplatz', '');
      name = name.replace('  ', ' ');
      name = name.trim();

      const site: DhvSite = {
        dhv_id: linkData.item || null,
        name: name,
        desc: item.properties.desc,
        dhv_link: firstLink?.href || null,
        lon: item.geometry.coordinates[0],
        lat: item.geometry.coordinates[1],
        alt: item.geometry.coordinates[2],
      };
      dhvData.push(site);
      if (isTakeoff) {
        dhvTakeoffs.push(site);
      } else {
        dhvLandings.push(site);
      }
    }

    await fs.writeAsync(path.resolve(output, 'dhv-takeoffs.json'), dhvTakeoffs);
    await fs.writeAsync(path.resolve(output, 'dhv-landings.json'), dhvLandings);
  }
};

const distanceFunction = (
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
) => {
  return distance([from.lon, from.lat], [to.lon, to.lat], { units: 'meters' });
};

export const dhvFindMissingInPGE = async () => {
  const dhvData = (await fs.readAsync(
    path.resolve(output, 'dhv-takeoffs.json'),
    'json',
  )) as DhvSite[];
  const pgeData = await fs.readAsync(
    path.resolve(output, 'pgedata.json'),
    'json',
  );

  let dimensions = ['lat', 'lon'];
  const tree = kdTree.createKdTree(pgeData, distanceFunction, dimensions);

  console.log(dhvData.length);

  let countFound = 0;
  let countSemiFound = 0;
  let countNotFound = 0;
  for (const site of dhvData) {
    const res = tree.nearest({ lat: site.lat, lon: site.lon }, 1);
    const firstResult = res[0];

    const [found, dist] = firstResult;
    if (dist < 50) {
      countFound += 1;
      // console.log(site.name, dist, found?.name);
    } else if (dist < 100) {
    } else if (dist < 300) {
      countSemiFound += 1;
      // console.log(site.name, dist, found?.name);
    } else {
      countNotFound += 1;
      console.log(site.name, dist, found?.name);
    }
  }

  console.log('countFound', countFound);
  console.log('countSemiFound', countSemiFound);
  console.log('countNotFound', countNotFound);
};
