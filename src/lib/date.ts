export function tilDatoNøgle(dato = new Date()) {
  return dato.toISOString().slice(0, 10).replaceAll("-", "");
}

export function lægDageTil(dato: Date, dage: number) {
  const næste = new Date(dato);
  næste.setUTCDate(næste.getUTCDate() + dage);
  return næste;
}
