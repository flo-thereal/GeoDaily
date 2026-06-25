import { useState, useEffect, useRef, useMemo, type RefObject } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
  GeoJSON,
  Circle,
} from 'react-leaflet';
import L from 'leaflet';
import { DailyTask, type MapGuess } from '../store/useStore';
import { getDistanceFromLatLonInKm, cn } from '../lib/utils';
import { getCountryFeature, loadCountryBoundaries, fallbackRadiusKm } from '../lib/countryBoundaries';
import { scoreCapitalMapGuess, scoreCountryMapGuess, isLandmarkMapTask, scoreLandmarkMapGuess } from '../lib/mapScoring';
import { taskCountryCode } from '../lib/progress';
import { findCountry } from '../lib/countries';

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

const COUNTRY_OUTLINE_GREEN = '#176a21';
const COUNTRY_OUTLINE_RED = '#b3261e';

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

function getMaxZoomForArea(areaKm2: number): number {
  if (areaKm2 < 100) return 11;
  if (areaKm2 < 1_000) return 9;
  if (areaKm2 < 10_000) return 8;
  if (areaKm2 < 100_000) return 7;
  if (areaKm2 < 1_000_000) return 6;
  return 5;
}

function getFallbackZoomForArea(areaKm2: number): number {
  if (areaKm2 < 100) return 11;
  if (areaKm2 < 1_000) return 9;
  if (areaKm2 < 10_000) return 8;
  if (areaKm2 < 100_000) return 7;
  if (areaKm2 < 1_000_000) return 5;
  return 4;
}

function frameCountryOnMap(
  map: L.Map,
  countryCode: string,
  animate: boolean
): void {
  const country = findCountry(countryCode);
  const feature = getCountryFeature(countryCode);

  if (feature) {
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      const maxZoom = country ? getMaxZoomForArea(country.areaKm2) : 6;
      if (animate) {
        map.flyToBounds(bounds, { padding: [48, 48], maxZoom, duration: 0.8 });
      } else {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom });
      }
      return;
    }
  }

  if (country) {
    const center: [number, number] = [country.coordinates.lat, country.coordinates.lng];
    const radiusM = fallbackRadiusKm(country.areaKm2) * 1000;
    const circle = L.circle(center, { radius: radiusM });
    const circleBounds = circle.getBounds();
    if (circleBounds.isValid()) {
      const maxZoom = getMaxZoomForArea(country.areaKm2);
      if (animate) {
        map.flyToBounds(circleBounds, { padding: [48, 48], maxZoom, duration: 0.8 });
      } else {
        map.fitBounds(circleBounds, { padding: [60, 60], maxZoom });
      }
      return;
    }

    const zoom = getFallbackZoomForArea(country.areaKm2);
    if (animate) {
      map.flyTo(center, zoom, { duration: 0.8 });
    } else {
      map.setView(center, zoom);
    }
  }
}

function CountryBoundsViewport({
  countryCode,
  animate = false,
}: {
  countryCode: string;
  animate?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;

    void loadCountryBoundaries().then(() => {
      if (cancelled) return;
      frameCountryOnMap(map, countryCode, animate);
    });

    return () => {
      cancelled = true;
    };
  }, [map, countryCode, animate]);

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
  const isLandmarkMode = isLandmarkMapTask(task);
  const countryCode = taskCountryCode(task);

  const initialView = useMemo(() => {
    if (isCapitalMode && countryCode) {
      const country = findCountry(countryCode);
      if (country) {
        return {
          center: [country.coordinates.lat, country.coordinates.lng] as [number, number],
          zoom: getFallbackZoomForArea(country.areaKm2),
        };
      }
    }
    return { center: [20, 0] as [number, number], zoom: 2 };
  }, [isCapitalMode, countryCode]);

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
    if (!countryCode) {
      setCountryFeatureReady(false);
      return;
    }
    if (!isCapitalMode && !showResult) {
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

  const usesDistanceScoring = isCapitalMode || isLandmarkMode;
  const showCountryMapReveal = showResult && !usesDistanceScoring && Boolean(countryCode);
  const country = countryCode ? findCountry(countryCode) : undefined;
  const fallbackCircleRadiusM =
    showCountryMapReveal && !countryFeature && country
      ? fallbackRadiusKm(country.areaKm2) * 1000
      : null;

  const canSubmit =
    Boolean(guess && targetPos) &&
    (isCapitalMode || isLandmarkMode || Boolean(countryCode));

  const handleSubmit = async () => {
    if (!guess || !targetPos || submitting || !canSubmit) return;

    setSubmitting(true);
    try {
      if (isCapitalMode || isLandmarkMode) {
        const dist = getDistanceFromLatLonInKm(guess.lat, guess.lng, targetPos.lat, targetPos.lng);
        const result = isCapitalMode ? scoreCapitalMapGuess(dist) : scoreLandmarkMapGuess(dist);
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
  const isSuccess = usesDistanceScoring ? earnedPoints > 0 : earnedPoints === 100;

  const resultMessage = (() => {
    if (usesDistanceScoring) {
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

  const resultOutlineColor = isSuccess ? COUNTRY_OUTLINE_GREEN : COUNTRY_OUTLINE_RED;

  return (
    <div className={cn('flex flex-col gap-4 h-full w-full', className)}>
      <div
        ref={mapContainerRef}
        className="relative w-full h-[52vh] max-h-[560px] sm:h-[58vh] sm:max-h-[600px] rounded-2xl overflow-hidden border-2 border-outline-variant/30 z-0"
      >
        <MapContainer
          key={task.id}
          center={initialView.center}
          zoom={initialView.zoom}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          />
          <MapResizeHandler containerRef={mapContainerRef} />
          {isCapitalMode && countryCode && (
            <CountryBoundsViewport countryCode={countryCode} />
          )}
          {showCountryMapReveal && countryCode && (
            <CountryBoundsViewport countryCode={countryCode} animate />
          )}
          <LocationMarker position={guess} setPosition={setGuess} disabled={showResult} />
          {countryFeature && (isCapitalMode || showResult) && (
            <GeoJSON
              data={countryFeature}
              smoothFactor={0}
              style={
                isCapitalMode
                  ? {
                      color: COUNTRY_OUTLINE_GREEN,
                      weight: 2,
                      fillColor: COUNTRY_OUTLINE_GREEN,
                      fillOpacity: 0.12,
                    }
                  : {
                      color: resultOutlineColor,
                      weight: 3,
                      fillColor: resultOutlineColor,
                      fillOpacity: 0.15,
                    }
              }
            />
          )}
          {fallbackCircleRadiusM && targetPos && (
            <Circle
              center={targetPos}
              radius={fallbackCircleRadiusM}
              pathOptions={{
                color: resultOutlineColor,
                weight: 3,
                fillColor: resultOutlineColor,
                fillOpacity: 0.12,
                dashArray: '6, 8',
              }}
            />
          )}
          {showResult && usesDistanceScoring && targetPos && (
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
          {showCountryMapReveal && targetPos && (
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
        <>
          <button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || submitting}
            className="w-full bg-primary text-on-primary p-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Checking...' : 'Submit Guess'}
          </button>
          {guess && !canSubmit && (
            <p className="text-center text-sm text-on-surface-variant">
              This question cannot be scored. Please reload the challenge.
            </p>
          )}
        </>
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
