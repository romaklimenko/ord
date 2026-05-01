export function tilDatoNøgle(dato = new Date()) {
  return dato.toISOString().slice(0, 10).replaceAll("-", "");
}

export function lægDageTil(dato: Date, dage: number) {
  const næste = new Date(dato);
  næste.setUTCDate(næste.getUTCDate() + dage);
  return næste;
}

export function senesteDatoNøgler(antal: number, slutDato = new Date()) {
  return Array.from({ length: antal }, (_, index) => {
    const dato = new Date(slutDato);
    dato.setUTCDate(slutDato.getUTCDate() - (antal - index - 1));
    return tilDatoNøgle(dato);
  });
}
