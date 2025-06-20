'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, Info, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { getAvailableTurns } from '@/action/turno/getAvailableTurnos';
import { Turno } from '../interface/Turno';
import { ReservaModal } from '../components/ui/modal/reserva-modal';
import { differenceInMinutes } from 'date-fns';
import { formatDateTime } from './utils/utils';
import Skeleton from '../components/ui/skeleton/general-skeleton';
import Error from '../components/ui/error/error';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { obtenerHoraActualLocal } from '../../utils/conversorHora';

export default function Turnos() {
  const searchParams = useSearchParams();
  const productoId = searchParams.get('productId') || '';
  const productType = searchParams.get('productType') || '';

  const { toast } = useToast();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTurnos, setSelectedTurnos] = useState<string[]>([]);
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    loadTurnos();
    const horaActual = obtenerHoraActualLocal();
    horaActual.setHours(horaActual.getHours() + 3);
    setCurrentDateTime(horaActual);
    console.log('Hora actual:', horaActual);
  }, []);

  async function loadTurnos() {
    try {
      setLoading(true);
      const result = await getAvailableTurns();

      console.log(result);

      if (result?.ok && result.turns) {

        setTurnos(result.turns.map(turno => ({ ...turno, fechaHora: turno.fechaHora.toISOString() })));
      } else {
        setError(result?.message || 'Error al cargar los turnos disponibles');
      }
    } catch (err) {
      setError('Error al cargar los turnos disponibles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }


  const isTurnoExpired = (turno: Turno) => {
    const turnoDateTime = new Date(turno.fechaHora);
    return turnoDateTime <= currentDateTime;
  };


  const handleReservaSuccess = (reservedTurnoIds: string[]) => {
    setReservaExitosa(true);


    toast({
      title: 'Reserva completada',
      description: '¡Tu reserva se ha realizado con éxito!',
      duration: 5000,
    });

    setTimeout(() => {
      setReservaExitosa(false);
    }, 5000);

    setTurnos(prevTurnos =>
      prevTurnos.filter(turno => !reservedTurnoIds.includes(turno.id))
    );

    setSelectedTurnos([]);
  };


  const wouldViolateConsecutiveRule = (turnoId: string) => {
    if (selectedTurnos.includes(turnoId)) return false;

    const turnoToCheck = turnos.find(t => t.id === turnoId);
    if (!turnoToCheck) return false;


    if (isTurnoExpired(turnoToCheck)) return true;


    const simulatedSelection = [...selectedTurnos, turnoId];


    const selectedTurnosObjects = simulatedSelection
      .map(id => turnos.find(t => t.id === id))
      .filter((t): t is Turno => !!t)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());


    let groupSize = 1;
    for (let i = 1; i < selectedTurnosObjects.length; i++) {
      const prev = new Date(selectedTurnosObjects[i - 1].fechaHora);
      const curr = new Date(selectedTurnosObjects[i].fechaHora);
      const diff = differenceInMinutes(curr, prev);

      if (diff === 30) {
        groupSize++;
        if (groupSize > 3) return true;
      } else {
        groupSize = 1;
      }
    }

    return false;
  };

  const handleCheckboxChange = (turnoId: string, checked: boolean) => {
    const turno = turnos.find(t => t.id === turnoId);

    if (checked && turno && isTurnoExpired(turno)) {
      toast({
        title: 'Turno no disponible',
        description: 'No puedes reservar un turno que ya ha comenzado o está por comenzar.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    if (checked) {
      if (wouldViolateConsecutiveRule(turnoId)) return;
      setSelectedTurnos([...selectedTurnos, turnoId]);
    } else {
      setSelectedTurnos(selectedTurnos.filter((id) => id !== turnoId));
    }
  };

  const handleReserveSelected = () => {

    const expiredTurnos = selectedTurnos.filter(id => {
      const turno = turnos.find(t => t.id === id);
      return turno && isTurnoExpired(turno);
    });

    if (expiredTurnos.length > 0) {
      toast({
        title: 'Turnos no disponibles',
        description: 'Algunos turnos seleccionados ya han comenzado. Por favor, actualiza tu selección.',
        variant: 'destructive',
        duration: 5000,
      });

      setSelectedTurnos(selectedTurnos.filter(id => !expiredTurnos.includes(id)));
      return;
    }

    console.log('Reservando turnos seleccionados:', selectedTurnos);
    setReservaModalOpen(true);
  };

  const handleReserveIndividual = (turno: Turno) => {
    if (isTurnoExpired(turno)) {
      toast({
        title: 'Turno no disponible',
        description: 'No puedes reservar un turno que ya ha comenzado o está por comenzar.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    setSelectedTurnos([turno.id]);
    setReservaModalOpen(true);
  };

  const handleCloseModal = () => {
    setReservaModalOpen(false);
    setSelectedTurnos([]);
  };


  const turnosByDate = turnos.reduce(
    (acc, turno) => {
      const { date } = formatDateTime(turno.fechaHora);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(turno);
      return acc;
    },
    {} as Record<string, Turno[]>,
  );


  const getProductTypeName = (type: string) => {
    switch (type) {
      case "JETSKY": return "Moto Acuática";
      case "CUATRICICLO": return "Cuatriciclo";
      case "EQUIPO_BUCEO": return "Equipo de Buceo";
      case "TABLA_SURF": return "Tabla de Surf";
      default: return type;
    }
  };

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Turnos Disponibles</h1>
          <p className="text-blue-700">Selecciona los horarios que deseas reservar</p>
          {productoId && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                Producto: {productoId}
              </Badge>
              {productType && (
                <Badge className="bg-green-100 text-green-800">
                  Tipo: {getProductTypeName(productType)}
                </Badge>
              )}
            </div>
          )}
        </header>

        {reservaExitosa && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700">
              ¡Tu reserva se ha completado con éxito! Los turnos seleccionados han sido reservados.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-start gap-3 text-blue-800">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Atención:</p>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1 text-blue-700">
                <li>Cada turno tiene una duración de 30 minutos</li>
                <li>Puedes reservar hasta 3 turnos consecutivos</li>
                <li>Selecciona los turnos con los checkboxes para reservar varios a la vez</li>
                <li>No puedes reservar turnos que ya han comenzado</li>
                {(productType === "JETSKY" || productType === "CUATRICICLO") && (
                  <li>Este producto permite hasta 2 personas por reserva</li>
                )}
                {(productType === "EQUIPO_BUCEO" || productType === "TABLA_SURF") && (
                  <li>Este producto es de uso individual (1 persona)</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {selectedTurnos.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium text-blue-800">
                  {selectedTurnos.length} {selectedTurnos.length === 1 ? 'turno' : 'turnos'} seleccionados
                </span>
              </div>
              <Button onClick={handleReserveSelected} className="bg-blue-600 hover:bg-blue-700">
                Reservar Seleccionados
              </Button>
            </div>
          </div>
        )}

        {Object.keys(turnosByDate).length > 0 ? (
          Object.entries(turnosByDate).map(([date, turnosForDate]) => (
            <div key={date} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-700" />
                <h2 className="text-xl font-semibold text-blue-800 capitalize">{date}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {turnosForDate.map((turno) => {
                  const { time, endTime } = formatDateTime(turno.fechaHora);
                  const isDisabled = wouldViolateConsecutiveRule(turno.id);
                  const isExpired = isTurnoExpired(turno);
                  const isUnavailable = isDisabled || isExpired;

                  return (
                    <Card
                      key={turno.id}
                      className={`border ${selectedTurnos.includes(turno.id)
                        ? 'border-blue-500 bg-blue-50'
                        : isExpired
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200'
                        } ${isExpired ? 'opacity-60' : 'hover:shadow-md'} transition-all duration-200`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className={`font-medium ${isExpired ? 'text-red-700' : 'text-blue-900'}`}>
                                {time} - {endTime}
                              </p>
                              <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-blue-700'}`}>
                                Duración: 30 minutos
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              isExpired
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }
                          >
                            {isExpired ? 'No disponible' : 'Disponible'}
                          </Badge>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`check-${turno.id}`}
                              checked={selectedTurnos.includes(turno.id)}
                              onCheckedChange={(checked) => handleCheckboxChange(turno.id, checked === true)}
                              disabled={isUnavailable}
                              className={isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}
                            />
                            <label
                              htmlFor={`check-${turno.id}`}
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isUnavailable ? 'text-gray-400' : 'text-blue-700'
                                }`}
                            >
                              {isExpired ? 'No disponible' : 'Seleccionar'}
                            </label>
                          </div>

                          <Button
                            onClick={() => handleReserveIndividual(turno)}
                            variant="outline"
                            disabled={isExpired}
                            className={
                              isExpired
                                ? "border-red-300 text-red-400 cursor-not-allowed opacity-50"
                                : "border-blue-300 text-blue-700 hover:bg-blue-50"
                            }
                          >
                            Reservar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-8 rounded-lg text-center">
            <p className="text-lg">No hay turnos disponibles en este momento.</p>
            <p className="mt-2">Por favor, intente más tarde o contacte con nuestro personal.</p>
          </div>
        )}
      </div>

      <ReservaModal
        isOpen={reservaModalOpen}
        onClose={handleCloseModal}
        turnoIds={selectedTurnos}
        fechaHora={selectedTurnos.length > 0
          ? (turnos.find(t => t.id === selectedTurnos[0])?.fechaHora || new Date().toISOString())
          : new Date().toISOString()}
        turnos={turnos}
        onReservaSuccess={handleReservaSuccess}
        productoId={productoId}
        productType={productType}
      />
    </div>
  );
}