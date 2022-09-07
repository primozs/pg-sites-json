import axios from 'axios';
import { parse, Options } from 'csv-parse';
import { promisify } from 'util';

const url = 'https://davidmegginson.github.io/ourairports-data/countries.csv';

export type Country = {
  id: string;
  code: string;
  name: string;
  continent: string;
  wikipedia_link: string;
  keywords: string;
};

export const getCountries = async (): Promise<Country[]> => {
  const countriesCsv = await axios.get<string>(url);
  const parseCsv = promisify<string, Options>(parse);

  const json = (await parseCsv(countriesCsv.data, {
    columns: true,
  })) as unknown as Country[];

  return json;
};
