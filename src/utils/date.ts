export const today = () => new Date().toISOString().slice(0,10);
export function daysSince(date?: string){ if(!date) return Infinity; return Math.floor((Date.now()-new Date(date).getTime())/86400000); }
