import axios from 'axios';
import { FeatureCollection, Point } from '@turf/helpers';
import { Country } from './countries';
import path from 'path';
import fs from 'fs-jetpack';

type PGEPoint = {
  E: string; //num;
  N: string; //num;
  NE: string; //num;
  NW: string; //num;
  S: string; //num;
  SE: string; //num;
  SW: string; //num;
  W: string; //num;
  comments: string;
  countryCode: string;
  ffvl_site_id: string; //num;
  flatland: string; //num;
  flight_rules: string;
  going_there: string;
  hanggliding: string; //num;
  landing_lat: string; //num;
  landing_lng: string; //num;
  landing_parking_lat: string; //num;
  landing_parking_lng: string; //num;
  last_edit: string;
  name: string;
  paragliding: string;
  pge_link: string;
  pge_site_id: string;
  place: string;
  soaring: string;
  takeoff_altitude: string; //num;
  takeoff_description: string;
  takeoff_parking_lat: string;
  takeoff_parking_lng: string;
  thermals: string; //num;
  weather: string;
  winch: string; //num;
  xc: string; //num;
  landing?: {
    site: string;
    landing_name: string;
    landing_lat: string;
    landing_lng: string;
    landing_altitude: string;
    landing_description: string;
  };
};

export type PGEPointLoc = PGEPoint & {
  lat: number;
  lon: number;
};

export const getPgEarthData = async (
  countries: Country[],
): Promise<PGEPointLoc[]> => {
  let sites: PGEPointLoc[] = [];

  for (const country of countries) {
    const url = `http://www.paraglidingearth.com/api/geojson/getCountrySites.php?iso=${country.code}&style=detailled`;
    const { data } = await axios.get<FeatureCollection<Point, PGEPoint>>(url);
    for (const site of data.features) {
      sites.push({
        ...site.properties,
        lat: site.geometry.coordinates[1],
        lon: site.geometry.coordinates[0],
      });
    }
  }
  return sites;
};

type Site = {
  id: string;
  name: string;
  iso2: string;
  alt: number | null;
  lat: number;
  lon: number;
  desc: string;
  pge_link: string;
  directions: string;
};

const getDirections = (p: PGEPointLoc) => {
  const directions: string[] = [];
  if (p.N !== '0') directions.push('N');
  if (p.NE !== '0') directions.push('NE');
  if (p.E !== '0') directions.push('E');
  if (p.SE !== '0') directions.push('SE');
  if (p.S !== '0') directions.push('S');
  if (p.SW !== '0') directions.push('SW');
  if (p.W !== '0') directions.push('W');
  if (p.NW !== '0') directions.push('NW');
  return directions.join(',');
};

export const getPgEarthTakeoffsAndLandings = async () => {
  const output = './data';
  const data = (await fs.readAsync(
    path.resolve(output, 'pgedata.json'),
    'json',
  )) as PGEPointLoc[];

  const takeoffs: Site[] = [];
  const landings: Partial<Site>[] = [];

  if (data) {
    for (const item of data) {
      const site: Site = {
        id: item.pge_site_id,
        name: item.name,
        iso2: item.countryCode.toUpperCase(),
        alt: item.takeoff_altitude ? Number(item.takeoff_altitude) : null,
        desc: item.takeoff_description + ' ' + item.weather ?? '',
        pge_link: item.pge_link,
        lon: item.lon,
        lat: item.lat,
        directions: getDirections(item),
      };
      takeoffs.push(site);

      if (item.landing && item.landing.landing_lat) {
        let landingName = item.landing.landing_name;
        landingName = landingName.replace('null', '');
        const name = landingName || item.landing.site + ' LZ';
        if (!name)
          console.log(item.name, item.landing.site, item.landing.landing_name);
        const landingSite = {
          name,
          lat: Number(item.landing.landing_lat),
          lon: Number(item.landing.landing_lng),
          alt: item.landing.landing_altitude
            ? Number(item.landing.landing_altitude)
            : null,
          desc: item.landing.landing_description,
        };
        landings.push(landingSite);
      }
    }

    await fs.writeAsync(path.resolve(output, 'pge-takeoffs.json'), takeoffs);
    await fs.writeAsync(path.resolve(output, 'pge-landings.json'), landings);
  }
};
