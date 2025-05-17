export interface Turno {
  id: string;
  fechaHora: string; // ISO string
  estado: 'DISPONIBLE' | 'RESERVADO' | 'CANCELADO';
}
