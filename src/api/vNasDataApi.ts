import type { ApiAirportInfo } from "types/apiTypes/apiAirportInfo";
import type { ApiAircraft } from "types/apiTypes/apiAircraft";
import { VATSIM_CLIENT_ID } from "~/utils/constants";

type LoginDto = {
  nasToken: string;
  vatsimToken: string;
};

export const login = async (code: string, redirectUrl: string) => {
  return fetch(`${import.meta.env.VITE_NAS_SERVER_URL}/api/auth/login?code=${code}&redirectUrl=${redirectUrl}&clientId=${VATSIM_CLIENT_ID}`, {
    credentials: "include",
  }).then((response) => {
    return response.json().then((data: LoginDto) => ({
      ...data,
      statusText: response.statusText,
      ok: response.ok,
    }));
  });
};

export const refreshToken = async (vatsimToken: string) => {
  return fetch(`${import.meta.env.VITE_NAS_SERVER_URL}/api/auth/refresh?vatsimToken=${vatsimToken}`).then((r) =>
    r.text().then((data) => ({ data, statusText: r.statusText, ok: r.ok }))
  );
};

const baseUrl = import.meta.env.VITE_NAS_API_URL;

export async function fetchAirportInfo(airport: string): Promise<ApiAirportInfo | null> {
  return fetch(`${baseUrl}/airports/${airport}`).then((response) => {
    if (response.status === 404) {
      return null;
    }
    return response.json();
  });
}

const AIRCRAFT_URL = `${import.meta.env.VITE_NAS_API_URL}/aircraft`;

export async function fetchAllAircraft(): Promise<ApiAircraft[]> {
  return fetch(AIRCRAFT_URL).then((response) => response.json());
}
