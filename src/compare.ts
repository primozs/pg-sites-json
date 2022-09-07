import path from 'path';
import fs from 'fs-jetpack';
import distance from '@turf/distance';
const kdTree = require('kdt');

const distanceFunction = (
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
) => {
  return distance([from.lon, from.lat], [to.lon, to.lat], { units: 'meters' });
};

type Site = {
  name: string;
  lat: number;
  lon: number;
};

type List =
  | 'none'
  | 'LessThen50m'
  | 'LessThen100m'
  | 'LessThen200m'
  | 'LessThen300m'
  | 'LessThen500m'
  | 'MoreThen500m';

type Action = 'UpdateName' | 'UpdateLoLaName' | 'AddPoint' | 'None';

type Options = {
  list: List;
};

export const compare = async (
  compareFn: string,
  withFn: string,
  opt: Options = { list: 'none' },
) => {
  const output = './data';
  const compareData = (await fs.readAsync(
    path.resolve(output, compareFn),
    'json',
  )) as Site[];

  const withData = await fs.readAsync(path.resolve(output, withFn), 'json');

  let dimensions = ['lat', 'lon'];
  const tree = kdTree.createKdTree(withData, distanceFunction, dimensions);

  let countLessThen50m = 0;
  let countLessThen100m = 0;
  let countLessThen200m = 0;
  let countLessThen300m = 0;
  let countLessThen500m = 0;
  let countMoreThen500m = 0;
  for (const site of compareData) {
    const res = tree.nearest({ lat: site.lat, lon: site.lon }, 1);
    const firstResult = res[0];

    const [found, dist] = firstResult;
    if (dist < 50) {
      countLessThen50m += 1;
      if (opt.list === 'LessThen50m') {
        console.log(site.name, dist, found?.name);
      }
    } else if (dist < 100) {
      countLessThen100m += 1;
      if (opt.list === 'LessThen100m') {
        console.log(site.name, dist, found?.name);
      }
    } else if (dist < 200) {
      countLessThen200m += 1;
      if (opt.list === 'LessThen200m') {
        console.log(site.name, dist, found?.name);
      }
    } else if (dist < 300) {
      countLessThen300m += 1;
      if (opt.list === 'LessThen300m') {
        console.log(site.name, dist, found?.name);
      }
    } else if (dist < 500) {
      countLessThen500m += 1;
      if (opt.list === 'LessThen500m') {
        console.log(site.name, dist, found?.name);
      }
    } else {
      countMoreThen500m += 1;
      if (opt.list === 'MoreThen500m') {
        console.log(site.name, dist, found?.name);
      }
    }
  }

  console.log(compareFn, compareData.length);
  console.log(withFn, withData.length);
  console.log('');

  console.log('countLessThen50m', countLessThen50m);
  console.log('countLessThen100m', countLessThen100m);
  console.log('countLessThen200m', countLessThen200m);

  console.log('countLessThen300m', countLessThen300m);
  console.log('countLessThen500m', countLessThen500m);
  console.log('countMoreThen500m', countMoreThen500m);
};

const red = (state: Site[], action: Action, site: Site, found: Site) => {
  switch (action) {
    case 'UpdateName':
      // mutation
      found.name = site.name;
      return state;
    case 'UpdateLoLaName':
      // mutation
      found.name = site.name;
      found.lat = site.lat;
      found.lon = site.lon;
      return state;
    case 'AddPoint':
      return [...state, { name: site.name, lat: site.lat, lon: site.lon }];
    case 'None':
      return state;
    default:
      return state;
  }
};

export const merge = async (
  fromFn: string,
  toFn: string,
  merge?: Record<List, Action>,
) => {
  const output = './data';
  const fromData = (await fs.readAsync(
    path.resolve(output, fromFn),
    'json',
  )) as Site[];

  const toData = (await fs.readAsync(
    path.resolve(output, toFn),
    'json',
  )) as Site[];

  if (toData && merge) {
    let dimensions = ['lat', 'lon'];

    const td = toData.map((item) => {
      return { name: item.name, lat: item.lat, lon: item.lon };
    });
    const tree = kdTree.createKdTree(td, distanceFunction, dimensions);

    let newToData = [...td];
    for (const site of fromData) {
      const res = tree.nearest({ lat: site.lat, lon: site.lon }, 1);
      const firstResult = res[0];
      const [found, dist] = firstResult;
      if (dist < 50) {
        newToData = red(newToData, merge['LessThen50m'], site, found);
      } else if (dist < 100) {
        newToData = red(newToData, merge['LessThen100m'], site, found);
      } else if (dist < 200) {
        newToData = red(newToData, merge['LessThen200m'], site, found);
      } else if (dist < 300) {
        newToData = red(newToData, merge['LessThen300m'], site, found);
      } else if (dist < 500) {
        newToData = red(newToData, merge['LessThen500m'], site, found);
      } else {
        newToData = red(newToData, merge['MoreThen500m'], site, found);
      }
    }
    await fs.writeAsync(path.resolve(output, toFn), newToData);
  } else {
    // copy everything
    const items: Site[] = [];
    for (const item of fromData) {
      items.push({ name: item.name, lat: item.lat, lon: item.lon });
    }
    await fs.writeAsync(path.resolve(output, toFn), items);
  }
};
