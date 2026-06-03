import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { DailyTask, type MapGuess } from '../store/useStore';
import { getDistanceFromLatLonInKm, cn } from '../lib/utils';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const targetIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type MapAnswerPayload = {
  isMap: true;
  isCorrect: boolean;
  distance: number;
  lat: number;
  lng: number;
};

function LocationMarker({
  position,
  setPosition,
  disabled,
}: {
  position: L.LatLng | null;
  setPosition: (pos: L.LatLng) => void;
  disabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} icon={userIcon} />;
}

export function MapQuiz({
  task,
  onAnswer,
  showResult,
  initialGuess = null,
}: {
  task: DailyTask;
  onAnswer: (answer: MapAnswerPayload) => void;
  showResult: boolean;
  initialGuess?: MapGuess | null;
}) {
  const [guess, setGuess] = useState<L.LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (initialGuess) {
      setGuess(new L.LatLng(initialGuess.lat, initialGuess.lng));
      setDistance(initialGuess.distance);
    } else {
      setGuess(null);
      setDistance(null);
    }
  }, [task, initialGuess]);

  const targetPos = task.mapCoordinates
    ? new L.LatLng(task.mapCoordinates.lat, task.mapCoordinates.lng)
    : null;

  const handleSubmit = () => {
    if (!guess || !targetPos) return;
    const dist = getDistanceFromLatLonInKm(guess.lat, guess.lng, targetPos.lat, targetPos.lng);
    setDistance(dist);
    const isCorrect = dist <= 500;
    onAnswer({
      isMap: true,
      isCorrect,
      distance: dist,
      lat: guess.lat,
      lng: guess.lng,
    });
  };

  const withinRange = distance !== null && distance <= 500;

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border-2 border-outline-variant/30 z-0">
        <MapContainer center={[20, 0]} zoom={2} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={guess} setPosition={setGuess} disabled={showResult} />
          {showResult && targetPos && (
            <>
              <Marker position={targetPos} icon={targetIcon}>
                <Popup>{task.correctAnswer}</Popup>
              </Marker>
              {guess && (
                <Polyline
                  positions={[guess, targetPos]}
                  color={withinRange ? 'green' : 'red'}
                  dashArray="5, 10"
                />
              )}
            </>
          )}
        </MapContainer>
      </div>

      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={!guess}
          className="w-full bg-primary text-on-primary p-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit Guess
        </button>
      ) : (
        <div
          className={cn(
            'p-4 rounded-2xl text-center font-bold text-lg',
            withinRange ? 'bg-primary-container text-on-primary-container' : 'bg-red-100 text-red-900'
          )}
        >
          {withinRange ? 'Great guess!' : 'Too far!'} You were {Math.round(distance || 0)} km away from{' '}
          {task.correctAnswer}.
        </div>
      )}
    </div>
  );
}
