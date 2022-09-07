import fs from 'fs-jetpack';
import path from 'path';
import { getCountries } from './countries';
import { getPgEarthData, getPgEarthTakeoffsAndLandings } from './pgearth';
import { mergeAC } from './ac';
import { getDhvData, dhvFindMissingInPGE } from './dhv';
import { getPgSPotsData } from './pgspots';
import { getFlylandData } from './flyland';

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
};

main();
