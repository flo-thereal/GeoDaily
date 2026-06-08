import { useState, useEffect, useRef, type RefObject } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
  GeoJSON,
} from 'react-leaflet';
import L from 'leaflet';
import { DailyTask, type MapGuess } from '../store/useStore';
import { getDistanceFromLatLonInKm, cn } from '../lib/utils';
import { getCountryFeature, loadCountryBoundaries } from '../lib/countryBoundaries';
import { scoreCapitalMapGuess, scoreCountryMapGuess } from '../lib/mapScoring';
import { taskCountryCode } from '../lib/progress';

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

export type MapAnswerPayload = {
  isMap: true;
  isCorrect: boolean;
  points: number;
  distance: number | null;
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

function MapResizeHandler({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    map.invalidateSize();
    return () => ro.disconnect();
  }, [map, containerRef]);
  return null;
}

export function MapQuiz({
  task,
  onAnswer,
  showResult,
  initialGuess = null,
  className,
}: {
  task: DailyTask;
  onAnswer: (answer: MapAnswerPayload) => void;
  showResult: boolean;
  initialGuess?: MapGuess | null;
  className?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [guess, setGuess] = useState<L.LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [countryFeatureReady, setCountryFeatureReady] = useState(false);

  const isCapitalMode = task.type === 'capital';
  const countryCode = taskCountryCode(task);

  useEffect(() => {
    if (initialGuess) {
      setGuess(new L.LatLng(initialGuess.lat, initialGuess.lng));
      setDistance(initialGuess.distance);
      setPoints(initialGuess.points ?? null);
    } else {
      setGuess(null);
      setDistance(null);
      setPoints(null);
    }
  }, [task, initialGuess]);

  useEffect(() => {
    if (!showResult || isCapitalMode || !countryCode) {
      setCountryFeatureReady(false);
      return;
    }

    let cancelled = false;
    void loadCountryBoundaries().then(() => {
      if (!cancelled) setCountryFeatureReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [showResult, isCapitalMode, countryCode, task.id]);

  const targetPos = task.mapCoordinates
    ? new L.LatLng(task.mapCoordinates.lat, task.mapCoordinates.lng)
    : null;

  const countryFeature =
    countryFeatureReady && countryCode ? getCountryFeature(countryCode) : undefined;

  const handleSubmit = async () => {
    if (!guess || !targetPos || submitting) return;

    setSubmitting(true);
    try {
      if (isCapitalMode) {
        const dist = getDistanceFromLatLonInKm(guess.lat, guess.lng, targetPos.lat, targetPos.lng);
        const result = scoreCapitalMapGuess(dist);
        setDistance(dist);
        setPoints(result.points);
        onAnswer({
          isMap: true,
          isCorrect: result.isCorrect,
          points: result.points,
          distance: dist,
          lat: guess.lat,
          lng: guess.lng,
        });
        return;
      }

      if (!countryCode) return;

      const result = await scoreCountryMapGuess(countryCode, guess.lat, guess.lng);
      setDistance(null);
      setPoints(result.points);
      onAnswer({
        isMap: true,
        isCorrect: result.isCorrect,
        points: result.points,
        distance: null,
        lat: guess.lat,
        lng: guess.lng,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const earnedPoints = points ?? 0;
  const isSuccess = isCapitalMode ? earnedPoints > 0 : earnedPoints === 100;

  const resultMessage = (() => {
    if (isCapitalMode) {
      if (earnedPoints >= 100) {
        return `Perfect! ${earnedPoints}/100 points — right on ${task.correctAnswer}.`;
      }
      if (earnedPoints > 0) {
        return `${earnedPoints}/100 points — ${Math.round(distance || 0)} km from ${task.correctAnswer}.`;
      }
      return `Too far! ${Math.round(distance || 0)} km from ${task.correctAnswer}.`;
    }

    if (earnedPoints === 100) {
      return `You're in ${task.correctAnswer}!`;
    }
    return `That's outside ${task.correctAnswer}.`;
  })();

  return (
    <div className={cn('flex flex-col gap-4 h-full w-full', className)}>
      <div
        ref={mapContainerRef}
        className="relative w-full h-[52vh] max-h-[560px] sm:h-[58vh] sm:max-h-[600px] rounded-2xl overflow-hidden border-2 border-outline-variant/30 z-0"
      >
        <MapContainer center={[20, 0]} zoom={2} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          />
          <MapResizeHandler containerRef={mapContainerRef} />
          <LocationMarker position={guess} setPosition={setGuess} disabled={showResult} />
          {showResult && countryFeature && (
            <GeoJSON
              data={countryFeature}
              style={{
                color: isSuccess ? '#176a21' : '#b3261e',
                weight: 2,
                fillOpacity: 0.15,
              }}
            />
          )}
          {showResult && isCapitalMode && targetPos && (
            <>
              <Marker position={targetPos} icon={targetIcon}>
                <Popup>{task.correctAnswer}</Popup>
              </Marker>
              {guess && (
                <Polyline
                  positions={[guess, targetPos]}
                  color={isSuccess ? 'green' : 'red'}
                  dashArray="5, 10"
                />
              )}
            </>
          )}
        </MapContainer>
      </div>

      {!showResult ? (
        <button
          onClick={() => void handleSubmit()}
          disabled={!guess || submitting}
          className="w-full bg-primary text-on-primary p-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Checking...' : 'Submit Guess'}
        </button>
      ) : (
        <div
          className={cn(
            'p-4 rounded-2xl text-center font-bold text-lg',
            isSuccess ? 'bg-primary-container text-on-primary-container' : 'bg-red-100 text-red-900'
          )}
        >
          {resultMessage}
        </div>
      )}
    </div>
  );
}
