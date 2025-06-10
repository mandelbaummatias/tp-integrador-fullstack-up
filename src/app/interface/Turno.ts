export interface Turno {
  id: string;
  fechaHora: string;
  estado: 'DISPONIBLE' | 'RESERVADO' | 'CANCELADO';
}
