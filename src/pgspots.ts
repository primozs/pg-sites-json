import path from 'path';
import fs from 'fs-jetpack';
import { DOMParser } from 'xmldom';
import { FeatureCollection, Point } from '@turf/helpers';
import axios from 'axios';
import { WriteStream } from 'fs';
import unzip from 'unzip-stream';

const tj = require('@tmcw/togeojson');

const output = './data';

type Properties = {
  name: string;
  styleUrl: string;
  styleHash: string;
  styleMapHash: {
    normal: string;
    highlight: string;
  };
  description: {
    '@type': string;
    value: string;
  };
  icon: string;
  visibility: string;
};

const strReplaceAll = (str = '', search: string, replace: string) => {
  return str.split(search).join(replace);
};

const directionsMap: Record<string, string> = {
  N: 'N',
  NNE: 'NNE',
  NE: 'NE',
  ENE: 'ENE',
  E: 'E',
  ESE: 'ESE',
  SE: 'SE',
  SSE: 'SSE',
  S: 'S',
  SSW: 'SSW',
  SW: 'SW',
  WSW: 'WSW',
  W: 'W',
  WNW: 'WNW',
  NW: 'NW',
  NNW: 'NNW',
};

const typesMap: Record<string, string> = {
  TO: 'TO', // start place
  SP: 'SP', // start place
  SPK: 'SPK', // start place coast
  SPW: 'SPW', // start place winch
  LP: 'LP', // landing place
  GH: 'GH', // ground handling
  UH: 'UH', // training hill,
  HG: 'HG', // hang gliding
};

const iconMapType: Record<string, string> = {
  'https://pgsimg.com/icons/to.png': 'SP',
  'https://pgsimg.com/icons/lz.png': 'LP',
  'https://pgsimg.com/icons/toc.png': 'SP',
  'https://pgsimg.com/icons/dn.png': 'REFERENCE_POINT',
  'https://pgsimg.com/icons/p.png': 'PARKING',
  'https://pgsimg.com/icons/th.png': 'UH', // training hill
  'https://pgsimg.com/icons/tow.png': 'SPW', // start place winch
  'https://pgsimg.com/icons/hg.png': 'HG', // hang gliding tk
  'https://pgsimg.com/icons/i.png': 'INFO',
  'https://pgsimg.com/icons/fb.png': 'FORBIDDEN',
  'https://pgsimg.com/icons/ypp.png': 'NOTHING',
  'https://maps.gstatic.com/mapfiles/ms2/micons/red.png': 'NOTHING',
  'https://www.dhv.de/dbresources/dhv/images/googleearth/windsack_gruen.png':
    'LP',
  'https://maps.google.com/mapfiles/kml/shapes/arrow-reverse.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/campground.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/pal2/icon28.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/arrow.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/airports.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png':
    'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/caution.png': 'NOTHING',
  'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png': 'NOTHING',
  'https://pgsimg.com/icons/ppp.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/paddle/ylw-circle.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/ranger_station.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/pal3/icon56.png': 'NOTHING',
  'http://ozreport.com/images/siteIcon-000.gif': 'NOTHING',
  'http://ozreport.com/images/USHGA.gif': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/open-diamond.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/polygon.png': 'NOTHING',
  'https://maps.google.com/mapfiles/kml/shapes/gas_stations.png': 'NOTHING',
};

export const downloadPgSpotsData = async () => {
  const url = 'https://www.paraglidingspots.com/data/paraglidingspots.kmz';
  await new Promise(async (resolve, reject) => {
    const response = await axios.get<WriteStream>(url, {
      responseType: 'stream',
    });

    response.data.pipe(
      unzip.Extract({ path: path.resolve(output, 'pgspots') }),
    );

    response.data.on('end', () => {
      resolve(true);
    });

    response.data.on('error', (err) => {
      reject(err);
    });
  });

  const data = await fs.readAsync(
    path.resolve(output, 'pgspots', 'doc.kml'),
    'utf8',
  );

  await fs.removeAsync(path.resolve(output, 'pgspots'));
  if (data) {
    const kml = new DOMParser().parseFromString(data);
    const geojson = tj.kml(kml, { styles: true }) as FeatureCollection<
      Point,
      Properties
    >;
    await fs.writeAsync(path.resolve(output, 'pgspots.json'), geojson);
  }
};

const parseName = (name: string) => {
  let parsedType = '';
  let directions = '';
  let parsedName = '';
  let nameTmp = strReplaceAll(name, ', ', ',').replace('\r\n', ' ');
  let nameSp = nameTmp.split(' ');

  let possibleType = nameSp[0]?.trim();
  let hasType = Object.keys(typesMap).find((key) =>
    possibleType?.includes(key),
  );
  if (possibleType === 'xxx') {
    hasType = 'xxx';
  }

  if (hasType) {
    parsedType = hasType ? possibleType : '';
    nameSp = nameSp.slice(1);
  }

  let hasDir = false;
  let possibleDir = nameSp[0]?.trim();
  let containsDir = Object.keys(directionsMap).find((key) =>
    possibleDir?.includes(key),
  );

  if (possibleDir?.includes('(') && possibleDir?.includes(')') && containsDir) {
    hasDir = true;
  }
  if (possibleDir?.includes('(all)') || possibleDir?.includes('(var)')) {
    hasDir = true;
  }

  if (hasDir) {
    directions = possibleDir
      .replace('(', '')
      .replace(')', '')
      .replace('-', ',')
      .replace('all', Object.keys(directionsMap).join(','))
      .replace('var', Object.keys(directionsMap).join(','));
    nameSp = nameSp.slice(1);
  }

  parsedName = nameSp.join(' ');
  parsedName = strReplaceAll(parsedName, '"', '');
  parsedName = strReplaceAll(parsedName, '_', ' ');
  parsedName = strReplaceAll(parsedName, '  ', ' ');
  parsedName = strReplaceAll(parsedName, "'", '`');
  parsedName = strReplaceAll(parsedName, '?', '');
  parsedName = strReplaceAll(parsedName, 'LZ ', '');

  return {
    name: parsedName.trim(),
    parsedType,
    directions,
  };
};

export const getPgSPotsData = async () => {
  const data = (await fs.readAsync(
    path.resolve(output, 'pgspots.json'),
    'json',
  )) as FeatureCollection<Point, Properties>;

  if (data) {
    const spotsTakeoffs = [];
    const spotsLandings = [];

    for (const item of data.features) {
      if (!item || !item.geometry) continue;

      const { geometry, properties } = item;
      const [lon, lat] = geometry.coordinates;
      const location = [lon, lat];
      const { description, icon } = properties;

      let lonIsArray = Array.isArray(location[0]);
      if (lonIsArray) continue;

      let type = iconMapType[icon];

      if (!type) continue;

      let isValidType = typesMap[type];
      if (!isValidType) continue;

      if (!properties.name) continue;

      const { name, directions } = parseName(properties.name);

      // altitude
      let altStr =
        (description?.value || '')
          .match(/^H(.+?)m/)
          ?.pop()
          ?.trim()
          .replace('.', '')
          .replace('approx', '') || '';
      if (altStr.includes('-')) {
        altStr = altStr.split('-')[1];
      }
      const altitude = altStr ? Number(altStr) : null;

      let ratingStr =
        (description?.value || '')
          .match(/rating(.+?)\//)
          ?.pop()
          ?.trim() || '';
      let rating = ratingStr ? Number(ratingStr) : null;

      let id = (description?.value || '')
        .match(/https:\/\/paraglidingspots.com\/fb.aspx\?id=(\d+)/)
        ?.pop();

      if (!id) {
        id = strReplaceAll(name, ' ', '_') + '_' + type;
      }

      const pge_id =
        (description?.value || '')
          .match(/http:\/\/www\.paraglidingearth\.com\/index\.php\?site=(\d+)/)
          ?.pop() || '';

      let loc_type = 'takeoff';

      if (type === 'LP') {
        loc_type = 'landing';
      }

      const newItem = {
        id,
        pge_id,
        name,
        type,
        loc_type,
        rating,
        altitude,
        location,
        directions,
      };
      if (newItem.loc_type === 'takeoff') {
        spotsTakeoffs.push(newItem);
      } else {
        spotsLandings.push(newItem);
      }
    }

    await fs.writeAsync(
      path.resolve(output, 'pgspots-takeoffs.json'),
      spotsTakeoffs,
    );
    await fs.writeAsync(
      path.resolve(output, 'pgspots-landings.json'),
      spotsLandings,
    );
  }
};
