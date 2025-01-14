import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AVATAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'bottts-neutral',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'notionists-neutral',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral'
];

export function getAvatarUrl(avatarHash, style = 'bottts-neutral') {
  if (!avatarHash) return `https://api.dicebear.com/7.x/${style}/svg?seed=default`;
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(avatarHash)}`;
}

export function generateHash(bits = 16) {
  return crypto.randomBytes(bits).toString("hex");
}

// async function getAndSaveAvatars(){
//   const noOfAvatarsPerStyle = 10;
//   const avatarHashes = [];
//   AVATAR_STYLES.forEach(async style => {
//     for(let i = 0; i < noOfAvatarsPerStyle; i++){
//       const hash = generateHash();
//       avatarHashes.push(hash);
//       const url = getAvatarUrl(hash, style);
//       const path = `public/avatars/${style}/${hash}.svg`;
//       if (!fs.existsSync(`public/avatars/${style}`)){
//         fs.mkdirSync(`public/avatars/${style}`, { recursive: true });
//       }
//       fs.writeFileSync(path, await (await fetch(url)).text());
//     }
//   });
// }

// getAndSaveAvatars();