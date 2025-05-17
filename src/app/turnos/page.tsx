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

export default function Turnos() {
  const searchParams = useSearchParams();
  const productoId = searchParams.get('productId') || '';

  const { toast } = useToast();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTurnos, setSelectedTurnos] = useState<string[]>([]);
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);

  useEffect(() => {
    loadTurnos();
  }, []);

  async function loadTurnos() {
    try {
      setLoading(true);
      const result = await getAvailableTurns();

      console.log(result);

      if (result?.ok && result.turns) {
        // Asegúrate de que la propiedad fechaHora sea una string ISO para el cliente
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

  // Function to handle successful reservation
  const handleReservaSuccess = (reservedTurnoIds: string[]) => {
    setReservaExitosa(true);

    // ✅ Show toast notification here
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

  // Función que identifica grupos de turnos consecutivos entre los seleccionados
  const wouldViolateConsecutiveRule = (turnoId: string) => {
    if (selectedTurnos.includes(turnoId)) return false;

    const turnoToCheck = turnos.find(t => t.id === turnoId);
    if (!turnoToCheck) return false;

    // Simular la selección con el nuevo turno incluido
    const simulatedSelection = [...selectedTurnos, turnoId];

    // Obtener objetos Turno y ordenarlos por fecha
    const selectedTurnosObjects = simulatedSelection
      .map(id => turnos.find(t => t.id === id))
      .filter((t): t is Turno => !!t)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

    // Revisar todos los grupos consecutivos
    let groupSize = 1;
    for (let i = 1; i < selectedTurnosObjects.length; i++) {
      const prev = new Date(selectedTurnosObjects[i - 1].fechaHora);
      const curr = new Date(selectedTurnosObjects[i].fechaHora);
      const diff = differenceInMinutes(curr, prev);

      if (diff === 30) {
        groupSize++;
        if (groupSize > 3) return true; // violación detectada
      } else {
        groupSize = 1; // reiniciar si no son consecutivos
      }
    }

    return false;
  };

  const handleCheckboxChange = (turnoId: string, checked: boolean) => {
    if (checked) {
      if (wouldViolateConsecutiveRule(turnoId)) return;
      setSelectedTurnos([...selectedTurnos, turnoId]);
    } else {
      setSelectedTurnos(selectedTurnos.filter((id) => id !== turnoId));
    }
  };

  const handleReserveSelected = () => {
    console.log('Reservando turnos seleccionados:', selectedTurnos);
    setReservaModalOpen(true);
  };

  const handleReserveIndividual = (turno: Turno) => {
    setSelectedTurnos([turno.id]); // ← Esto reemplaza todos los turnos seleccionados con uno solo
    setReservaModalOpen(true);
  };

  const handleCloseModal = () => {
    setReservaModalOpen(false);
    setSelectedTurnos([]);
  };

  // Agrupar turnos por fecha
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
            <Badge className="mt-2 bg-blue-100 text-blue-800">
              Producto seleccionado: {productoId}
            </Badge>
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

                  return (
                    <Card
                      key={turno.id}
                      className={`border ${selectedTurnos.includes(turno.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        } hover:shadow-md transition-all duration-200`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">
                                {time} - {endTime}
                              </p>
                              <p className="text-sm text-blue-700">Duración: 30 minutos</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Disponible
                          </Badge>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`check-${turno.id}`}
                              checked={selectedTurnos.includes(turno.id)}
                              onCheckedChange={(checked) => handleCheckboxChange(turno.id, checked === true)}
                              disabled={isDisabled}
                              className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            />
                            <label
                              htmlFor={`check-${turno.id}`}
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDisabled ? 'text-gray-400' : 'text-blue-700'
                                }`}
                            >
                              Seleccionar
                            </label>
                          </div>

                          <Button
                            onClick={() => handleReserveIndividual(turno)}
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
      />
    </div>
  );
}