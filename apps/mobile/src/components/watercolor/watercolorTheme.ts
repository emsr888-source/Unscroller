import type { ImageSourcePropType } from 'react-native';
import paperTexture from '../../../assets/images/paper-texture.jpg';

export const STITCH_PAPER_URI =
  'https://img.freepik.com/free-photo/white-paper-texture_1194-5998.jpg?t=st=1730000000~exp=1730003600~hmac=abcdef';

export const PAPER_TEXTURE_SOURCE: ImageSourcePropType = paperTexture;

export const WATERCOLOR_GRADIENTS: Record<'blue' | 'neutral' | 'yellow' | 'red', [string, string]> = {
  blue: ['#dbeafe', '#c7dbff'],
  neutral: ['#ffffff', '#f8fafc'],
  yellow: ['#fef9c3', '#fde68a'],
  red: ['#fecdd3', '#fda4af'],
};
