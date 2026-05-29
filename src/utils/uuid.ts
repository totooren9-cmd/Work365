export function toUUID(id: string | undefined | null): string {
  if (!id) return '00000000-0000-0000-0000-000000000000';
  
  // Clean string
  const str = String(id).trim();
  
  // Check if already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str.toLowerCase();
  }
  
  // Generate deterministic UUID
  const clean = str.replace(/[^0-9a-f]/gi, '').toLowerCase();
  const pad = (clean + '1234567890abcdef1234567890abcdef').slice(0, 32);
  
  const part1 = pad.substring(0, 8);
  const part2 = pad.substring(8, 12);
  const part3 = '4' + pad.substring(13, 16); // v4 SPEC
  const part4 = 'a' + pad.substring(17, 20); // variant 10xx
  const part5 = pad.substring(20, 32);
  
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}
