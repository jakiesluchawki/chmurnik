import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const appIconDirectory = path.resolve(
  "ios/App/App/Assets.xcassets/AppIcon.appiconset",
);
const splashDirectory = path.resolve(
  "ios/App/App/Assets.xcassets/Splash.imageset",
);
const iconSource = path.resolve("resources/icon.png");
const splashSource = path.resolve("resources/splash.png");

await mkdir(appIconDirectory, { recursive: true });
await mkdir(splashDirectory, { recursive: true });

await sharp(iconSource)
  .resize(1024, 1024, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(path.join(appIconDirectory, "AppIcon-512@2x.png"));

const appIconContents = {
  images: [
    {
      idiom: "universal",
      size: "1024x1024",
      filename: "AppIcon-512@2x.png",
      platform: "ios",
    },
  ],
  info: { author: "xcode", version: 1 },
};

await writeFile(
  path.join(appIconDirectory, "Contents.json"),
  `${JSON.stringify(appIconContents, null, 2)}\n`,
);

const splashImages = [];
for (const scale of [1, 2, 3]) {
  const filename = `Default@${scale}x~universal~anyany.jpg`;
  await sharp(splashSource)
    .resize(2732, 2732, { fit: "cover" })
    .jpeg({ quality: 88, progressive: true, mozjpeg: true })
    .toFile(path.join(splashDirectory, filename));
  splashImages.push({ idiom: "universal", filename, scale: `${scale}x` });
}

const splashContents = {
  images: splashImages,
  info: { version: 1, author: "xcode" },
};

await writeFile(
  path.join(splashDirectory, "Contents.json"),
  `${JSON.stringify(splashContents, null, 2)}\n`,
);

console.log("Generated the current CHMURNIK icon and launch artwork for iOS.");
