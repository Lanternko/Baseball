import { fetchShowZone } from './showApi.js'; // 你寫的爬蟲

async function buildPlayer(playerId) {
  const raw = await fetchShowZone(playerId);   // 回傳 0–125 區間
  return {
    name: raw.name,
    pos : raw.position,
    type: 'batter',
    stats: {
      power   : conv((raw.PWR_L + raw.PWR_R) / 2),
      hitRate : conv((raw.CON_L + raw.CON_R) / 2),
      contact : conv(raw.VIS),                 // 視力 → contact
      speed   : conv(raw.SPD)
    }
  };
}
