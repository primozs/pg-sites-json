import path from 'path';
import fs from 'fs-jetpack';
const tj = require('@tmcw/togeojson');
import { DOMParser } from 'xmldom';
import { FeatureCollection, Point } from '@turf/helpers';

const output = './data';
const sourcePath = './src-data';

type Properties = {
  name: string;
};

type Site = {
  name: string;
  lat: number;
  lon: number;
  alt: number;
};

export const getFlylandData = async () => {
  const data = await fs.readAsync(
    path.resolve(sourcePath, 'Waypoints_Startplatz.gpx'),
    'utf8',
  );

  const takeoffs: Site[] = [];

  if (data) {
    const gpx = new DOMParser().parseFromString(data);

    const geojson = tj.gpx(gpx) as FeatureCollection<Point, Properties>;

    for (const item of geojson.features) {
      let name = item.properties.name;

      const site: Site = {
        name: name,
        lon: item.geometry.coordinates[0],
        lat: item.geometry.coordinates[1],
        alt: item.geometry.coordinates[2],
      };
      takeoffs.push(site);
    }

    await fs.writeAsync(
      path.resolve(output, 'flyland-takeoffs.json'),
      takeoffs,
    );
  }

  const landingData = await fs.readAsync(
    path.resolve(sourcePath, 'Waypoints_Landeplatz.gpx'),
    'utf8',
  );

  const landings: Site[] = [];

  if (landingData) {
    const gpx = new DOMParser().parseFromString(landingData);

    const geojson = tj.gpx(gpx) as FeatureCollection<Point, Properties>;

    for (const item of geojson.features) {
      let name = item.properties.name;

      const site: Site = {
        name: name,
        lon: item.geometry.coordinates[0],
        lat: item.geometry.coordinates[1],
        alt: item.geometry.coordinates[2],
      };
      landings.push(site);
    }

    await fs.writeAsync(
      path.resolve(output, 'flyland-landings.json'),
      landings,
    );
  }
};
