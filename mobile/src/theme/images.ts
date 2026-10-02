import type { ImageSourcePropType } from 'react-native';

/**
 * A local `require()` asset or a remote URL. `DestinationImage` handles both so
 * screens never branch on source type.
 */
export type ImageSource = number | { uri: string };

/**
 * Every image the UI uses is declared here, so re-pointing branding or swapping
 * photography later is a single-file change rather than a sweep through screens.
 */
export const images = {
  brand: {
    logo: require('../../assets/icon.png') as ImageSourcePropType,
    mark: require('../../assets/icon.png') as ImageSourcePropType,
    splash: require('../../assets/splash-icon.png') as ImageSourcePropType,
    avatarFallback: require('../../assets/icon.png') as ImageSourcePropType,
  },

  /**
   * Destination photography. Remote during development; replace the entries with
   * local `require()` assets for production and nothing else needs to change.
   */
  destinations: {
    udaipur: { uri: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=900&q=80' },
    manali: { uri: 'https://images.unsplash.com/photo-1622290281560-9d89b6a76d0a?w=900&q=80' },
    coorg: { uri: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=900&q=80' },
    goa: { uri: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&q=80' },
    jaipur: { uri: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=900&q=80' },
    andaman: { uri: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=900&q=80' },
    munnar: { uri: 'https://images.unsplash.com/photo-1524498250077-390f9e378fc0?w=900&q=80' },
    varanasi: { uri: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=900&q=80' },
  } as Record<string, ImageSource>,

  /** Backgrounds for the three Insights Today cards. */
  insights: {
    trending: { uri: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80' },
    weather: { uri: 'https://images.unsplash.com/photo-1583537662660-b3b14156e275?w=600&q=80' },
    hiddenGem: { uri: 'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=600&q=80' },
  } as Record<string, ImageSource>,

  /** Onboarding carousel. */
  onboarding: [
    { uri: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=900&q=80' },
    { uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=80' },
    { uri: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=900&q=80' },
  ] as ImageSource[],
} as const;

/** Placeholder shown when a remote image fails to load. */
export const fallbackImage: ImageSource = { uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80' };