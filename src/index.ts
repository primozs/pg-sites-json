import fs from 'fs-jetpack';
import path from 'path';
import { getCountries } from './countries';
import { getPgEarthData, getPgEarthTakeoffsAndLandings } from './pgearth';
import { mergeAC } from './ac';
import { getDhvData, dhvFindMissingInPGE } from './dhv';
import { downloadPgSpotsData, getPgSPotsData } from './pgspots';
import { getFlylandData } from './flyland';
import { compare, merge } from './compare';

const output = './data';

const main = async () => {
  // const countries = await getCountries();
  // await fs.writeAsync(path.resolve(output, 'countries.json'), countries);
  // const pgeData = await getPgEarthData(countries);
  // await fs.writeAsync(path.resolve(output, 'pgedata.json'), pgeData);
  // await mergeAC();
  // await getDhvData();
  // await dhvFindMissingInPGE();
  // await getFlylandData();
  // await getPgEarthTakeoffsAndLandings();
  // await downloadPgSpotsData();
  // await getPgSPotsData();

  await merge('pge-takeoffs.json', 'takeoffs.json');

  await merge('flyland-takeoffs.json', 'takeoffs.json', {
    none: 'None',
    LessThen50m: 'UpdateName',
    LessThen100m: 'UpdateLoLaName',
    LessThen200m: 'UpdateLoLaName',
    LessThen300m: 'UpdateLoLaName',
    LessThen500m: 'AddPoint',
    MoreThen500m: 'AddPoint',
  });

  await compare('flyland-takeoffs.json', 'takeoffs.json', {
    list: 'none',
  });

  await merge('dhv-takeoffs.json', 'takeoffs.json', {
    none: 'None',
    LessThen50m: 'UpdateName',
    LessThen100m: 'UpdateName',
    LessThen200m: 'UpdateLoLaName',
    LessThen300m: 'UpdateLoLaName',
    LessThen500m: 'AddPoint',
    MoreThen500m: 'AddPoint',
  });

  await compare('dhv-takeoffs.json', 'takeoffs.json', {
    list: 'LessThen500m',
  });

  await merge('pgspots-takeoffs.json', 'takeoffs.json', {
    none: 'None',
    LessThen50m: 'None',
    LessThen100m: 'None',
    LessThen200m: 'None',
    LessThen300m: 'None',
    LessThen500m: 'AddPoint',
    MoreThen500m: 'AddPoint',
  });

  await compare('pgspots-takeoffs.json', 'takeoffs.json', {
    list: 'none',
  });

  await merge('sitesMerged.json', 'takeoffs.json', {
    none: 'None',
    LessThen50m: 'None',
    LessThen100m: 'None',
    LessThen200m: 'None',
    LessThen300m: 'None',
    LessThen500m: 'AddPoint',
    MoreThen500m: 'AddPoint',
  });

  await compare('sitesMerged.json', 'takeoffs.json', {
    list: 'none',
  });

  await merge('pge-landings.json', 'landings.json');

  await merge('flyland-landings.json', 'landings.json', {
    none: 'None',
    LessThen50m: 'UpdateLoLaName',
    LessThen100m: 'UpdateLoLaName',
    LessThen200m: 'UpdateLoLaName',
    LessThen300m: 'UpdateLoLaName',
    LessThen500m: 'AddPoint',
    MoreThen500m: 'AddPoint',
  });

  await compare('flyland-landings.json', 'landings.json', {
    list: 'none',
  });

  await merge('dhv-landings.json', 'landings.json', {
    none: 'None',
    LessThen50m: 'UpdateName',
    LessThen100m: 'UpdateName',
    LessThen200m: 'UpdateLoLaName',
    LessThen300m: 'UpdateLoLaName',
    LessThen500m: 'AddPoint',
    MoreThen500m: 'AddPoint',
  });

  await compare('dhv-landings.json', 'landings.json', {
    list: 'LessThen500m',
  });

  await merge('pgspots-landings.json', 'landings.json', {
    none: 'None',
    LessThen50m: 'None',
    LessThen100m: 'None',
    LessThen200m: 'None',
    LessThen300m: 'None',
    LessThen500m: 'AddPoint',
    MoreThen500m: 'AddPoint',
  });

  await compare('pgspots-landings.json', 'landings.json', {
    list: 'none',
  });
};

main();
