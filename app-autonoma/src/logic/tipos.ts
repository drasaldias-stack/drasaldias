// Tipos compartidos por el contenido, la lógica y las pantallas.
// Los archivos de src/logic y src/content usan solo imports relativos para poder probarse con Node.

export type Equipo = 'horno' | 'olla' | 'airfryer' | 'microondas' | 'licuadora';
// La cocinilla o encimera se asume siempre disponible.
export type EquipoReceta = Equipo | 'cocinilla' | 'sin_coccion';

export type Patron = 'omnivoro' | 'vegetariano';

export type Exclusion =
  | 'lacteos'
  | 'gluten'
  | 'huevo'
  | 'pescado'
  | 'cerdo'
  | 'vacuno'
  | 'pollo'
  | 'soya'
  | 'frutos_secos'
  | 'cebolla'
  | 'champinones'
  | 'picante'
  | 'cilantro';

export type Rol = 'proteina' | 'carbohidrato' | 'verdura' | 'salsa' | 'desayuno';

export type CategoriaCompra =
  | 'Verduras y frutas'
  | 'Carnes, pescados y huevos'
  | 'Legumbres, cereales y tubérculos'
  | 'Lácteos y alternativas'
  | 'Despensa';

export type Ingrediente = {
  nombre: string;
  /** Cantidad por persona para todas las porciones que rinde el componente en la semana. */
  cantidad: number;
  unidad: 'g' | 'ml' | 'unidad' | 'cda' | 'cdta' | 'diente';
  categoria: CategoriaCompra;
  /** Ingredientes de despensa que no se escalan ni se suman (sal, especias). */
  basico?: boolean;
};

export type Componente = {
  id: string;
  nombre: string;
  rol: Rol;
  /** Patrones en que se puede usar. Un componente vegetariano sirve para ambos. */
  patrones: Patron[];
  /** Basta con tener uno de estos equipos. */
  equipos: EquipoReceta[];
  contiene: Exclusion[];
  minutosActivos: number;
  minutosTotales: number;
  /** Días que dura refrigerado desde el día en que se cocina. */
  refrigeradorDias: number;
  congelable: boolean;
  /** Comidas por persona que rinde en la semana. */
  porciones: number;
  ingredientes: Ingrediente[];
  pasos: string[];
  nota?: string;
};

export type Material = 'silla' | 'banda' | 'pesas' | 'colchoneta';

export type Ejercicio = {
  id: string;
  nombre: string;
  tipo: 'fuerza' | 'cardio' | 'movilidad';
  requiere: Material[];
  /** Ejercicio que se usa si falta algún material requerido. */
  alternativa?: string;
  instrucciones: string[];
  cuidado: string;
};

export type ItemSesion = { ejercicio: string; cantidad: number; unidad: 'reps' | 'seg' };

export type Sesion = { id: string; nombre: string; items: ItemSesion[] };

export type Bloque = { semanas: [number, number]; sesiones: Sesion[] };

export type ProgramaId = 'desde_cero' | 'fuerza_casa' | 'bajo_impacto';

export type Programa = {
  id: ProgramaId;
  nombre: string;
  paraQuien: string;
  bloques: Bloque[];
  caminata: { semanaDesde: number; minutosDia: number; dias: number; texto: string }[];
};

export type Clase = {
  id: string;
  semana: number;
  titulo: string;
  minutos: number;
  resumen: string;
  puntos: string[];
  videoUrl: string | null;
};

export type RespuestasSeguridad = {
  mayorEdad: boolean;
  embarazoLactancia: boolean;
  conductaAlimentaria: boolean;
  insulinaSulfonilurea: boolean;
  sintomasEsfuerzo: boolean;
  enfermedadConocida: boolean;
};

export type EstadoAcceso = 'ok' | 'requiere_confirmacion' | 'bloqueado';

export type ResultadoSeguridad = {
  apta: boolean;
  alimentacion: EstadoAcceso;
  ejercicio: EstadoAcceso;
  mensajes: string[];
};

export type PreferenciasCocina = {
  personas: number;
  minutos: 60 | 90 | 120;
  equipos: Equipo[];
  patron: Patron;
  exclusiones: Exclusion[];
};

export type PreferenciasEjercicio = {
  programa: ProgramaId;
  minutos: 10 | 20 | 30;
  materiales: Material[];
};
