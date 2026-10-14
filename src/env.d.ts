/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** Browser key for the Maps JavaScript API; restrict it to the app's domains in Google Cloud. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** Map ID from Google Cloud (Map management); its cloud style sets the map's look. Defaults to Google's demo ID. */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
