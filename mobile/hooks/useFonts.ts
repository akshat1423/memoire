import { useEffect } from 'react';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import {
  Pacifico_400Regular,
  useFonts as usePacificoFont,
} from '@expo-google-fonts/pacifico';
import {
  Allura_400Regular,
  useFonts as useAlluraFont,
} from '@expo-google-fonts/allura';
import {
  PlayfairDisplay_400Regular,
  useFonts as usePlayfairDisplayFont,
} from '@expo-google-fonts/playfair-display'; 
import {
  Italianno_400Regular,
  useFonts as useItaliannoFont,
} from '@expo-google-fonts/italianno';
import {
  Tangerine_400Regular,
  useFonts as useTangerineFont,
} from '@expo-google-fonts/tangerine'; // Import Tangerine
import {
  Merriweather_400Regular,
  useFonts as useMerriweatherFonts,
} from '@expo-google-fonts/merriweather';
import {
  Tagesschrift_400Regular,
  useFonts as useTagesschriftFonts,
} from '@expo-google-fonts/tagesschrift';

import { SplashScreen } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

export function useFonts() {
  const [interFontsLoaded, interFontError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [pacificoLoaded, pacificoError] = usePacificoFont({
    Pacifico_400Regular,
  });

  const [alluraLoaded, alluraError] = useAlluraFont({
    Allura_400Regular,
  });

  const [playfairDisplayLoaded, playfairDisplayError] = usePlayfairDisplayFont({
    PlayfairDisplay_400Regular,
  });

  const [italiannoLoaded, italiannoError] = useItaliannoFont({
    Italianno_400Regular,
  });

  const [tangerineLoaded, tangerineError] = useTangerineFont({
    Tangerine_400Regular, // Add Tangerine font loading
  });

  const [merriweatherLoaded, merriweatherError] = useMerriweatherFonts({
    Merriweather_400Regular,
  });

  const [tagesschriftLoaded, tagesschriftError] = useTagesschriftFonts({
    Tagesschrift_400Regular,
  });

  const fontsLoaded = interFontsLoaded && pacificoLoaded && alluraLoaded && playfairDisplayLoaded && italiannoLoaded && tangerineLoaded; // Check for all fonts
  const fontError = interFontError || pacificoError || alluraError || playfairDisplayError || italiannoError || tangerineError; // Check for font loading errors

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, fontError };
}
