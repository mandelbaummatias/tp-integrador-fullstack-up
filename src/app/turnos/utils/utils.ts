import { addMinutes, format, parseISO } from "date-fns";
import { es } from "date-fns/locale/es";

export const formatDateTime = (dateTimeStr: string) => {
  try {
    const date = parseISO(dateTimeStr);
    return {
      date: format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(date, 'h:mm a', { locale: es }),
      endTime: format(addMinutes(date, 30), 'h:mm a', { locale: es }),
    };
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return { date: 'Fecha inválida', time: '', endTime: '' };
  }
};