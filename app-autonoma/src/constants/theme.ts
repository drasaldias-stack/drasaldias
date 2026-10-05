// Paleta de la app: tinta verde azulada sobre fondos levemente verdosos, y el amarillo de cinta métrica
// para marcar avance. Cada color existe en claro y oscuro.

export const Colors = {
  light: {
    bg: '#F2F5F3',
    surface: '#FFFFFF',
    surface2: '#E5EBE7',
    ink: '#16201C',
    ink2: '#51605A',
    line: '#CFD9D3',
    accent: '#0D5C63',
    accentInk: '#FFFFFF',
    accentSoft: '#D7EBEC',
    tape: '#F2C12E',
    tapeInk: '#2B2304',
    warn: '#8F4C0A',
    warnBg: '#F8E7D3',
    crit: '#B3261E',
    critBg: '#F8DEDB',
    ok: '#23704A',
    okBg: '#DCEFE3',
  },
  dark: {
    bg: '#0E1513',
    surface: '#151E1B',
    surface2: '#1F2A26',
    ink: '#E3EAE6',
    ink2: '#9AA8A2',
    line: '#2C3934',
    accent: '#67C1C4',
    accentInk: '#06282A',
    accentSoft: '#163A3C',
    tape: '#E5B93A',
    tapeInk: '#231C03',
    warn: '#E89A4A',
    warnBg: '#35240F',
    crit: '#F2786C',
    critBg: '#3A1A17',
    ok: '#63C08C',
    okBg: '#16301F',
  },
} as const;

export type Paleta = { [K in keyof typeof Colors.light]: string };

export const Spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const Radius = { s: 6, m: 10, pill: 999 } as const;
export const MaxContentWidth = 560;
