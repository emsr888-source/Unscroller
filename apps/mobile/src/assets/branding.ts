import { ImageSourcePropType } from 'react-native';

type BrandingAssets = {
  background: ImageSourcePropType;
  logo: ImageSourcePropType;
};

export const BRANDING: BrandingAssets = {
  background: require('../../assets/splash.png'),
  logo: require('../../assets/icon.png'),
};
