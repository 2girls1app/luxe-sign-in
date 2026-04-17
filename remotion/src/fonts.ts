import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

const inter = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const playfair = loadPlayfair("normal", { weights: ["700"], subsets: ["latin"] });

export const FONT_BODY = inter.fontFamily;
export const FONT_DISPLAY = playfair.fontFamily;
