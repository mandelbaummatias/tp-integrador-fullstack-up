import prisma from "@/lib/prisma";
import { TipoProducto, TipoTabla } from "@prisma/client";

const validateProductoData = (data: {
  tipo: TipoProducto;
  capacidadMax?: number;
  tipoTabla?: TipoTabla;
}): string | null => {
  const { tipo, capacidadMax, tipoTabla } = data;

  if ((tipo === TipoProducto.TABLA_SURF || tipo === TipoProducto.EQUIPO_BUCEO) && capacidadMax !== undefined) {
    return 'La capacidad máxima no debe ser especificada para productos de tipo TABLA_SURF o EQUIPO_BUCEO.';
  }

  if (tipo !== TipoProducto.TABLA_SURF) {
    if (tipoTabla != undefined || (tipoTabla == TipoTabla.ADULTO && tipoTabla == TipoTabla.NINO)) {
      return 'No es un TIPO_TABLA y no debe especificarse';
    }
  } else if (tipo == TipoProducto.TABLA_SURF) {
    if (tipoTabla === undefined || (tipoTabla !== TipoTabla.ADULTO && tipoTabla !== TipoTabla.NINO)) {
      return 'El tipo de tabla (ADULTO o NINO) debe ser especificado para productos que son de tipo TABLA_SURF.';
    }
  }



  return null;
};


export const createProductoWithValidation = async (data: {
  id: string;
  nombre: string;
  precio: number;
  tipo: TipoProducto;
  capacidadMax?: number;
  tipoTabla?: TipoTabla;
}) => {
  const validationError = validateProductoData(data);

  if (validationError) {
    throw new Error(`Error de validación: ${validationError}`);
  }

  try {
    const productoCreado = await prisma.producto.create({
      data: {
        id: data.id,
        nombre: data.nombre,
        precio: data.precio,
        tipo: data.tipo,
        capacidadMax: data.capacidadMax,
        tipoTabla: data.tipoTabla,
      },
    });
    return productoCreado;
  } catch (error: unknown) {
    console.error('Error al crear el producto:', error);
    if (error instanceof Error) {
      throw new Error(`Error al crear el producto: ${error.message}`);
    } else {
      throw new Error('Error al crear el producto: Error desconocido');
    }
  }
};