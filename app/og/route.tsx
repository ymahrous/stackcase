import { brand } from "@/lib/brand";
import { marketingImage } from "@/lib/og";

export const dynamic = "force-static";

export function GET() {
  return marketingImage(brand.tagline);
}
