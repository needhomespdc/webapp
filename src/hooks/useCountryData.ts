import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ICountry, IState } from 'country-state-city';

type CountryStateData = {
  Country: { getAllCountries: () => ICountry[] };
  State: { getStatesOfCountry: (countryCode?: string) => IState[] };
};
export type CountryOption = { value: string; label: string };

// country-state-city ships every country, state and city in the world. Imported statically it
// made the Profile page wait for ~650 KB before rendering, so only the country and state files
// are loaded, in the background, and shared by every caller once they arrive. (Importing the
// package root here would also pull in its 8 MB city list.)
let loaded: CountryStateData | null = null;
let loading: Promise<CountryStateData> | null = null;

function loadCountryData(): Promise<CountryStateData> {
  loading ??= Promise.all([
    import('country-state-city/lib/country'),
    import('country-state-city/lib/state'),
  ]).then(([country, state]) => (loaded = { Country: country.default, State: state.default }));
  return loading;
}

/**
 * Country and state options for address fields. `ready` is false until the data has loaded;
 * until then `countries` is empty and `getStates` returns [].
 */
export function useCountryData() {
  const [data, setData] = useState<CountryStateData | null>(loaded);

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    loadCountryData().then((mod) => {
      if (!cancelled) setData(mod);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  // Built once, not on every render (the full list is ~250 countries)
  const countries = useMemo<CountryOption[]>(
    () => (data ? data.Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name })) : []),
    [data]
  );

  const getStates = useCallback(
    (countryIso: string): CountryOption[] =>
      data && countryIso ? data.State.getStatesOfCountry(countryIso).map((s) => ({ value: s.name, label: s.name })) : [],
    [data]
  );

  // Older profiles saved the country's full name rather than its ISO code
  const toIsoCode = useCallback(
    (countryNameOrIso: string): string | undefined =>
      countryNameOrIso.length <= 3 ? countryNameOrIso : countries.find((c) => c.label === countryNameOrIso)?.value,
    [countries]
  );

  return { ready: Boolean(data), countries, getStates, toIsoCode };
}
