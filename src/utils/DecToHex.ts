export const DecToHex = (dec: number) => {
  return dec.toString(16).toUpperCase()
}

export const HexToDec = (hex: string) => {
  return parseInt(hex, 16)
}